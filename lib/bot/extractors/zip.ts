import { inflateRawSync } from 'zlib';

export interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
  data: Buffer;
}

const MAX_ZIP_ENTRIES = 500;
const MAX_ENTRY_BYTES = 10 * 1024 * 1024; // 10 MB per XML entry
const MAX_TOTAL_BYTES = 35 * 1024 * 1024; // 35 MB total uncompressed budget
const MAX_COMPRESSION_RATIO = 120;

/**
 * Safely reads a ZIP archive in-memory (used for DOCX & XLSX extraction).
 * Includes strict zip-bomb, path-traversal, and size protections.
 */
export function readZipEntries(buffer: Buffer): Map<string, ZipEntry> {
  if (buffer.length < 22 || buffer.readUInt32LE(0) !== 0x04034b50) {
    throw new Error('Invalid Office OOXML archive header.');
  }

  // Locate End of Central Directory (EOCD) signature 0x06054b50 from end
  const minOffset = Math.max(0, buffer.length - 65557);
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('Corrupt OOXML archive: End of Central Directory not found.');
  }

  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);

  if (totalEntries > MAX_ZIP_ENTRIES) {
    throw new Error(`Archive contains too many entries (${totalEntries} > ${MAX_ZIP_ENTRIES}).`);
  }

  if (cdOffset >= buffer.length) {
    throw new Error('Corrupt OOXML archive: invalid Central Directory offset.');
  }

  const entries = new Map<string, ZipEntry>();
  let offset = cdOffset;
  let totalUncompressed = 0;

  for (let idx = 0; idx < totalEntries && offset + 46 <= buffer.length; idx++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const nameLen = buffer.readUInt16LE(offset + 28);
    const extraLen = buffer.readUInt16LE(offset + 30);
    const commentLen = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);

    const rawName = buffer.subarray(offset + 46, offset + 46 + nameLen).toString('utf8');
    const normalizedName = rawName.replace(/\\/g, '/').replace(/^\/+/, '');
    offset += 46 + nameLen + extraLen + commentLen;

    // Skip directories and reject path traversal attempts
    if (!normalizedName || normalizedName.endsWith('/')) continue;
    if (normalizedName.includes('..') || normalizedName.startsWith('/')) {
      throw new Error(`Unsafe archive path detected: ${normalizedName}`);
    }

    if (uncompressedSize > MAX_ENTRY_BYTES) {
      throw new Error(`Archive entry "${normalizedName}" exceeds maximum allowed uncompressed size.`);
    }

    if (compressedSize > 0 && uncompressedSize / compressedSize > MAX_COMPRESSION_RATIO) {
      throw new Error(`Suspicious compression ratio detected in "${normalizedName}" (potential zip bomb).`);
    }

    if (localHeaderOffset + 30 > buffer.length || buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Invalid local header for entry "${normalizedName}".`);
    }

    const localNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressedSize;

    if (dataEnd > buffer.length) {
      throw new Error(`Truncated data stream for "${normalizedName}".`);
    }

    const compressedData = buffer.subarray(dataStart, dataEnd);
    let data: Buffer;

    if (compressionMethod === 0) {
      data = Buffer.from(compressedData);
    } else if (compressionMethod === 8) {
      data = inflateRawSync(compressedData, { maxOutputLength: MAX_ENTRY_BYTES });
    } else {
      // Unsupported compression method for secondary binary asset — skip unless primary XML
      if (normalizedName.endsWith('.xml') || normalizedName.endsWith('.rels')) {
        throw new Error(`Unsupported ZIP compression method (${compressionMethod}) for "${normalizedName}".`);
      }
      continue;
    }

    totalUncompressed += data.length;
    if (totalUncompressed > MAX_TOTAL_BYTES) {
      throw new Error('Total decompressed archive content exceeds 35 MB security limit.');
    }

    entries.set(normalizedName, {
      name: normalizedName,
      compressedSize,
      uncompressedSize: data.length,
      compressionMethod,
      data,
    });
  }

  return entries;
}

/**
 * Guards XML files inside DOCX/XLSX against XXE entity expansion attacks.
 */
export function validateSafeXml(xml: string, entryName: string): void {
  if (/<!ENTITY\b/i.test(xml) || /<!DOCTYPE\b[^>]*\[/i.test(xml)) {
    throw new Error(`Blocked unsafe XML entity declaration inside ${entryName}.`);
  }
}

export function decodeXmlEntities(input: string): string {
  return input
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&');
}
