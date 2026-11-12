import { inflateSync, inflateRawSync } from 'zlib';

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  charCount: number;
  truncated: boolean;
  isScannedOrImageOnly: boolean;
  note?: string;
}

const MAX_EXTRACTED_CHARS = 120000;
const MAX_STREAM_INFLATE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_INFLATE_BYTES = 35 * 1024 * 1024;

interface PdfStreamBlock {
  dict: string;
  data: Buffer;
}

/**
 * Extracts readable text and structural metadata from a PDF buffer using pure Node.js (zero external native/WASM deps).
 * Note: Providers with native PDF support (Gemini, Anthropic) also receive the raw PDF bytes so charts/scanned pages are read visually.
 */
export function extractPdfText(buffer: Buffer): PdfExtractionResult {
  const headerSlice = buffer.subarray(0, Math.min(1024, buffer.length)).toString('latin1');
  if (!headerSlice.includes('%PDF-')) {
    throw new Error('Invalid PDF file header.');
  }

  const latin1 = buffer.toString('latin1');

  // Security: Reject PDFs containing OS command execution launch actions
  if (/\/Action\b[\s\S]{0,120}\/S\s*\/Launch\b/i.test(latin1) || /\/S\s*\/Launch\b/i.test(latin1)) {
    throw new Error('Blocked unsafe PDF containing an external /Launch command execution action.');
  }

  // Extract all streams from the PDF body
  const streams = extractPdfStreams(buffer, latin1);

  // Decompress streams and build combined search corpus (for Page count, ObjStm, ToUnicode, and content operators)
  let totalInflatedBytes = 0;
  const decodedTexts: string[] = [];
  const toUnicodeMap = new Map<string, string>();
  let extraPageObjectsFound = 0;

  for (const s of streams) {
    let rawStream = s.data;
    const isFlate = /\/Filter\b[^>\]]*\/FlateDecode\b/i.test(s.dict) || /\/FlateDecode\b/i.test(s.dict);
    const isAsciiHex = /\/ASCIIHexDecode\b/i.test(s.dict);
    const isAscii85 = /\/ASCII85Decode\b/i.test(s.dict);

    try {
      if (isAsciiHex) {
        rawStream = decodeAsciiHex(rawStream);
      }
      if (isAscii85) {
        rawStream = decodeAscii85(rawStream);
      }
      if (isFlate) {
        rawStream = safeInflate(rawStream);
      }
    } catch {
      // Some streams are compressed images (/DCTDecode, /JPXDecode) or unsupported predictors — safely skip
      continue;
    }

    totalInflatedBytes += rawStream.length;
    if (totalInflatedBytes > MAX_TOTAL_INFLATE_BYTES) {
      break;
    }

    // Check if stream looks like binary raster image data (/Subtype /Image)
    if (/\/Subtype\s*\/Image\b/i.test(s.dict)) {
      continue;
    }

    const decoded = rawStream.toString('latin1');

    // Parse ToUnicode CMap tables if present
    if (decoded.includes('beginbfchar') || decoded.includes('beginbfrange')) {
      parseToUnicodeCMap(decoded, toUnicodeMap);
      continue;
    }

    // Object streams (/ObjStm) can hold compressed /Type /Page dictionaries
    if (/\/Type\s*\/ObjStm\b/i.test(s.dict)) {
      const objPages = (decoded.match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
      extraPageObjectsFound += objPages;
      continue;
    }

    // Check if stream contains PDF text operators (BT/ET or Tj/TJ)
    if (/\bBT\b/.test(decoded) && (/\bTj\b|\bTJ\b/.test(decoded) || /['"]\s*[\r\n]/.test(decoded))) {
      decodedTexts.push(decoded);
    }
  }

  // Estimate page count reliably
  const directPageMatches = (latin1.match(/\/Type\s*\/Page\b(?!s)/g) || []).length;
  let pageCount = directPageMatches + extraPageObjectsFound;
  if (pageCount === 0) {
    // Fallback to /Pages /Count N
    const countMatches = [...latin1.matchAll(/\/Count\s+(\d+)/g)].map((m) => parseInt(m[1], 10));
    if (countMatches.length > 0) {
      pageCount = Math.max(...countMatches);
    }
  }
  if (pageCount === 0) pageCount = 1;

  // Fallback for uncompressed inline content streams not matched via dictionary check
  if (decodedTexts.length === 0) {
    const inlineBtMatches = latin1.match(/\bBT\b[\s\S]{1,16000}?\bET\b/g);
    if (inlineBtMatches && inlineBtMatches.length > 0) {
      decodedTexts.push(inlineBtMatches.join('\n'));
    }
  }

  // Extract human-readable text across decoded content streams
  const extractedParagraphs: string[] = [];
  for (const content of decodedTexts) {
    const chunk = parseContentStreamText(content, toUnicodeMap);
    if (chunk) {
      extractedParagraphs.push(chunk);
    }
  }

  let text = extractedParagraphs
    .join('\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Check if the PDF appears scanned / image-only (few alphanumeric characters extracted)
  const alphanumericCount = (text.match(/[A-Za-z0-9]/g) || []).length;
  const isScannedOrImageOnly = alphanumericCount < 35;

  let truncated = false;
  if (text.length > MAX_EXTRACTED_CHARS) {
    text = `${text.slice(0, MAX_EXTRACTED_CHARS)}\n\n[PDF text truncated at ${MAX_EXTRACTED_CHARS.toLocaleString()} characters]`;
    truncated = true;
  }

  let note: string | undefined;
  if (isScannedOrImageOnly) {
    note =
      'Minimal selectable text found in this PDF (it may be scanned, image-based, or vector-outlined). Vision-capable models such as Gemini will still inspect the PDF pages directly.';
    if (!text) {
      text = `[Scanned or image-based PDF (${pageCount} page${pageCount === 1 ? '' : 's'}) — no embedded text stream extracted.]`;
    }
  }

  return {
    text,
    pageCount,
    charCount: text.length,
    truncated,
    isScannedOrImageOnly,
    note,
  };
}

function extractPdfStreams(buffer: Buffer, latin1: string): PdfStreamBlock[] {
  const results: PdfStreamBlock[] = [];
  const streamRegex = /<<([\s\S]{0,4096}?)>>\s*stream(?:\r\n|\n|\r)/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(latin1)) !== null) {
    const dict = match[1];
    const dataStart = match.index + match[0].length;
    const endIdx = latin1.indexOf('endstream', dataStart);
    if (endIdx === -1) break;

    let dataEnd = endIdx;
    // Strip trailing EOL before endstream if present
    if (dataEnd > dataStart && latin1[dataEnd - 1] === '\n') dataEnd--;
    if (dataEnd > dataStart && latin1[dataEnd - 1] === '\r') dataEnd--;

    if (dataEnd > dataStart && dataEnd - dataStart <= MAX_STREAM_INFLATE_BYTES) {
      results.push({
        dict,
        data: buffer.subarray(dataStart, dataEnd),
      });
    }

    streamRegex.lastIndex = endIdx + 9;
  }

  return results;
}

function safeInflate(data: Buffer): Buffer {
  try {
    return inflateSync(data, { maxOutputLength: MAX_STREAM_INFLATE_BYTES });
  } catch {
    return inflateRawSync(data, { maxOutputLength: MAX_STREAM_INFLATE_BYTES });
  }
}

function decodeAsciiHex(buf: Buffer): Buffer {
  const hex = buf.toString('latin1').replace(/[^0-9a-fA-F]/g, '');
  const padded = hex.length % 2 === 1 ? `${hex}0` : hex;
  return Buffer.from(padded, 'hex');
}

function decodeAscii85(buf: Buffer): Buffer {
  const raw = buf.toString('latin1').replace(/~>[\s\S]*$/, '');
  const out: number[] = [];
  let tuple = 0;
  let count = 0;

  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code <= 32) continue; // whitespace
    if (code === 122 && count === 0) {
      // 'z' => four zero bytes
      out.push(0, 0, 0, 0);
      continue;
    }
    if (code < 33 || code > 117) continue;
    tuple = tuple * 85 + (code - 33);
    count++;
    if (count === 5) {
      out.push((tuple >>> 24) & 0xff, (tuple >>> 16) & 0xff, (tuple >>> 8) & 0xff, tuple & 0xff);
      tuple = 0;
      count = 0;
    }
  }

  if (count > 1) {
    for (let i = count; i < 5; i++) {
      tuple = tuple * 85 + 84;
    }
    const paddedBytes = count - 1;
    for (let b = 0; b < paddedBytes; b++) {
      out.push((tuple >>> ((3 - b) * 8)) & 0xff);
    }
  }

  return Buffer.from(out);
}

function parseToUnicodeCMap(cmap: string, map: Map<string, string>): void {
  const charBlockRegex = /beginbfchar([\s\S]*?)endbfchar/g;
  let m: RegExpExecArray | null;
  while ((m = charBlockRegex.exec(cmap)) !== null) {
    const pairRegex = /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/g;
    let p: RegExpExecArray | null;
    while ((p = pairRegex.exec(m[1])) !== null) {
      map.set(p[1].toUpperCase(), hexToUtf16String(p[2]));
    }
  }

  const rangeBlockRegex = /beginbfrange([\s\S]*?)endbfrange/g;
  while ((m = rangeBlockRegex.exec(cmap)) !== null) {
    const lines = m[1].split(/\r?\n/);
    for (const line of lines) {
      const rangeMatch = line.match(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>/);
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 16);
        const end = parseInt(rangeMatch[2], 16);
        let dst = parseInt(rangeMatch[3], 16);
        const padLen = rangeMatch[1].length;
        if (end - start <= 512) {
          for (let code = start; code <= end; code++) {
            const key = code.toString(16).toUpperCase().padStart(padLen, '0');
            map.set(key, String.fromCodePoint(dst));
            dst++;
          }
        }
      }
    }
  }
}

function hexToUtf16String(hex: string): string {
  const clean = hex.length % 2 === 1 ? `${hex}0` : hex;
  if (clean.length === 4) {
    return String.fromCharCode(parseInt(clean, 16));
  }
  let out = '';
  for (let i = 0; i + 3 < clean.length; i += 4) {
    const code = parseInt(clean.slice(i, i + 4), 16);
    if (code > 0) out += String.fromCharCode(code);
  }
  return out || Buffer.from(clean, 'hex').toString('utf8');
}

function parseContentStreamText(content: string, toUnicode: Map<string, string>): string {
  const outLines: string[] = [];
  let currentLine = '';

  const btBlocks = content.match(/\bBT\b[\s\S]*?\bET\b/g) || [content];

  for (const block of btBlocks) {
    // Walk tokens sequentially inside BT..ET
    let i = 0;
    while (i < block.length) {
      const ch = block[i];

      // Literal PDF string (...)
      if (ch === '(') {
        const parsed = readPdfLiteralString(block, i);
        i = parsed.nextIndex;
        // Check trailing operator (Tj, ', ")
        const trailing = block.slice(i, i + 8).trimStart();
        if (trailing.startsWith('Tj') || trailing.startsWith("'") || trailing.startsWith('"')) {
          if (trailing.startsWith("'") || trailing.startsWith('"')) {
            if (currentLine.trim()) outLines.push(currentLine.trimEnd());
            currentLine = parsed.text;
          } else {
            currentLine += parsed.text;
          }
        }
        continue;
      }

      // Hex string <...> followed by Tj
      if (ch === '<' && block[i + 1] !== '<') {
        const end = block.indexOf('>', i + 1);
        if (end !== -1) {
          const hexBody = block.slice(i + 1, end);
          i = end + 1;
          const trailing = block.slice(i, i + 6).trimStart();
          if (trailing.startsWith('Tj') || trailing.startsWith("'") || trailing.startsWith('"')) {
            currentLine += decodePdfHexString(hexBody, toUnicode);
          }
          continue;
        }
      }

      // Array [...] TJ
      if (ch === '[') {
        const arr = readPdfArrayForTJ(block, i, toUnicode);
        i = arr.nextIndex;
        const trailing = block.slice(i, i + 6).trimStart();
        if (trailing.startsWith('TJ')) {
          currentLine += arr.text;
          i = block.indexOf('TJ', i) + 2;
        }
        continue;
      }

      // Vertical line advance operators: T*, Td/TD with non-zero Y
      if (
        (block[i] === 'T' && (block[i + 1] === '*' || block[i + 1] === 'm' || block[i + 1] === 'd' || block[i + 1] === 'D')) &&
        (i === 0 || /[\s\d\].)]/.test(block[i - 1]))
      ) {
        if (currentLine.trim()) {
          if (block[i + 1] === '*' || block[i + 1] === 'm') {
            outLines.push(currentLine.trimEnd());
            currentLine = '';
          } else if (!currentLine.endsWith(' ')) {
            // Td/TD could be horizontal shift or newline — add space conservatively if not already spaced
            const prevSlice = block.slice(Math.max(0, i - 24), i).trim();
            const nums = prevSlice.match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)$/);
            if (nums && Math.abs(parseFloat(nums[2])) > 2) {
              outLines.push(currentLine.trimEnd());
              currentLine = '';
            } else {
              currentLine += ' ';
            }
          }
        }
        i += 2;
        continue;
      }

      i++;
    }

    if (currentLine.trim()) {
      outLines.push(currentLine.trimEnd());
      currentLine = '';
    }
  }

  return outLines
    .join('\n')
    .replace(/[^\S\n]{2,}/g, ' ')
    .trim();
}

function readPdfLiteralString(src: string, start: number): { text: string; nextIndex: number } {
  let depth = 1;
  let i = start + 1;
  let out = '';

  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '\\') {
      const next = src[i + 1];
      if (next === 'n') {
        out += '\n';
        i += 2;
      } else if (next === 'r') {
        out += '\r';
        i += 2;
      } else if (next === 't') {
        out += '\t';
        i += 2;
      } else if (next === 'b' || next === 'f') {
        i += 2;
      } else if (next === '(' || next === ')' || next === '\\') {
        out += next;
        i += 2;
      } else if (next === '\r' || next === '\n') {
        // Escaped newline continuation
        i += next === '\r' && src[i + 2] === '\n' ? 3 : 2;
      } else if (/[0-7]/.test(next || '')) {
        const oct = src.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || '';
        out += String.fromCharCode(parseInt(oct, 8));
        i += 1 + oct.length;
      } else {
        i += 2;
      }
      continue;
    }

    if (ch === '(') {
      depth++;
      out += ch;
    } else if (ch === ')') {
      depth--;
      if (depth > 0) out += ch;
    } else {
      out += ch;
    }
    i++;
  }

  return { text: out, nextIndex: i };
}

function readPdfArrayForTJ(
  src: string,
  start: number,
  toUnicode: Map<string, string>
): { text: string; nextIndex: number } {
  let i = start + 1;
  let out = '';

  while (i < src.length && src[i] !== ']') {
    const ch = src[i];
    if (ch === '(') {
      const parsed = readPdfLiteralString(src, i);
      out += parsed.text;
      i = parsed.nextIndex;
      continue;
    }
    if (ch === '<' && src[i + 1] !== '<') {
      const end = src.indexOf('>', i + 1);
      if (end !== -1) {
        out += decodePdfHexString(src.slice(i + 1, end), toUnicode);
        i = end + 1;
        continue;
      }
    }
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      const numMatch = src.slice(i).match(/^-?\d+(?:\.\d+)?/);
      if (numMatch) {
        const val = parseFloat(numMatch[0]);
        if (val < -140 && out.length > 0 && !out.endsWith(' ')) {
          out += ' ';
        }
        i += numMatch[0].length;
        continue;
      }
    }
    i++;
  }

  return { text: out, nextIndex: i < src.length ? i + 1 : i };
}

function decodePdfHexString(hex: string, toUnicode: Map<string, string>): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
  if (!clean) return '';

  if (toUnicode.size > 0) {
    // Try 4-hex CID lookup first, fallback to 2-hex lookup
    if (clean.length % 4 === 0) {
      let mapped = '';
      let hits = 0;
      for (let i = 0; i < clean.length; i += 4) {
        const key4 = clean.slice(i, i + 4);
        const char = toUnicode.get(key4);
        if (char !== undefined) {
          mapped += char;
          hits++;
        } else {
          mapped += Buffer.from(key4, 'hex').toString('utf16le').replace(/\0/g, '');
        }
      }
      if (hits > 0) return mapped;
    }

    if (clean.length % 2 === 0) {
      let mapped = '';
      let hits = 0;
      for (let i = 0; i < clean.length; i += 2) {
        const key2 = clean.slice(i, i + 2);
        const char = toUnicode.get(key2);
        if (char !== undefined) {
          mapped += char;
          hits++;
        } else {
          const byte = parseInt(key2, 16);
          if (byte >= 32 && byte <= 126) mapped += String.fromCharCode(byte);
        }
      }
      if (hits > 0) return mapped;
    }
  }

  // Fallback standard WinAnsi / ASCII / UTF-16BE BOM
  const padded = clean.length % 2 === 1 ? `${clean}0` : clean;
  const buf = Buffer.from(padded, 'hex');
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    let u = '';
    for (let i = 2; i + 1 < buf.length; i += 2) {
      u += String.fromCharCode((buf[i] << 8) | buf[i + 1]);
    }
    return u;
  }
  return buf.toString('latin1').replace(/[^\x09\x0a\x0d\x20-\x7e\u00a0-\u00ff]/g, '');
}
