import { createHash } from 'crypto';
import { AttachmentExtractionSummary, AttachmentKind } from '../types';
import { scanBufferSecurity, validateFileUploadPolicy } from '../file-security';
import { extractPdfText } from './pdf';
import { extractDocxText } from './docx';
import { extractXlsxData } from './xlsx';
import { extractCsvText } from './csv';
import { inspectAndValidateImage } from './image';
import { extractTextOrCode } from './text';

export interface ProcessedFileResult {
  sanitizedName: string;
  extension: string;
  kind: AttachmentKind;
  mimeType: string;
  size: number;
  sha256: string;
  textContent?: string;
  textPreview?: string;
  extractedSummary: AttachmentExtractionSummary;
}

const PREVIEW_CHAR_LIMIT = 2400;

/**
 * Validates security policy and extracts structured content & metadata for any supported upload.
 */
export async function processUploadedFile(
  buffer: Buffer,
  filename: string,
  declaredMimeType: string
): Promise<ProcessedFileResult> {
  // 1. Enforce extension, declared MIME, and size limits
  const policy = validateFileUploadPolicy(filename, declaredMimeType, buffer.length);

  // 2. Scan magic headers and block masqueraded executables
  scanBufferSecurity(buffer, policy.kind, policy.extension);

  // 3. Compute cryptographic hash for deduplication / auditing
  const sha256 = createHash('sha256').update(buffer).digest('hex');

  let finalMimeType = declaredMimeType?.split(';')[0].trim().toLowerCase() || 'application/octet-stream';
  let textContent: string | undefined;
  let summary: AttachmentExtractionSummary = {};

  switch (policy.extension) {
    case 'pdf': {
      finalMimeType = 'application/pdf';
      const pdfRes = extractPdfText(buffer);
      textContent = pdfRes.text;
      summary = {
        pageCount: pdfRes.pageCount,
        charCount: pdfRes.charCount,
        truncated: pdfRes.truncated,
        isScannedOrImageOnly: pdfRes.isScannedOrImageOnly,
        note: pdfRes.note,
      };
      break;
    }

    case 'docx': {
      finalMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const docxRes = extractDocxText(buffer);
      textContent = docxRes.text;
      summary = {
        charCount: docxRes.charCount,
        truncated: docxRes.truncated,
        note:
          docxRes.tableCount > 0
            ? `${docxRes.paragraphCount} paragraphs, ${docxRes.tableCount} table${docxRes.tableCount > 1 ? 's' : ''}`
            : `${docxRes.paragraphCount} paragraphs`,
      };
      break;
    }

    case 'xlsx': {
      finalMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const xlsxRes = extractXlsxData(buffer);
      textContent = xlsxRes.text;
      summary = {
        sheetNames: xlsxRes.sheetNames,
        rowCount: xlsxRes.totalRows,
        charCount: xlsxRes.charCount,
        truncated: xlsxRes.truncated,
      };
      break;
    }

    case 'csv':
    case 'tsv': {
      finalMimeType = policy.extension === 'tsv' ? 'text/tab-separated-values' : 'text/csv';
      const rawRes = extractTextOrCode(buffer, policy.extension);
      const csvRes = extractCsvText(rawRes.text, policy.sanitizedName);
      textContent = csvRes.text;
      summary = {
        rowCount: csvRes.rowCount,
        columnCount: csvRes.columnCount,
        charCount: csvRes.charCount,
        truncated: csvRes.truncated,
      };
      break;
    }

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
    case 'gif': {
      const imgInfo = inspectAndValidateImage(buffer);
      finalMimeType = imgInfo.mimeType;
      summary = {
        imageDimensions: { width: imgInfo.width, height: imgInfo.height },
      };
      break;
    }

    default: {
      const textRes = extractTextOrCode(buffer, policy.extension);
      textContent = textRes.text;
      if (policy.extension === 'json') finalMimeType = 'application/json';
      else if (policy.extension === 'md' || policy.extension === 'markdown') finalMimeType = 'text/markdown';
      else finalMimeType = 'text/plain';

      summary = {
        language: textRes.language,
        lineCount: textRes.lineCount,
        charCount: textRes.charCount,
        truncated: textRes.truncated,
      };
      break;
    }
  }

  const textPreview = textContent
    ? textContent.length > PREVIEW_CHAR_LIMIT
      ? `${textContent.slice(0, PREVIEW_CHAR_LIMIT)}\n...`
      : textContent
    : undefined;

  return {
    sanitizedName: policy.sanitizedName,
    extension: policy.extension,
    kind: policy.kind,
    mimeType: finalMimeType,
    size: buffer.length,
    sha256,
    textContent,
    textPreview,
    extractedSummary: summary,
  };
}
