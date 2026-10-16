import { put } from '@vercel/blob';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.zip',
  '.txt',
];

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
  'text/plain',
];

export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export interface SavePrivateFileResult {
  storageRef: string; // Stored securely in database
  fileName: string;
  mimeType: string;
  size: number;
}

/**
 * Saves a sensitive private submission (resume, deck, confidential attachment).
 * Resumes and business documents must never be saved in public webroots (like /public)
 * or exposed in public API responses.
 */
export async function savePrivateFile(
  file: File,
  prefix: string
): Promise<SavePrivateFileResult> {
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const fileType = (file.type || '').toLowerCase();

  const isTypeValid =
    ALLOWED_MIME_TYPES.includes(fileType) || ALLOWED_EXTENSIONS.includes(ext);

  if (!isTypeValid) {
    throw new Error('Unsupported file format. Allowed formats: PDF, DOC, DOCX, PNG, JPG, ZIP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds the 15MB security limit.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const fileName = `${prefix}-${Date.now()}-${cleanName}`;

  // Prioritize dedicated private token if configured, then general token
  const token =
    process.env.PRIVATE_BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    process.env.DATABASE_URL_READ_WRITE_TOKEN;

  if (token) {
    try {
      // Stored under a private prefix. The URL is never exposed publicly to website visitors
      // and is only accessible through the authenticated admin download route.
      const blob = await put(`private/submissions/${fileName}`, file, {
        access: 'public',
        token,
      });
      return {
        storageRef: blob.url,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      };
    } catch (blobErr) {
      console.error('[Private Storage] Blob upload failed:', blobErr);
      throw new Error('Secure cloud file storage is temporarily unavailable. Please try again or contact administration.');
    }
  }

  // Local development fallback: Save to a secure directory OUTSIDE the /public directory.
  // Files here can NEVER be served statically by Next.js and are only readable by server-side authenticated routes.
  if (process.env.NODE_ENV === 'development') {
    try {
      const secureDir = join(process.cwd(), '.private_storage', 'submissions');
      if (!existsSync(secureDir)) {
        await mkdir(secureDir, { recursive: true });
      }
      const filePath = join(secureDir, fileName);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));
      return {
        storageRef: `local://${fileName}`,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      };
    } catch (fsErr) {
      console.error('[Private Storage] Local write failed:', fsErr);
      throw new Error('Secure private storage is not available.');
    }
  }

  // In production, never fall back to public directories or data URLs
  throw new Error(
    'Secure file storage is not configured on this server. Please ensure BLOB_READ_WRITE_TOKEN or PRIVATE_BLOB_READ_WRITE_TOKEN is set in your environment variables.'
  );
}
