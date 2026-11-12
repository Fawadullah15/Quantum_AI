import { readZipEntries, validateSafeXml, decodeXmlEntities } from './zip';

export interface DocxExtractionResult {
  text: string;
  paragraphCount: number;
  tableCount: number;
  charCount: number;
  truncated: boolean;
}

const MAX_EXTRACTED_CHARS = 120000;

/**
 * Extracts structured text, headings, and Markdown-formatted tables from a DOCX buffer.
 */
export function extractDocxText(buffer: Buffer): DocxExtractionResult {
  const entries = readZipEntries(buffer);

  // Block macro-enabled components & ActiveX scripts
  for (const name of entries.keys()) {
    const lower = name.toLowerCase();
    if (lower.endsWith('vbaproject.bin') || lower.includes('/activex/')) {
      throw new Error('Macro-enabled or ActiveX Word documents are rejected by QuantumBot file security.');
    }
  }

  const docEntry = entries.get('word/document.xml');
  if (!docEntry) {
    throw new Error('Invalid DOCX archive: missing word/document.xml.');
  }

  const sections: string[] = [];
  let paragraphCount = 0;
  let tableCount = 0;

  // Optional headers
  for (const [name, entry] of entries.entries()) {
    if (/^word\/header\d*\.xml$/i.test(name)) {
      const xml = entry.data.toString('utf8');
      validateSafeXml(xml, name);
      const headerText = extractParagraphRuns(xml).join(' ').trim();
      if (headerText) {
        sections.push(`[Header] ${headerText}`);
      }
    }
  }

  const mainXml = docEntry.data.toString('utf8');
  validateSafeXml(mainXml, 'word/document.xml');

  const bodyMatch = mainXml.match(/<w:body\b[^>]*>([\s\S]*?)<\/w:body>/i);
  const bodyXml = bodyMatch ? bodyMatch[1] : mainXml;

  // Walk top-level <w:p> and <w:tbl> blocks sequentially while respecting nesting
  const blocks = extractTopLevelBlocks(bodyXml);
  for (const block of blocks) {
    if (block.type === 'paragraph') {
      const parsed = formatParagraphBlock(block.xml);
      if (parsed) {
        paragraphCount++;
        sections.push(parsed);
      }
    } else if (block.type === 'table') {
      const tableMd = formatTableBlock(block.xml);
      if (tableMd) {
        tableCount++;
        sections.push(tableMd);
      }
    }
  }

  // Optional footnotes
  const footnotesEntry = entries.get('word/footnotes.xml');
  if (footnotesEntry) {
    const fXml = footnotesEntry.data.toString('utf8');
    validateSafeXml(fXml, 'word/footnotes.xml');
    const notes = extractParagraphRuns(fXml).filter((n) => n.trim().length > 0);
    if (notes.length > 0) {
      sections.push(`\n### Footnotes\n${notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`);
    }
  }

  let fullText = sections.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
  let truncated = false;

  if (fullText.length > MAX_EXTRACTED_CHARS) {
    fullText = `${fullText.slice(0, MAX_EXTRACTED_CHARS)}\n\n[Document truncated at ${MAX_EXTRACTED_CHARS.toLocaleString()} characters due to length]`;
    truncated = true;
  }

  return {
    text: fullText,
    paragraphCount,
    tableCount,
    charCount: fullText.length,
    truncated,
  };
}

function extractTopLevelBlocks(bodyXml: string): Array<{ type: 'paragraph' | 'table'; xml: string }> {
  const result: Array<{ type: 'paragraph' | 'table'; xml: string }> = [];
  let cursor = 0;

  while (cursor < bodyXml.length) {
    const nextP = bodyXml.indexOf('<w:p', cursor);
    const nextTbl = bodyXml.indexOf('<w:tbl', cursor);

    let start = -1;
    let type: 'paragraph' | 'table' | null = null;

    if (nextP !== -1 && (nextTbl === -1 || nextP < nextTbl)) {
      // Ensure exact tag match <w:p> or <w:p ...>
      const after = bodyXml[nextP + 4];
      if (after === '>' || after === ' ' || after === '\t' || after === '\n' || after === '/') {
        start = nextP;
        type = 'paragraph';
      } else {
        cursor = nextP + 4;
        continue;
      }
    } else if (nextTbl !== -1) {
      const after = bodyXml[nextTbl + 6];
      if (after === '>' || after === ' ' || after === '\t' || after === '\n') {
        start = nextTbl;
        type = 'table';
      } else {
        cursor = nextTbl + 6;
        continue;
      }
    } else {
      break;
    }

    const openTag = type === 'paragraph' ? '<w:p' : '<w:tbl';
    const closeTag = type === 'paragraph' ? '</w:p>' : '</w:tbl>';

    // Handle self-closing <w:p .../>
    const firstTagEnd = bodyXml.indexOf('>', start);
    if (firstTagEnd === -1) break;
    if (bodyXml[firstTagEnd - 1] === '/') {
      cursor = firstTagEnd + 1;
      continue;
    }

    // Track tag nesting depth cleanly
    let depth = 1;
    let searchPos = firstTagEnd + 1;
    while (depth > 0 && searchPos < bodyXml.length) {
      const nextOpen = bodyXml.indexOf(openTag, searchPos);
      const nextClose = bodyXml.indexOf(closeTag, searchPos);

      if (nextClose === -1) {
        searchPos = bodyXml.length;
        break;
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        const ch = bodyXml[nextOpen + openTag.length];
        if (ch === '>' || ch === ' ' || ch === '\t' || ch === '\n') {
          depth++;
        }
        searchPos = nextOpen + openTag.length;
      } else {
        depth--;
        searchPos = nextClose + closeTag.length;
      }
    }

    result.push({ type, xml: bodyXml.slice(start, searchPos) });
    cursor = searchPos;
  }

  return result;
}

function formatParagraphBlock(pXml: string): string {
  const styleMatch = pXml.match(/<w:pStyle\s+w:val="([^"]+)"/i);
  const style = styleMatch ? styleMatch[1].toLowerCase() : '';
  const hasNumPr = /<w:numPr\b/i.test(pXml);

  const text = extractInlineRuns(pXml).trim();
  if (!text) return '';

  if (style.includes('title')) return `# ${text}`;
  if (style.includes('heading1') || style === 'h1') return `# ${text}`;
  if (style.includes('heading2') || style === 'h2') return `## ${text}`;
  if (style.includes('heading3') || style === 'h3') return `### ${text}`;
  if (style.includes('heading4') || style === 'h4') return `#### ${text}`;
  if (hasNumPr || style.includes('list')) return `- ${text}`;

  return text;
}

function formatTableBlock(tblXml: string): string {
  const rows: string[][] = [];
  const rowRegex = /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowRegex.exec(tblXml)) !== null) {
    const cells: string[] = [];
    const cellRegex = /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/gi;
    let cellMatch: RegExpExecArray | null;

    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      const paras = extractParagraphRuns(cellMatch[1]);
      const cellText = paras
        .join(' ')
        .replace(/\|/g, '\\|')
        .replace(/\s+/g, ' ')
        .trim();
      cells.push(cellText);
    }

    if (cells.some((c) => c.length > 0)) {
      rows.push(cells);
    }
  }

  if (rows.length === 0) return '';

  const maxCols = Math.max(...rows.map((r) => r.length));
  const normalizeRow = (r: string[]) => {
    const padded = [...r];
    while (padded.length < maxCols) padded.push('');
    return `| ${padded.join(' | ')} |`;
  };

  const lines: string[] = [];
  lines.push(normalizeRow(rows[0]));
  lines.push(`| ${Array(maxCols).fill('---').join(' | ')} |`);
  for (let i = 1; i < rows.length; i++) {
    lines.push(normalizeRow(rows[i]));
  }
  return lines.join('\n');
}

function extractParagraphRuns(xml: string): string[] {
  const results: string[] = [];
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/gi;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(xml)) !== null) {
    const txt = extractInlineRuns(match[1]).trim();
    if (txt) results.push(txt);
  }
  return results;
}

function extractInlineRuns(xml: string): string {
  // Replace tabs & breaks then extract all <w:t> content
  const normalized = xml
    .replace(/<w:tab\s*\/>/gi, '\t')
    .replace(/<w:br\s*[^>]*\/>/gi, '\n')
    .replace(/<w:cr\s*\/>/gi, '\n');

  let out = '';
  const tokenRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>|<w:(tab|br|cr)\b[^>]*\/>/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(normalized)) !== null) {
    if (match[1] !== undefined) {
      out += decodeXmlEntities(match[1]);
    }
  }

  // Fallback for pre-replaced text or inline strings if tokenRegex missed anything
  if (!out) {
    const stripped = normalized.replace(/<[^>]+>/g, '');
    out = decodeXmlEntities(stripped);
  }
  return out;
}
