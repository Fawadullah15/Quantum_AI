import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import path from 'path';

const globalForStorage = globalThis as unknown as {
  __qbWritableStorageDirs?: Map<string, string>;
  __qbDbCooldownUntil?: number;
};

const DB_ERROR_COOLDOWN_MS = 30_000;

/**
 * Short-circuit repeated failing Postgres connection / missing-table calls during
 * transient DB outages so serverless requests (e.g. POST /api/bot/chat) do not
 * wait on multiple sequential connection timeouts before serving the fallback path.
 */
export function isBotDatabaseInCooldown(): boolean {
  const until = globalForStorage.__qbDbCooldownUntil || 0;
  return Date.now() < until;
}

export function markBotDatabaseUnavailable(): void {
  globalForStorage.__qbDbCooldownUntil = Date.now() + DB_ERROR_COOLDOWN_MS;
}

export function markBotDatabaseHealthy(): void {
  globalForStorage.__qbDbCooldownUntil = 0;
}

function getDirCache(): Map<string, string> {
  if (!globalForStorage.__qbWritableStorageDirs) {
    globalForStorage.__qbWritableStorageDirs = new Map<string, string>();
  }
  return globalForStorage.__qbWritableStorageDirs;
}

/**
 * Synchronously resolves a writable private storage directory for the given sub-folder.
 * Uses `<cwd>/.private_storage/<subdir>` when writable (local dev / persistent containers)
 * and falls back cleanly to `<tmpdir>/quantumbot_private_storage/<subdir>` on read-only
 * serverless filesystems such as Vercel (`/var/task`).
 */
export function resolveWritableStorageDirSync(subdir: string): string {
  const cleanSubdir = subdir.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cache = getDirCache();
  const cached = cache.get(cleanSubdir);
  if (cached) return cached;

  const primary = path.join(process.cwd(), '.private_storage', cleanSubdir);
  try {
    fs.mkdirSync(primary, { recursive: true });
    const probe = path.join(primary, `.probe_${crypto.randomBytes(4).toString('hex')}`);
    fs.writeFileSync(probe, 'ok', 'utf8');
    fs.unlinkSync(probe);
    cache.set(cleanSubdir, primary);
    return primary;
  } catch {
    const fallback = path.join(os.tmpdir(), 'quantumbot_private_storage', cleanSubdir);
    try {
      fs.mkdirSync(fallback, { recursive: true });
    } catch {
      // Ignore if tmpdir already exists or races on concurrent cold start
    }
    cache.set(cleanSubdir, fallback);
    return fallback;
  }
}

export async function resolveWritableStorageDir(subdir: string): Promise<string> {
  const cleanSubdir = subdir.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cache = getDirCache();
  const cached = cache.get(cleanSubdir);
  if (cached) return cached;

  const primary = path.join(process.cwd(), '.private_storage', cleanSubdir);
  try {
    await fsPromises.mkdir(primary, { recursive: true });
    const probe = path.join(primary, `.probe_${crypto.randomBytes(4).toString('hex')}`);
    await fsPromises.writeFile(probe, 'ok', 'utf8');
    await fsPromises.unlink(probe).catch(() => {});
    cache.set(cleanSubdir, primary);
    return primary;
  } catch {
    const fallback = path.join(os.tmpdir(), 'quantumbot_private_storage', cleanSubdir);
    await fsPromises.mkdir(fallback, { recursive: true }).catch(() => {});
    cache.set(cleanSubdir, fallback);
    return fallback;
  }
}
