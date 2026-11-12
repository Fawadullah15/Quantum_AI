export interface ImageInspectionResult {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  width: number;
  height: number;
}

const MAX_DIMENSION_PX = 25000;

/**
 * Validates raster image magic bytes and parses actual header dimensions.
 * Strictly blocks spoofed extensions, SVG active content, and malformed/bomb image headers.
 */
export function inspectAndValidateImage(buffer: Buffer): ImageInspectionResult {
  if (buffer.length < 16) {
    throw new Error('Corrupt or empty image file.');
  }

  // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    if (buffer.length < 24 || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
      throw new Error('Malformed PNG image: missing IHDR header.');
    }
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    validateDimensions(width, height);
    return { mimeType: 'image/png', width, height };
  }

  // 2. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dims = parseJpegDimensions(buffer);
    validateDimensions(dims.width, dims.height);
    return { mimeType: 'image/jpeg', width: dims.width, height: dims.height };
  }

  // 3. WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    const dims = parseWebpDimensions(buffer);
    validateDimensions(dims.width, dims.height);
    return { mimeType: 'image/webp', width: dims.width, height: dims.height };
  }

  // 4. GIF: GIF87a / GIF89a
  const gifSig = buffer.subarray(0, 6).toString('ascii');
  if (gifSig === 'GIF87a' || gifSig === 'GIF89a') {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    validateDimensions(width, height);
    return { mimeType: 'image/gif', width, height };
  }

  throw new Error(
    'Unrecognized or spoofed image file signature. Only verified PNG, JPEG, WEBP, and GIF raster images are permitted.'
  );
}

function validateDimensions(width: number, height: number): void {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Invalid image dimensions.');
  }
  if (width > MAX_DIMENSION_PX || height > MAX_DIMENSION_PX) {
    throw new Error(`Image dimensions (${width}×${height}) exceed the ${MAX_DIMENSION_PX}px safety limit.`);
  }
}

function parseJpegDimensions(buffer: Buffer): { width: number; height: number } {
  let offset = 2;
  while (offset + 4 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    // Standalone markers without length field
    if (marker === 0x00 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    const segmentLen = buffer.readUInt16BE(offset + 2);
    if (segmentLen < 2) break;

    // SOF markers (Baseline, Extended sequential, Progressive, Lossless, etc.)
    const isSof =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);

    if (isSof && offset + 9 <= buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }

    offset += 2 + segmentLen;
  }
  throw new Error('Malformed JPEG image: could not locate frame header.');
}

function parseWebpDimensions(buffer: Buffer): { width: number; height: number } {
  if (buffer.length < 30) {
    throw new Error('Truncated WebP file.');
  }
  const chunk = buffer.subarray(12, 16).toString('ascii');
  if (chunk === 'VP8X' && buffer.length >= 30) {
    const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
    const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
    return { width, height };
  }
  if (chunk === 'VP8 ' && buffer.length >= 30) {
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height };
  }
  if (chunk === 'VP8L' && buffer.length >= 25) {
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >>> 14) & 0x3fff) + 1;
    return { width, height };
  }
  throw new Error('Malformed WebP image: missing VP8 frame header.');
}
