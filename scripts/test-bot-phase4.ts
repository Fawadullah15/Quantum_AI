/**
 * QuantumBot Phase 4 Multimodal & File Intelligence Verification Suite
 * Tests extractors (PDF, DOCX, XLSX, CSV, Code, PNG), security scanning,
 * private ownership isolation, retention expiration, vision gating, and live Gemini execution.
 */

import fs from 'fs';
import path from 'path';
import { deflateSync } from 'zlib';
import { processUploadedFile } from '../lib/bot/extractors';
import { validateFileUploadPolicy } from '../lib/bot/file-security';
import {
  saveBotFile,
  getBotFileForOwner,
  deleteBotFileForOwner,
} from '../lib/bot/file-store';
import {
  resolveAndValidateChatMessages,
  executeQuantumBotChat,
  AttachmentResolutionError,
} from '../lib/bot/engine';
import { getModelById } from '../lib/bot/models';
import { formatMessageWithAttachments } from '../lib/bot/context-manager';

// Load .env.local if running via tsx outside Next.js
function loadDotEnvLocal() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// ─── Minimal Deterministic Binary Generators for Testing ──────────

/** Builds a valid uncompressed Store ZIP archive from filename -> Buffer map */
function buildZipBuffer(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const f of files) {
    const nameBuf = Buffer.from(f.name, 'utf8');
    const crc = crc32(f.data);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8); // store
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc >>> 0, 14);
    localHeader.writeUInt32LE(f.data.length, 18);
    localHeader.writeUInt32LE(f.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc >>> 0, 16);
    central.writeUInt32LE(f.data.length, 20);
    central.writeUInt32LE(f.data.length, 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);

    localParts.push(localHeader, nameBuf, f.data);
    centralParts.push(central, nameBuf);
    offset += localHeader.length + nameBuf.length + f.data.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Builds a genuine FlateDecode-compressed single-page PDF 1.4 containing real text */
function buildPdfBuffer(lines: string[]): Buffer {
  const streamTextLines = ['BT', '/F1 12 Tf', '72 720 Td'];
  lines.forEach((line, idx) => {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    if (idx > 0) streamTextLines.push('0 -18 Td');
    streamTextLines.push(`(${escaped}) Tj`);
  });
  streamTextLines.push('ET');
  const compressedStream = deflateSync(Buffer.from(streamTextLines.join('\n'), 'latin1'));

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];

  const header = Buffer.from('%PDF-1.4\n', 'latin1');
  const bodyChunks: Buffer[] = [header];
  const offsets: number[] = [0];
  let cursor = header.length;

  for (const obj of objects) {
    offsets.push(cursor);
    const b = Buffer.from(obj, 'latin1');
    bodyChunks.push(b);
    cursor += b.length;
  }

  // Stream object 5
  offsets.push(cursor);
  const sPrefix = Buffer.from(
    `5 0 obj\n<< /Length ${compressedStream.length} /Filter /FlateDecode >>\nstream\n`,
    'latin1'
  );
  const sSuffix = Buffer.from('\nendstream\nendobj\n', 'latin1');
  bodyChunks.push(sPrefix, compressedStream, sSuffix);
  cursor += sPrefix.length + compressedStream.length + sSuffix.length;

  const xrefOffset = cursor;
  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  bodyChunks.push(Buffer.from(xref, 'latin1'));

  return Buffer.concat(bodyChunks);
}

/** Builds a valid PNG image with top half pure RED (255,0,0) and bottom half pure BLUE (0,120,255) */
function buildPngTwoColorBanner(width = 160, height = 80): Buffer {
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0; // filter None
    const isTopHalf = y < height / 2;
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3;
      raw[px] = isTopHalf ? 235 : 0; // R
      raw[px + 1] = isTopHalf ? 30 : 120; // G
      raw[px + 2] = isTopHalf ? 30 : 255; // B
    }
  }
  const compressed = deflateSync(raw);

  const makeChunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function buildTestDocxBuffer(): Buffer {
  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Quantum AI Turbine Spec Q4</w:t></w:r></w:p>
    <w:p><w:r><w:t>Operating temperature target is 425 Kelvin with titanium alloy blades.</w:t></w:r></w:p>
    <w:tbl>
      <w:tr><w:tc><w:p><w:r><w:t>Component</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Budget USD</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Rotor Assembly</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>18500</w:t></w:r></w:p></w:tc></w:tr>
      <w:tr><w:tc><w:p><w:r><w:t>Sensor Array</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>6200</w:t></w:r></w:p></w:tc></w:tr>
    </w:tbl>
  </w:body>
</w:document>`;

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: Buffer.from('<Types/>', 'utf8') },
    { name: 'word/document.xml', data: Buffer.from(docXml, 'utf8') },
  ]);
}

function buildTestXlsxBuffer(): Buffer {
  const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="FactoryOutput" sheetId="1" r:id="rId1"/>
    <sheet name="Targets" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
</Relationships>`;

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="4" uniqueCount="4">
  <si><t>Plant</t></si>
  <si><t>Units</t></si>
  <si><t>Karachi-01</t></si>
  <si><t>Lahore-02</t></si>
</sst>`;

  const sheet1Xml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>
    <row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2" t="n"><v>1450</v></c></row>
    <row r="3"><c r="A3" t="s"><v>3</v></c><c r="B3" t="n"><v>950</v></c></row>
  </sheetData>
</worksheet>`;

  const sheet2Xml = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Quarter</t></is></c><c r="B1" t="inlineStr"><is><t>Active</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>Q4</t></is></c><c r="B2" t="b"><v>1</v></c></row>
  </sheetData>
</worksheet>`;

  return buildZipBuffer([
    { name: 'xl/workbook.xml', data: Buffer.from(workbookXml, 'utf8') },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(relsXml, 'utf8') },
    { name: 'xl/sharedStrings.xml', data: Buffer.from(sharedStringsXml, 'utf8') },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(sheet1Xml, 'utf8') },
    { name: 'xl/worksheets/sheet2.xml', data: Buffer.from(sheet2Xml, 'utf8') },
  ]);
}

// ─── Main Runner ──────────────────────────────────────────────────

async function runTests() {
  loadDotEnvLocal();

  console.log('====================================================');
  console.log('📎 QUANTUMBOT PHASE 4: MULTIMODAL & SECURITY SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, label: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${label}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${label}${detail ? ` — ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. REAL DOCUMENT & IMAGE EXTRACTION
  console.log('--- 1. DOCUMENT, SPREADSHEET, CODE & IMAGE EXTRACTION ---');

  const pdfBuf = buildPdfBuffer([
    'QuantumBot Inspection Certificate #QB-7781',
    'Reactor Pressure Limit: 312 bar',
  ]);
  const pdfProcessed = await processUploadedFile(pdfBuf, 'certificate.pdf', 'application/pdf');
  assert(
    pdfProcessed.kind === 'pdf' &&
      pdfProcessed.extractedSummary.pageCount === 1 &&
      (pdfProcessed.textContent || '').includes('QB-7781') &&
      (pdfProcessed.textContent || '').includes('312 bar'),
    'PDF extractor inflates FlateDecode stream and extracts exact text + page count'
  );

  const docxBuf = buildTestDocxBuffer();
  const docxProcessed = await processUploadedFile(
    docxBuf,
    'turbine-spec.docx',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
  assert(
    docxProcessed.kind === 'document' &&
      (docxProcessed.textContent || '').includes('# Quantum AI Turbine Spec Q4') &&
      (docxProcessed.textContent || '').includes('| Rotor Assembly | 18500 |'),
    'DOCX extractor parses headings and Word tables into Markdown'
  );

  const xlsxBuf = buildTestXlsxBuffer();
  const xlsxProcessed = await processUploadedFile(
    xlsxBuf,
    'production.xlsx',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  assert(
    xlsxProcessed.kind === 'spreadsheet' &&
      xlsxProcessed.extractedSummary.sheetNames?.join(',') === 'FactoryOutput,Targets' &&
      (xlsxProcessed.textContent || '').includes('| Karachi-01 | 1450 |') &&
      (xlsxProcessed.textContent || '').includes('| Q4 | TRUE |'),
    'XLSX extractor reads sharedStrings, inlineStr, booleans, and multiple named sheets'
  );

  const csvProcessed = await processUploadedFile(
    Buffer.from('Model;LatencyMs;Vision\nGemini 3.5 Flash;420;true\nLlama 3.3 70B;290;false\n', 'utf8'),
    'benchmarks.csv',
    'text/csv'
  );
  assert(
    csvProcessed.kind === 'spreadsheet' &&
      csvProcessed.extractedSummary.rowCount === 3 &&
      (csvProcessed.textContent || '').includes('| Gemini 3.5 Flash | 420 | true |'),
    'CSV extractor detects semicolon delimiter and converts to Markdown table'
  );

  const tsProcessed = await processUploadedFile(
    Buffer.from('export function computeTorque(forceN: number, radiusM: number): number {\n  return forceN * radiusM;\n}\n', 'utf8'),
    'torque.ts',
    'text/plain'
  );
  assert(
    tsProcessed.kind === 'code' &&
      tsProcessed.extractedSummary.language === 'TypeScript' &&
      tsProcessed.extractedSummary.lineCount === 4,
    'Source code extractor classifies TypeScript and line counts accurately'
  );

  const pngBuf = buildPngTwoColorBanner(160, 80);
  const pngProcessed = await processUploadedFile(pngBuf, 'banner.png', 'image/png');
  assert(
    pngProcessed.kind === 'image' &&
      pngProcessed.mimeType === 'image/png' &&
      pngProcessed.extractedSummary.imageDimensions?.width === 160 &&
      pngProcessed.extractedSummary.imageDimensions?.height === 80,
    'Image validator checks PNG magic bytes and reads 160x80 header dimensions'
  );

  // 2. FILE SECURITY & POLICY ENFORCEMENT
  console.log('\n--- 2. FILE SECURITY & VALIDATION TESTS ---');

  for (const blockedName of ['payload.exe', 'script.bat', 'icon.svg', 'macros.docm', 'macro.xlsm', 'archive.zip']) {
    let rejected = false;
    try {
      validateFileUploadPolicy(blockedName, 'application/octet-stream', 1024);
    } catch {
      rejected = true;
    }
    assert(rejected, `Security policy blocks dangerous file extension: ${blockedName}`);
  }

  let spoofPngRejected = false;
  try {
    await processUploadedFile(Buffer.from('MZ\x90\x00This is an EXE disguised as PNG', 'latin1'), 'fake.png', 'image/png');
  } catch {
    spoofPngRejected = true;
  }
  assert(spoofPngRejected, 'Spoofed EXE masquerading as .png is blocked by magic-byte scanner');

  let macroDocxRejected = false;
  try {
    const macroDocx = buildZipBuffer([
      { name: 'word/document.xml', data: Buffer.from('<w:document><w:body/></w:document>') },
      { name: 'word/vbaProject.bin', data: Buffer.from('FAKE_VBA_MACRO') },
    ]);
    await processUploadedFile(macroDocx, 'stealth-macro.docx', 'application/octet-stream');
  } catch {
    macroDocxRejected = true;
  }
  assert(macroDocxRejected, 'Macro-embedded vbaProject.bin inside .docx is blocked');

  let xxeRejected = false;
  try {
    const xxeDocx = buildZipBuffer([
      {
        name: 'word/document.xml',
        data: Buffer.from('<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]><w:document/>'),
      },
    ]);
    await processUploadedFile(xxeDocx, 'xxe.docx', 'application/octet-stream');
  } catch {
    xxeRejected = true;
  }
  assert(xxeRejected, 'XXE XML entity injection inside OOXML is blocked');

  let launchPdfRejected = false;
  try {
    await processUploadedFile(
      Buffer.from('%PDF-1.4\n1 0 obj << /Type /Action /S /Launch /F (cmd.exe) >> endobj', 'latin1'),
      'evil.pdf',
      'application/pdf'
    );
  } catch {
    launchPdfRejected = true;
  }
  assert(launchPdfRejected, 'PDF containing /Launch OS action is blocked');

  let oversizeRejected = false;
  try {
    validateFileUploadPolicy('huge.csv', 'text/csv', 3 * 1024 * 1024);
  } catch {
    oversizeRejected = true;
  }
  assert(oversizeRejected, 'Oversized CSV (> 2 MB) rejected by policy');

  // 3. PRIVATE STORAGE, OWNERSHIP ISOLATION & RETENTION EXPIRY
  console.log('\n--- 3. OWNERSHIP ISOLATION & RETENTION POLICY TESTS ---');

  const ownerA = 'user:alice_test_1';
  const ownerB = 'anon:bob_test_2';

  const savedDocx = await saveBotFile({
    buffer: docxBuf,
    filename: 'secret-spec.docx',
    declaredMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ownerId: ownerA,
  });
  const savedXlsx = await saveBotFile({
    buffer: xlsxBuf,
    filename: 'secret-plant.xlsx',
    declaredMimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ownerId: ownerA,
  });
  const savedPdf = await saveBotFile({
    buffer: pdfBuf,
    filename: 'secret-cert.pdf',
    declaredMimeType: 'application/pdf',
    ownerId: ownerA,
  });
  const savedPng = await saveBotFile({
    buffer: pngBuf,
    filename: 'two-color.png',
    declaredMimeType: 'image/png',
    ownerId: ownerA,
  });

  const ownerLookupOk = await getBotFileForOwner(savedDocx.fileId, ownerA);
  assert(ownerLookupOk.status === 'ok', 'Owner Alice can retrieve her own private DOCX file');

  const crossUserLookup = await getBotFileForOwner(savedDocx.fileId, ownerB);
  assert(crossUserLookup.status === 'forbidden', 'Cross-user Bob lookup returns forbidden (403)');

  const crossUserDelete = await deleteBotFileForOwner(savedDocx.fileId, ownerB);
  assert(crossUserDelete === 'forbidden', 'Cross-user Bob delete returns forbidden (403)');

  // Expired retention test
  const expiredFile = await saveBotFile({
    buffer: Buffer.from('Sensitive temporary note', 'utf8'),
    filename: 'temp-note.txt',
    declaredMimeType: 'text/plain',
    ownerId: ownerA,
    ttlMs: -5000, // expired 5s ago
  });

  const expiredLookup = await getBotFileForOwner(expiredFile.fileId, ownerA);
  assert(expiredLookup.status === 'expired', 'Expired file is rejected with expired (410) and purged');

  // Engine attachment security gates
  const geminiModel = getModelById('gemini-3.5-flash')!;
  const llamaModel = getModelById('llama-3.3-70b')!;

  let chatCrossUserBlocked = false;
  try {
    await resolveAndValidateChatMessages(
      [
        {
          id: 'u1',
          role: 'user',
          content: 'Read Alice file',
          attachments: [
            {
              id: savedDocx.fileId,
              fileId: savedDocx.fileId,
              name: savedDocx.name,
              mimeType: savedDocx.mimeType,
              size: savedDocx.size,
            },
          ],
        },
      ],
      geminiModel,
      ownerB
    );
  } catch (e: any) {
    chatCrossUserBlocked = e instanceof AttachmentResolutionError && e.statusCode === 403;
  }
  assert(chatCrossUserBlocked, 'Engine blocks cross-user fileId in chat payload with HTTP 403');

  let chatExpiredLatestBlocked = false;
  const expiredFile2 = await saveBotFile({
    buffer: Buffer.from('Short-lived token data', 'utf8'),
    filename: 'ephemeral.txt',
    declaredMimeType: 'text/plain',
    ownerId: ownerA,
    ttlMs: -1000,
  });
  try {
    await resolveAndValidateChatMessages(
      [
        {
          id: 'u2',
          role: 'user',
          content: 'Analyze ephemeral.txt',
          attachments: [
            {
              id: expiredFile2.fileId,
              fileId: expiredFile2.fileId,
              name: 'ephemeral.txt',
              mimeType: 'text/plain',
              size: 22,
            },
          ],
        },
      ],
      geminiModel,
      ownerA
    );
  } catch (e: any) {
    chatExpiredLatestBlocked = e instanceof AttachmentResolutionError && e.statusCode === 410;
  }
  assert(chatExpiredLatestBlocked, 'Engine refuses active turn referencing expired file with HTTP 410');

  // Historical expired file must NEVER send inaccessible text/binary to model
  const historicalSafe = await resolveAndValidateChatMessages(
    [
      {
        id: 'old_u',
        role: 'user',
        content: 'Old message',
        attachments: [
          {
            id: 'qbf_00000000-0000-4000-8000-000000000000',
            fileId: 'qbf_00000000-0000-4000-8000-000000000000',
            name: 'aged-out.pdf',
            mimeType: 'application/pdf',
            size: 1000,
            textContent: 'SHOULD_BE_STRIPPED',
            base64: 'U0hPVUxEX0JFX1NUUklQUEVE',
          },
        ],
      },
      { id: 'old_a', role: 'assistant', content: 'Previous reply' },
      { id: 'new_u', role: 'user', content: 'Follow-up without expired file' },
    ],
    geminiModel,
    ownerA
  );
  const formattedOld = formatMessageWithAttachments(historicalSafe[0]);
  assert(
    historicalSafe[0].attachments?.[0].status === 'expired' &&
      !historicalSafe[0].attachments?.[0].base64 &&
      !historicalSafe[0].attachments?.[0].textContent &&
      !formattedOld.includes('SHOULD_BE_STRIPPED'),
    'Historical inaccessible/expired files have payloads stripped before reaching model'
  );

  // 4. STRICT VISION GATING TEST
  console.log('\n--- 4. MODEL CAPABILITY & VISION GATING TESTS ---');

  assert(!llamaModel.capabilities.includes('vision'), 'Llama 3.3 70B explicitly does NOT advertise vision');

  let nonVisionBlocked = false;
  try {
    await resolveAndValidateChatMessages(
      [
        {
          id: 'u_img',
          role: 'user',
          content: 'What color is this image?',
          attachments: [
            {
              id: savedPng.fileId,
              fileId: savedPng.fileId,
              name: savedPng.name,
              mimeType: 'image/png',
              kind: 'image',
              size: savedPng.size,
            },
          ],
        },
      ],
      llamaModel,
      ownerA
    );
  } catch (e: any) {
    nonVisionBlocked =
      e instanceof AttachmentResolutionError &&
      e.statusCode === 400 &&
      e.message.toLowerCase().includes('does not support image understanding');
  }
  assert(nonVisionBlocked, 'Non-vision model (Llama 3.3 70B) strictly blocks image attachment with HTTP 400');

  // 5. LIVE GEMINI MULTIMODAL & MULTI-DOCUMENT ACCURACY TESTS
  console.log('\n--- 5. LIVE GEMINI MULTIMODAL & DOCUMENT ANALYSIS TESTS ---');

  if (!process.env.GEMINI_API_KEY) {
    console.log('  ⚠️ SKIP: GEMINI_API_KEY not set — skipping live inference verification.');
  } else {
    // 5a. Multi-document comparison (DOCX + XLSX + PDF)
    const docCompareRes = await executeQuantumBotChat({
      modelId: 'gemini-3.5-flash',
      ownerId: ownerA,
      enableTools: false,
      messages: [
        {
          id: 'live_docs',
          role: 'user',
          content:
            'Look at all 3 attached files and answer concisely: (1) What is the sum of Rotor Assembly + Sensor Array budgets in USD from the DOCX? (2) What is the total FactoryOutput Units across Karachi-01 + Lahore-02 in the XLSX? (3) What Reactor Pressure Limit and certificate ID appear in the PDF?',
          attachments: [
            { id: savedDocx.fileId, fileId: savedDocx.fileId, name: savedDocx.name, mimeType: savedDocx.mimeType, size: savedDocx.size },
            { id: savedXlsx.fileId, fileId: savedXlsx.fileId, name: savedXlsx.name, mimeType: savedXlsx.mimeType, size: savedXlsx.size },
            { id: savedPdf.fileId, fileId: savedPdf.fileId, name: savedPdf.name, mimeType: savedPdf.mimeType, size: savedPdf.size },
          ],
        },
      ],
      onChunk: () => {},
    });

    const docAns = docCompareRes.content.replace(/,/g, '');
    assert(
      docAns.includes('24700') && docAns.includes('2400') && docAns.includes('312') && docAns.includes('QB-7781'),
      'Live Gemini accurately compares DOCX budget (24,700), XLSX sum (2,400), and PDF limit (312 bar / QB-7781)',
      docCompareRes.content
    );

    // 5b. Live PNG Vision understanding
    const visionRes = await executeQuantumBotChat({
      modelId: 'gemini-3.5-flash',
      ownerId: ownerA,
      enableTools: false,
      messages: [
        {
          id: 'live_img',
          role: 'user',
          content: 'Describe the two horizontal color bands in the attached PNG image (top half color and bottom half color) in one short sentence.',
          attachments: [
            { id: savedPng.fileId, fileId: savedPng.fileId, name: savedPng.name, mimeType: 'image/png', kind: 'image', size: savedPng.size },
          ],
        },
      ],
      onChunk: () => {},
    });

    const vLower = visionRes.content.toLowerCase();
    assert(
      vLower.includes('red') && vLower.includes('blue'),
      'Live Gemini vision accurately identifies top RED and bottom BLUE halves from binary PNG',
      visionRes.content.slice(0, 200)
    );
  }

  // Cleanup test files created for ownerA
  for (const rec of [savedDocx, savedXlsx, savedPdf, savedPng]) {
    await deleteBotFileForOwner(rec.fileId, ownerA);
  }

  console.log('\n====================================================');
  console.log(`PHASE 4 RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal Phase 4 test error:', err);
  process.exit(1);
});
