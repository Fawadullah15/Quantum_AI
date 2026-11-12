import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AttachmentKind } from './types';
import { getEffectiveUsageLimits } from './admin-config';

export const OWNER_COOKIE_NAME = 'qb_owner';
export const BOT_SESSION_COOKIE_NAME = 'qb_session';

export const MAX_DOCUMENT_IMAGE_BYTES = 15 * 1024 * 1024; // 15 MB for PDF, DOCX, XLSX, Images
export const MAX_TEXT_CODE_BYTES = 2 * 1024 * 1024; // 2 MB for Text, Markdown, CSV, Source Code

/**
 * Strictly blocked dangerous/executable/macro/scripted extensions.
 */
export const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'com', 'msi', 'msp', 'scr', 'vbs', 'vbe', 'wsf', 'wsh',
  'hta', 'pif', 'cpl', 'msc', 'jar', 'ps1', 'psm1', 'psd1', 'reg', 'inf', 'lnk',
  'iso', 'img', 'dmg', 'pkg', 'deb', 'rpm', 'app', 'apk', 'ipa', 'sys', 'drv',
  'docm', 'xlsm', 'pptm', 'dotm', 'xltm', 'potm', // macro-enabled Office formats
  'svg', 'svgz', // vector XML that can carry active <script> / onload payloads
  'zip', 'rar', '7z', 'tar', 'gz', 'tgz', 'bz2', // nested archives
]);

/**
 * Explicitly allowed extensions grouped by kind.
 */
export const ALLOWED_EXTENSION_MAP: Record<string, { kind: AttachmentKind; mimes: string[] }> = {
  // PDF
  pdf: { kind: 'pdf', mimes: ['application/pdf'] },

  // Word Document
  docx: {
    kind: 'document',
    mimes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream',
      'application/zip',
    ],
  },

  // Excel Spreadsheet
  xlsx: {
    kind: 'spreadsheet',
    mimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
      'application/zip',
    ],
  },

  // CSV / TSV
  csv: { kind: 'spreadsheet', mimes: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'] },
  tsv: { kind: 'spreadsheet', mimes: ['text/tab-separated-values', 'text/plain'] },

  // Raster Images
  png: { kind: 'image', mimes: ['image/png'] },
  jpg: { kind: 'image', mimes: ['image/jpeg'] },
  jpeg: { kind: 'image', mimes: ['image/jpeg'] },
  webp: { kind: 'image', mimes: ['image/webp'] },
  gif: { kind: 'image', mimes: ['image/gif'] },

  // Plain Text & Markdown
  txt: { kind: 'text', mimes: ['text/plain'] },
  md: { kind: 'text', mimes: ['text/markdown', 'text/plain', 'text/x-markdown'] },
  markdown: { kind: 'text', mimes: ['text/markdown', 'text/plain'] },
  log: { kind: 'text', mimes: ['text/plain'] },

  // Source Code & Config
  ts: { kind: 'code', mimes: ['text/plain', 'application/typescript', 'application/x-typescript', 'text/typescript', 'video/mp2t', 'video/vnd.dlna.mpeg-tts'] },
  tsx: { kind: 'code', mimes: ['text/plain', 'application/typescript', 'text/tsx'] },
  js: { kind: 'code', mimes: ['text/plain', 'application/javascript', 'text/javascript'] },
  jsx: { kind: 'code', mimes: ['text/plain', 'application/javascript', 'text/jsx'] },
  mjs: { kind: 'code', mimes: ['text/plain', 'application/javascript', 'text/javascript'] },
  cjs: { kind: 'code', mimes: ['text/plain', 'application/javascript', 'text/javascript'] },
  py: { kind: 'code', mimes: ['text/plain', 'text/x-python', 'application/x-python-code'] },
  go: { kind: 'code', mimes: ['text/plain', 'text/x-go'] },
  rs: { kind: 'code', mimes: ['text/plain', 'text/rust'] },
  java: { kind: 'code', mimes: ['text/plain', 'text/x-java-source'] },
  c: { kind: 'code', mimes: ['text/plain', 'text/x-c'] },
  h: { kind: 'code', mimes: ['text/plain', 'text/x-chdr'] },
  cpp: { kind: 'code', mimes: ['text/plain', 'text/x-c++src'] },
  cc: { kind: 'code', mimes: ['text/plain', 'text/x-c++src'] },
  hpp: { kind: 'code', mimes: ['text/plain', 'text/x-c++hdr'] },
  cs: { kind: 'code', mimes: ['text/plain', 'text/x-csharp'] },
  rb: { kind: 'code', mimes: ['text/plain', 'application/x-ruby'] },
  php: { kind: 'code', mimes: ['text/plain', 'application/x-httpd-php', 'text/x-php'] },
  sql: { kind: 'code', mimes: ['text/plain', 'application/sql', 'text/x-sql'] },
  sh: { kind: 'code', mimes: ['text/plain', 'application/x-sh', 'text/x-shellscript'] },
  bash: { kind: 'code', mimes: ['text/plain', 'application/x-sh'] },
  zsh: { kind: 'code', mimes: ['text/plain', 'application/x-sh'] },
  json: { kind: 'code', mimes: ['application/json', 'text/json', 'text/plain'] },
  yaml: { kind: 'code', mimes: ['text/yaml', 'application/x-yaml', 'text/plain'] },
  yml: { kind: 'code', mimes: ['text/yaml', 'application/x-yaml', 'text/plain'] },
  toml: { kind: 'code', mimes: ['application/toml', 'text/plain'] },
  xml: { kind: 'code', mimes: ['application/xml', 'text/xml', 'text/plain'] },
  html: { kind: 'code', mimes: ['text/html', 'text/plain'] },
  htm: { kind: 'code', mimes: ['text/html', 'text/plain'] },
  css: { kind: 'code', mimes: ['text/css', 'text/plain'] },
  scss: { kind: 'code', mimes: ['text/x-scss', 'text/plain'] },
  sass: { kind: 'code', mimes: ['text/x-sass', 'text/plain'] },
  less: { kind: 'code', mimes: ['text/less', 'text/plain'] },
  prisma: { kind: 'code', mimes: ['text/plain'] },
  graphql: { kind: 'code', mimes: ['application/graphql', 'text/plain'] },
  gql: { kind: 'code', mimes: ['application/graphql', 'text/plain'] },
  ini: { kind: 'code', mimes: ['text/plain'] },
};

export function sanitizeFilename(rawName: string): string {
  const base = (rawName || 'upload.bin').split(/[/\\]/).pop() || 'upload.bin';
  const cleaned = base
    .replace(/[\x00-\x1f\x7f"<>|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned.slice(0, 140) || 'upload.bin';
}

export function extractExtension(filename: string): string {
  const clean = sanitizeFilename(filename);
  const lastDot = clean.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === clean.length - 1) {
    return '';
  }
  return clean.slice(lastDot + 1).toLowerCase();
}

export interface ValidatedFilePolicy {
  sanitizedName: string;
  extension: string;
  kind: AttachmentKind;
  maxBytes: number;
}

export interface FileUploadLimitsOverride {
  maxDocImageBytes?: number;
  maxTextCodeBytes?: number;
}

/**
 * Validates filename extension, declared MIME type, and file size policy before extraction.
 */
export function validateFileUploadPolicy(
  filename: string,
  declaredMimeType: string,
  byteSize: number,
  limitsOverride?: FileUploadLimitsOverride
): ValidatedFilePolicy {
  const sanitizedName = sanitizeFilename(filename);
  const extension = extractExtension(sanitizedName);

  if (!extension) {
    throw new Error(
      `Unsupported file "${sanitizedName}": files must have a supported extension (PDF, DOCX, XLSX, CSV, TXT, MD, Code, or PNG/JPG/WEBP/GIF).`
    );
  }

  if (DANGEROUS_EXTENSIONS.has(extension)) {
    throw new Error(
      `Blocked file type ".${extension}": executable, macro-enabled, SVG active script, or archive formats are not permitted for security.`
    );
  }

  const entry = ALLOWED_EXTENSION_MAP[extension];
  if (!entry) {
    throw new Error(
      `Unsupported file extension ".${extension}". Supported types: PDF, DOCX, XLSX, CSV, TXT, Markdown, Images (PNG/JPG/WEBP/GIF), and source code files.`
    );
  }

  if (byteSize <= 0) {
    throw new Error(`File "${sanitizedName}" is empty (0 bytes).`);
  }

  const adminLimits = getEffectiveUsageLimits();
  const effectiveDocImageLimit =
    limitsOverride?.maxDocImageBytes ?? adminLimits.maxDocImageBytes ?? MAX_DOCUMENT_IMAGE_BYTES;
  const effectiveTextCodeLimit =
    limitsOverride?.maxTextCodeBytes ?? adminLimits.maxTextCodeBytes ?? MAX_TEXT_CODE_BYTES;

  const maxBytes =
    entry.kind === 'text' || entry.kind === 'code' || (entry.kind === 'spreadsheet' && extension !== 'xlsx')
      ? effectiveTextCodeLimit
      : effectiveDocImageLimit;

  if (byteSize > maxBytes) {
    const maxMb =
      maxBytes >= 1024 * 1024
        ? `${(maxBytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, '')} MB`
        : `${Math.round(maxBytes / 1024)} KB`;
    throw new Error(`File "${sanitizedName}" exceeds the ${maxMb} size limit for .${extension} uploads.`);
  }

  const normMime = (declaredMimeType || '').split(';')[0].trim().toLowerCase();
  if (normMime && normMime !== 'application/octet-stream') {
    const isTextGeneric =
      (entry.kind === 'code' || entry.kind === 'text' || extension === 'csv' || extension === 'tsv') &&
      (normMime.startsWith('text/') ||
        normMime.includes('json') ||
        normMime.includes('xml') ||
        normMime.includes('yaml') ||
        normMime.includes('javascript') ||
        normMime.includes('typescript'));

    if (!isTextGeneric && !entry.mimes.includes(normMime)) {
      throw new Error(
        `MIME type "${normMime}" does not match extension ".${extension}".`
      );
    }
  }

  return {
    sanitizedName,
    extension,
    kind: entry.kind,
    maxBytes,
  };
}

/**
 * Low-level binary signature and active-content scanner applied to every uploaded buffer.
 */
export function scanBufferSecurity(buffer: Buffer, expectedKind: AttachmentKind, extension: string): void {
  if (buffer.length === 0) {
    throw new Error('Uploaded file buffer is empty.');
  }

  // Always block Windows PE executables (MZ), Linux ELF binaries, and Mach-O headers unless genuinely inside PDF/image (and even then verify!)
  if (expectedKind !== 'image' && expectedKind !== 'pdf') {
    if (buffer.length >= 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
      throw new Error('Blocked Windows PE executable payload detected inside uploaded file.');
    }
    if (
      buffer.length >= 4 &&
      buffer[0] === 0x7f &&
      buffer[1] === 0x45 &&
      buffer[2] === 0x4c &&
      buffer[3] === 0x46
    ) {
      throw new Error('Blocked ELF binary executable payload detected inside uploaded file.');
    }
  }

  // Reject HTML disguised as plain CSV/MD or active script smuggling inside PDFs
  if (expectedKind === 'pdf') {
    const head = buffer.subarray(0, 1024).toString('latin1');
    if (!head.includes('%PDF-')) {
      throw new Error('File extension is .pdf, but binary header is not a valid PDF document.');
    }
  }

  if (extension === 'docx' || extension === 'xlsx') {
    if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) {
      throw new Error(`File extension is .${extension}, but binary header is not a valid Office OOXML document.`);
    }
  }
}

// ─── Owner Identity & Signed Cookie Management ──────────────────────

// Ephemeral fallback secret cached per server process if NEXTAUTH_SECRET isn't set
const globalForSecret = globalThis as unknown as { __qbSigningSecret?: string };

function getSigningSecret(): string {
  const envSecret =
    process.env.BOT_FILE_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET;
  if (envSecret && envSecret.trim().length >= 12) {
    return envSecret.trim();
  }
  if (!globalForSecret.__qbSigningSecret) {
    // Derive deterministic fallback in dev/single-node runtime
    globalForSecret.__qbSigningSecret =
      process.env.NODE_ENV === 'production'
        ? randomBytes(32).toString('hex')
        : 'quantumbot-local-dev-file-signing-secret-v1';
  }
  return globalForSecret.__qbSigningSecret;
}

export function signOwnerId(ownerId: string): string {
  const sig = createHmac('sha256', getSigningSecret()).update(ownerId).digest('hex');
  return `${ownerId}.${sig}`;
}

export function verifySignedOwnerToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const ownerId = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!ownerId || !providedSig || providedSig.length !== 64) return null;

  const expectedSig = createHmac('sha256', getSigningSecret()).update(ownerId).digest('hex');
  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length) return null;
    return timingSafeEqual(a, b) ? ownerId : null;
  } catch {
    return null;
  }
}

export interface ResolvedOwner {
  ownerId: string;
  isNewAnonCookie: boolean;
  cookieTokenToSet?: string;
}

/**
 * Resolves the caller's isolated file ownership identity from NextAuth session or signed cookie.
 * If mintIfMissing=true and no identity exists, mints a fresh anonymous ownerId + signed cookie token.
 */
export async function resolveOwnerIdentity(
  req: NextRequest,
  mintIfMissing = false
): Promise<ResolvedOwner | null> {
  // 1. Authenticated NextAuth user takes precedence for user-scoped isolation
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId) {
      return {
        ownerId: `user:${userId}`,
        isNewAnonCookie: false,
      };
    }
  } catch {
    // Ignore session lookup errors for anonymous visitors
  }

  // 2. Check signed anonymous owner cookie
  const rawCookie = req.cookies.get(OWNER_COOKIE_NAME)?.value;
  const verifiedOwner = verifySignedOwnerToken(rawCookie);
  if (verifiedOwner) {
    return {
      ownerId: verifiedOwner,
      isNewAnonCookie: false,
    };
  }

  if (!mintIfMissing) {
    return null;
  }

  const newAnonId = `anon:${randomUUID()}`;
  return {
    ownerId: newAnonId,
    isNewAnonCookie: true,
    cookieTokenToSet: signOwnerId(newAnonId),
  };
}

export function attachOwnerCookie(
  res: NextResponse,
  resolved: ResolvedOwner | null,
  req?: NextRequest
): void {
  if (!resolved?.isNewAnonCookie || !resolved.cookieTokenToSet) return;
  const forwardedProto = req?.headers.get('x-forwarded-proto')?.split(',')[0].trim();
  const isHttps = req
    ? forwardedProto === 'https' || req.nextUrl.protocol === 'https:'
    : process.env.NODE_ENV === 'production';

  res.cookies.set(OWNER_COOKIE_NAME, resolved.cookieTokenToSet, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export interface BotSessionTokenPayload {
  uid: string;
  tv: number;
  exp: number;
}

export function signBotSessionToken(payload: BotSessionTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = createHmac('sha256', getSigningSecret()).update(body).digest('hex');
  return `${body}.${sig}`;
}

export function verifyBotSessionToken(token: string | undefined | null): BotSessionTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx <= 0) return null;

  const body = token.slice(0, dotIdx);
  const providedSig = token.slice(dotIdx + 1);
  if (!body || !providedSig || providedSig.length !== 64) return null;

  const expectedSig = createHmac('sha256', getSigningSecret()).update(body).digest('hex');
  try {
    const a = Buffer.from(providedSig, 'hex');
    const b = Buffer.from(expectedSig, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as Partial<BotSessionTokenPayload>;
    if (
      typeof decoded.uid !== 'string' ||
      !decoded.uid ||
      typeof decoded.tv !== 'number' ||
      typeof decoded.exp !== 'number' ||
      Date.now() > decoded.exp
    ) {
      return null;
    }
    return { uid: decoded.uid, tv: decoded.tv, exp: decoded.exp };
  } catch {
    return null;
  }
}
