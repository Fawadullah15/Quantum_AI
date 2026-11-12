import { readZipEntries, validateSafeXml, decodeXmlEntities } from './zip';

export interface XlsxExtractionResult {
  text: string;
  sheetNames: string[];
  totalRows: number;
  charCount: number;
  truncated: boolean;
}

const MAX_ROWS_PER_SHEET = 250;
const MAX_COLS_PER_SHEET = 40;
const MAX_EXTRACTED_CHARS = 120000;

/**
 * Extracts structured Markdown tables from all worksheets in an OOXML XLSX buffer.
 */
export function extractXlsxData(buffer: Buffer): XlsxExtractionResult {
  const entries = readZipEntries(buffer);

  // Security: Reject macro-enabled spreadsheets
  for (const name of entries.keys()) {
    const lower = name.toLowerCase();
    if (lower.endsWith('vbaproject.bin') || lower.includes('/activex/')) {
      throw new Error('Macro-enabled or ActiveX spreadsheets are rejected by QuantumBot file security.');
    }
  }

  const workbookEntry = entries.get('xl/workbook.xml');
  if (!workbookEntry) {
    throw new Error('Invalid XLSX archive: missing xl/workbook.xml.');
  }

  const workbookXml = workbookEntry.data.toString('utf8');
  validateSafeXml(workbookXml, 'xl/workbook.xml');

  // Parse shared strings lookup table
  const sharedStrings = parseSharedStrings(entries);

  // Map rId -> worksheet target path
  const relMap = new Map<string, string>();
  const relsEntry = entries.get('xl/_rels/workbook.xml.rels');
  if (relsEntry) {
    const relsXml = relsEntry.data.toString('utf8');
    validateSafeXml(relsXml, 'xl/_rels/workbook.xml.rels');
    const relRegex = /<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"/gi;
    let m: RegExpExecArray | null;
    while ((m = relRegex.exec(relsXml)) !== null) {
      const target = m[2].replace(/^\/+/, '');
      const fullPath = target.startsWith('xl/') ? target : `xl/${target}`;
      relMap.set(m[1], fullPath);
    }
  }

  // Enumerate ordered sheets from workbook.xml
  const sheetsToRead: Array<{ name: string; path: string }> = [];
  const sheetRegex = /<sheet\b([^>]+)\/?>/gi;
  let sheetMatch: RegExpExecArray | null;
  let sheetIdx = 1;

  while ((sheetMatch = sheetRegex.exec(workbookXml)) !== null) {
    const attrs = sheetMatch[1];
    const nameMatch = attrs.match(/\bname="([^"]+)"/i);
    const rIdMatch = attrs.match(/\br:id="([^"]+)"/i);

    const sheetName = nameMatch ? decodeXmlEntities(nameMatch[1]) : `Sheet${sheetIdx}`;
    const targetPath = (rIdMatch && relMap.get(rIdMatch[1])) || `xl/worksheets/sheet${sheetIdx}.xml`;
    sheetsToRead.push({ name: sheetName, path: targetPath });
    sheetIdx++;
  }

  // Fallback scan if workbook.xml didn't specify sheets explicitly
  if (sheetsToRead.length === 0) {
    for (const path of entries.keys()) {
      if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(path)) {
        sheetsToRead.push({ name: path.split('/').pop()!.replace('.xml', ''), path });
      }
    }
  }

  const sheetNames: string[] = [];
  const outputSections: string[] = [];
  let totalRows = 0;
  let truncated = false;

  for (const sheet of sheetsToRead) {
    const entry = entries.get(sheet.path);
    if (!entry) continue;

    sheetNames.push(sheet.name);
    const sheetXml = entry.data.toString('utf8');
    validateSafeXml(sheetXml, sheet.path);

    const parsedSheet = parseWorksheetXml(sheetXml, sharedStrings);
    totalRows += parsedSheet.rowCount;

    if (parsedSheet.truncated) truncated = true;

    const header = `### Sheet: ${sheet.name} (${parsedSheet.rowCount} rows × ${parsedSheet.colCount} columns)`;
    outputSections.push(`${header}\n\n${parsedSheet.markdownTable}`);
  }

  let fullText = outputSections.join('\n\n').trim();
  if (!fullText) {
    fullText = '[Empty XLSX workbook — no populated cells found]';
  } else if (fullText.length > MAX_EXTRACTED_CHARS) {
    fullText = `${fullText.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Spreadsheet output truncated at ${MAX_EXTRACTED_CHARS.toLocaleString()} characters]`;
    truncated = true;
  }

  return {
    text: fullText,
    sheetNames,
    totalRows,
    charCount: fullText.length,
    truncated,
  };
}

function parseSharedStrings(entries: Map<string, { data: Buffer }>): string[] {
  const ssEntry = entries.get('xl/sharedStrings.xml');
  if (!ssEntry) return [];

  const xml = ssEntry.data.toString('utf8');
  validateSafeXml(xml, 'xl/sharedStrings.xml');

  const strings: string[] = [];
  const siRegex = /<si\b[^>]*>([\s\S]*?)<\/si>/gi;
  let match: RegExpExecArray | null;

  while ((match = siRegex.exec(xml)) !== null) {
    let cellText = '';
    const tRegex = /<t\b[^>]*>([\s\S]*?)<\/t>/gi;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = tRegex.exec(match[1])) !== null) {
      cellText += decodeXmlEntities(tMatch[1]);
    }
    strings.push(cellText);
  }

  return strings;
}

function columnLettersToIndex(letters: string): number {
  let index = 0;
  for (let i = 0; i < letters.length; i++) {
    index = index * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, index - 1);
}

function parseWorksheetXml(
  xml: string,
  sharedStrings: string[]
): { markdownTable: string; rowCount: number; colCount: number; truncated: boolean } {
  const grid: string[][] = [];
  let maxCol = 0;
  let actualRowCount = 0;
  let truncated = false;

  const rowRegex = /<row\b[^>]*>([\s\S]*?)<\/row>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(xml)) !== null) {
    actualRowCount++;
    if (grid.length >= MAX_ROWS_PER_SHEET) {
      truncated = true;
      continue; // Keep counting total rows accurately
    }

    const rowValues: string[] = [];
    const cellRegex = /<c\b([^>]*)>([\s\S]*?)<\/c>/gi;
    let cellMatch: RegExpExecArray | null;
    let fallbackColIdx = 0;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const attrs = cellMatch[1];
      const inner = cellMatch[2];

      const refMatch = attrs.match(/\br="([A-Z]+)\d+"/i);
      const colIdx = refMatch ? columnLettersToIndex(refMatch[1].toUpperCase()) : fallbackColIdx;
      fallbackColIdx = colIdx + 1;

      if (colIdx >= MAX_COLS_PER_SHEET) {
        truncated = true;
        continue;
      }

      const typeMatch = attrs.match(/\bt="([^"]+)"/i);
      const cellType = typeMatch ? typeMatch[1] : 'n';

      let val = '';
      if (cellType === 'inlineStr') {
        const tMatch = inner.match(/<t\b[^>]*>([\s\S]*?)<\/t>/i);
        val = tMatch ? decodeXmlEntities(tMatch[1]) : '';
      } else {
        const vMatch = inner.match(/<v\b[^>]*>([\s\S]*?)<\/v>/i);
        const rawV = vMatch ? decodeXmlEntities(vMatch[1]) : '';

        if (cellType === 's') {
          const ssIdx = parseInt(rawV, 10);
          val = Number.isFinite(ssIdx) && sharedStrings[ssIdx] !== undefined ? sharedStrings[ssIdx] : rawV;
        } else if (cellType === 'b') {
          val = rawV === '1' ? 'TRUE' : 'FALSE';
        } else {
          val = rawV;
        }
      }

      val = val.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim();
      if (val !== '') {
        while (rowValues.length <= colIdx) rowValues.push('');
        rowValues[colIdx] = val;
        if (colIdx + 1 > maxCol) maxCol = colIdx + 1;
      }
    }

    if (rowValues.some((v) => v !== '')) {
      grid.push(rowValues);
    }
  }

  if (grid.length === 0 || maxCol === 0) {
    return {
      markdownTable: '*(No non-empty cells in worksheet)*',
      rowCount: actualRowCount,
      colCount: 0,
      truncated: false,
    };
  }

  const normalizeRow = (r: string[]) => {
    const padded = [...r];
    while (padded.length < maxCol) padded.push('');
    return `| ${padded.join(' | ')} |`;
  };

  const mdLines: string[] = [];
  mdLines.push(normalizeRow(grid[0]));
  mdLines.push(`| ${Array(maxCol).fill('---').join(' | ')} |`);
  for (let i = 1; i < grid.length; i++) {
    mdLines.push(normalizeRow(grid[i]));
  }
  if (truncated) {
    mdLines.push(`\n*Showing first ${grid.length} populated rows out of ${actualRowCount} total rows in this sheet.*`);
  }

  return {
    markdownTable: mdLines.join('\n'),
    rowCount: actualRowCount,
    colCount: maxCol,
    truncated,
  };
}
