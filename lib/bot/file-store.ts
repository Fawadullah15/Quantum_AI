import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { AttachmentExtractionSummary, AttachmentKind, BotAttachment } from './types';
import { processUploadedFile } from './extractors';
import type { FileUploadLimitsOverride } from './file-security';

export interface StoredBotFileMetadata {
  fileId: string;
  ownerId: string;
  conversationId?: string;
  name: string;
  mimeType: string;
  extension: string;
  kind: AttachmentKind;
  size: number;
  sha256: string;
  textContent?: string;
  textPreview?: string;
  extractedSummary?: AttachmentExtractionSummary;
  createdAt: string;
  expiresAt: string;
  geminiFileUri?: string;
  geminiFileExpiresAt?: string;
}

export type FileLookupResult =
  | { status: 'ok'; record: StoredBotFileMetadata; buffer?: Buffer }
  | { status: 'not_found' }
  | { status: 'forbidden' }
  | { status: 'expired' };

const DEFAULT_RETENTION_HOURS = 24;
let cachedStorageDir: string | null = null;
let resolvingStorageDirPromise: Promise<string> | null = null;
let lastPurgeAt = 0;

function getRetentionMs(overrideTtlMs?: number): number {
  if (typeof overrideTtlMs === 'number' && Number.isFinite(overrideTtlMs)) {
    return overrideTtlMs;
  }
  const envHours = Number(process.env.BOT_FILE_RETENTION_HOURS);
  const hours = Number.isFinite(envHours) && envHours > 0 ? envHours : DEFAULT_RETENTION_HOURS;
  return hours * 60 * 60 * 1000;
}

function assertValidFileId(fileId: string): string {
  const clean = (fileId || '').trim();
  if (!/^qbf_[a-f0-9-]{8,64}$/i.test(clean)) {
    throw new Error('Invalid file identifier format.');
  }
  return clean;
}

async function resolveStorageDir(): Promise<string> {
  if (cachedStorageDir) return cachedStorageDir;
  if (resolvingStorageDirPromise) return resolvingStorageDirPromise;

  resolvingStorageDirPromise = (async () => {
    const primary = path.join(process.cwd(), '.private_storage', 'bot_files');
    try {
      await fs.mkdir(primary, { recursive: true });
      const probe = path.join(primary, `.write_probe_${randomUUID()}`);
      await fs.writeFile(probe, 'ok');
      await fs.unlink(probe).catch(() => {});
      cachedStorageDir = primary;
      return primary;
    } catch {
      const fallback = path.join(os.tmpdir(), 'quantumbot_private_files');
      await fs.mkdir(fallback, { recursive: true });
      cachedStorageDir = fallback;
      return fallback;
    }
  })();

  return resolvingStorageDirPromise;
}

async function removeFileArtifacts(dir: string, fileId: string): Promise<void> {
  await Promise.allSettled([
    fs.unlink(path.join(dir, `${fileId}.meta.json`)),
    fs.unlink(path.join(dir, `${fileId}.bin`)),
  ]);
}

/**
 * Removes expired files from private storage. Throttled to run at most once every 5 minutes
 * unless force=true.
 */
export async function purgeExpiredBotFiles(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastPurgeAt < 5 * 60 * 1000) {
    return 0;
  }
  lastPurgeAt = now;

  const dir = await resolveStorageDir();
  let removedCount = 0;

  try {
    const entries = await fs.readdir(dir);
    for (const file of entries) {
      if (!file.endsWith('.meta.json')) continue;
      const metaPath = path.join(dir, file);
      try {
        const raw = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(raw) as StoredBotFileMetadata;
        if (!meta.expiresAt || now > new Date(meta.expiresAt).getTime()) {
          await removeFileArtifacts(dir, meta.fileId);
          removedCount++;
        }
      } catch {
        // Ignore corrupt single record
      }
    }
  } catch {
    // Directory may not exist yet
  }

  return removedCount;
}

export interface SaveBotFileInput {
  buffer: Buffer;
  filename: string;
  declaredMimeType: string;
  ownerId: string;
  conversationId?: string;
  ttlMs?: number;
  limitsOverride?: FileUploadLimitsOverride;
}

/**
 * Validates, extracts intelligence, and stores an uploaded file inside private isolated storage.
 */
export async function saveBotFile(input: SaveBotFileInput): Promise<StoredBotFileMetadata> {
  if (!input.ownerId || !input.ownerId.trim()) {
    throw new Error('File upload requires a valid owner identity.');
  }

  // Trigger non-blocking background retention cleanup
  purgeExpiredBotFiles().catch(() => {});

  const processed = await processUploadedFile(
    input.buffer,
    input.filename,
    input.declaredMimeType,
    input.limitsOverride
  );

  const fileId = `qbf_${randomUUID()}`;
  const now = Date.now();
  const expiresAt = new Date(now + getRetentionMs(input.ttlMs)).toISOString();

  const metadata: StoredBotFileMetadata = {
    fileId,
    ownerId: input.ownerId,
    conversationId: input.conversationId,
    name: processed.sanitizedName,
    mimeType: processed.mimeType,
    extension: processed.extension,
    kind: processed.kind,
    size: processed.size,
    sha256: processed.sha256,
    textContent: processed.textContent,
    textPreview: processed.textPreview,
    extractedSummary: processed.extractedSummary,
    createdAt: new Date(now).toISOString(),
    expiresAt,
  };

  const dir = await resolveStorageDir();
  await fs.writeFile(path.join(dir, `${fileId}.bin`), input.buffer);
  await fs.writeFile(path.join(dir, `${fileId}.meta.json`), JSON.stringify(metadata, null, 2), 'utf8');

  return metadata;
}

/**
 * Looks up a stored file while strictly enforcing owner isolation and retention expiration.
 */
export async function getBotFileForOwner(
  rawFileId: string,
  ownerId: string | null | undefined,
  options: { includeBuffer?: boolean } = {}
): Promise<FileLookupResult> {
  let fileId: string;
  try {
    fileId = assertValidFileId(rawFileId);
  } catch {
    return { status: 'not_found' };
  }

  const dir = await resolveStorageDir();
  const metaPath = path.join(dir, `${fileId}.meta.json`);

  let meta: StoredBotFileMetadata;
  try {
    const raw = await fs.readFile(metaPath, 'utf8');
    meta = JSON.parse(raw) as StoredBotFileMetadata;
  } catch {
    return { status: 'not_found' };
  }

  if (!ownerId || meta.ownerId !== ownerId) {
    return { status: 'forbidden' };
  }

  if (!meta.expiresAt || Date.now() > new Date(meta.expiresAt).getTime()) {
    await removeFileArtifacts(dir, fileId);
    return { status: 'expired' };
  }

  let buffer: Buffer | undefined;
  if (options.includeBuffer !== false) {
    try {
      buffer = await fs.readFile(path.join(dir, `${fileId}.bin`));
    } catch {
      return { status: 'not_found' };
    }
  }

  return { status: 'ok', record: meta, buffer };
}

/**
 * Lists all active (non-expired) files owned by the given identity.
 */
export async function listBotFilesForOwner(
  ownerId: string,
  conversationId?: string
): Promise<StoredBotFileMetadata[]> {
  if (!ownerId) return [];
  const dir = await resolveStorageDir();
  const results: StoredBotFileMetadata[] = [];
  const now = Date.now();

  try {
    const entries = await fs.readdir(dir);
    for (const file of entries) {
      if (!file.endsWith('.meta.json')) continue;
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf8');
        const meta = JSON.parse(raw) as StoredBotFileMetadata;
        if (meta.ownerId !== ownerId) continue;
        if (!meta.expiresAt || now > new Date(meta.expiresAt).getTime()) {
          await removeFileArtifacts(dir, meta.fileId);
          continue;
        }
        if (conversationId && meta.conversationId !== conversationId) continue;
        results.push(meta);
      } catch {
        // Skip corrupt meta file
      }
    }
  } catch {
    return [];
  }

  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Permanently deletes a stored file after verifying ownership.
 */
export async function deleteBotFileForOwner(
  rawFileId: string,
  ownerId: string | null | undefined
): Promise<'deleted' | 'not_found' | 'forbidden'> {
  let fileId: string;
  try {
    fileId = assertValidFileId(rawFileId);
  } catch {
    return 'not_found';
  }

  const dir = await resolveStorageDir();
  const metaPath = path.join(dir, `${fileId}.meta.json`);

  let meta: StoredBotFileMetadata;
  try {
    const raw = await fs.readFile(metaPath, 'utf8');
    meta = JSON.parse(raw) as StoredBotFileMetadata;
  } catch {
    return 'not_found';
  }

  if (!ownerId || meta.ownerId !== ownerId) {
    return 'forbidden';
  }

  await removeFileArtifacts(dir, fileId);
  return 'deleted';
}

/**
 * Updates cached Gemini Files API URI on an owned record to avoid redundant uploads on multi-turn follow-ups.
 */
export async function updateGeminiFileCache(
  rawFileId: string,
  ownerId: string,
  geminiFileUri: string,
  geminiFileExpiresAt: string
): Promise<void> {
  const lookup = await getBotFileForOwner(rawFileId, ownerId, { includeBuffer: false });
  if (lookup.status !== 'ok') return;

  const dir = await resolveStorageDir();
  const updated: StoredBotFileMetadata = {
    ...lookup.record,
    geminiFileUri,
    geminiFileExpiresAt,
  };
  await fs.writeFile(
    path.join(dir, `${lookup.record.fileId}.meta.json`),
    JSON.stringify(updated, null, 2),
    'utf8'
  );
}

/**
 * Permanently deletes every uploaded file owned by a given ownerId (Privacy & Account Deletion).
 */
export async function deleteAllBotFilesForOwner(ownerId: string): Promise<number> {
  if (!ownerId || !ownerId.trim()) return 0;
  const dir = await resolveStorageDir();
  let deletedCount = 0;

  try {
    const entries = await fs.readdir(dir);
    for (const file of entries) {
      if (!file.endsWith('.meta.json')) continue;
      try {
        const raw = await fs.readFile(path.join(dir, file), 'utf8');
        const meta = JSON.parse(raw) as StoredBotFileMetadata;
        if (meta.ownerId === ownerId) {
          await removeFileArtifacts(dir, meta.fileId);
          deletedCount++;
        }
      } catch {
        // Ignore single malformed record
      }
    }
  } catch {
    return 0;
  }

  return deletedCount;
}

/**
 * Transfers verified non-expired anonymous visitor uploads to an authenticated account
 * ONLY when explicitly triggered for that exact verified anonymous ownerId.
 */
export async function migrateBotFilesOwner(
  fromOwnerId: string,
  toOwnerId: string
): Promise<number> {
  if (!fromOwnerId || !toOwnerId || fromOwnerId === toOwnerId) return 0;
  const dir = await resolveStorageDir();
  const now = Date.now();
  let migratedCount = 0;

  try {
    const entries = await fs.readdir(dir);
    for (const file of entries) {
      if (!file.endsWith('.meta.json')) continue;
      const metaPath = path.join(dir, file);
      try {
        const raw = await fs.readFile(metaPath, 'utf8');
        const meta = JSON.parse(raw) as StoredBotFileMetadata;
        if (meta.ownerId !== fromOwnerId) continue;
        if (!meta.expiresAt || now > new Date(meta.expiresAt).getTime()) {
          await removeFileArtifacts(dir, meta.fileId);
          continue;
        }
        const updated: StoredBotFileMetadata = { ...meta, ownerId: toOwnerId };
        await fs.writeFile(metaPath, JSON.stringify(updated, null, 2), 'utf8');
        migratedCount++;
      } catch {
        // Ignore single corrupt record
      }
    }
  } catch {
    return 0;
  }

  return migratedCount;
}

/**
 * Maps server metadata into a safe client-facing BotAttachment (strips ownerId & raw bulk text).
 */
export function toPublicAttachment(record: StoredBotFileMetadata): BotAttachment {
  return {
    id: record.fileId,
    fileId: record.fileId,
    name: record.name,
    mimeType: record.mimeType,
    extension: record.extension,
    size: record.size,
    kind: record.kind,
    status: 'ready',
    progress: 100,
    url: `/api/bot/files/${record.fileId}`,
    textPreview: record.textPreview,
    extractedSummary: record.extractedSummary,
    expiresAt: record.expiresAt,
  };
}
