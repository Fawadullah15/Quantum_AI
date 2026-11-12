export interface CsvExtractionResult {
  text: string;
  rowCount: number;
  columnCount: number;
  charCount: number;
  truncated: boolean;
}

const MAX_TABLE_ROWS = 300;
const MAX_COLS = 50;
const MAX_OUTPUT_CHARS = 120000;

/**
 * Parses RFC 4180 CSV/TSV text into a clean summary + Markdown table.
 */
export function extractCsvText(rawText: string, filename: string): CsvExtractionResult {
  const cleanText = rawText.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM
  const firstLine = cleanText.split(/\r?\n/)[0] || '';

  let delimiter = ',';
  if (filename.toLowerCase().endsWith('.tsv') || (firstLine.includes('\t') && !firstLine.includes(','))) {
    delimiter = '\t';
  } else if ((firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length) {
    delimiter = ';';
  }

  const rows = parseDelimitedRows(cleanText, delimiter);
  const nonEmptyRows = rows.filter((r) => r.some((cell) => cell.trim() !== ''));
  const totalRows = nonEmptyRows.length;
  const colCount = nonEmptyRows.length > 0 ? Math.min(MAX_COLS, Math.max(...nonEmptyRows.map((r) => r.length))) : 0;

  if (totalRows === 0 || colCount === 0) {
    return {
      text: '[Empty CSV file]',
      rowCount: 0,
      columnCount: 0,
      charCount: 16,
      truncated: false,
    };
  }

  const displayRows = nonEmptyRows.slice(0, MAX_TABLE_ROWS);
  let truncated = totalRows > MAX_TABLE_ROWS;

  const formatRow = (r: string[]) => {
    const cells: string[] = [];
    for (let i = 0; i < colCount; i++) {
      cells.push((r[i] || '').replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim());
    }
    return `| ${cells.join(' | ')} |`;
  };

  const lines: string[] = [];
  lines.push(`CSV Summary: ${totalRows} rows × ${colCount} columns (delimiter: ${delimiter === '\t' ? 'TAB' : `"${delimiter}"`})`);
  lines.push('');
  lines.push(formatRow(displayRows[0]));
  lines.push(`| ${Array(colCount).fill('---').join(' | ')} |`);
  for (let i = 1; i < displayRows.length; i++) {
    lines.push(formatRow(displayRows[i]));
  }

  if (truncated) {
    lines.push('');
    lines.push(`*Showing first ${MAX_TABLE_ROWS} rows out of ${totalRows} total rows.*`);
  }

  let output = lines.join('\n');
  if (output.length > MAX_OUTPUT_CHARS) {
    output = `${output.slice(0, MAX_OUTPUT_CHARS)}\n\n[CSV output truncated at ${MAX_OUTPUT_CHARS.toLocaleString()} characters]`;
    truncated = true;
  }

  return {
    text: output,
    rowCount: totalRows,
    columnCount: colCount,
    charCount: output.length,
    truncated,
  };
}

function parseDelimitedRows(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        row.push(field);
        field = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
