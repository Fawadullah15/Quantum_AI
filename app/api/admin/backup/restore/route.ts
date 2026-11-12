import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  executeRestorePackage,
  RESTORE_STAGING_PREFIX,
} from '@/lib/backup-engine';
import { logDatabaseDiagnostic } from '@/lib/db-diagnostics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_CHUNK_CHARS = 2_500_000;
const STAGING_TTL_MS = 30 * 60 * 1000;

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { error: NextResponse.json({ error: 'Unauthorized: Admin session required.' }, { status: 401 }) };
  }
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return { error: NextResponse.json({ error: 'Forbidden: Only administrators can restore database backups.' }, { status: 403 }) };
  }
  return { session };
}

function sanitizeUploadId(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!/^[a-zA-Z0-9_-]{8,64}$/.test(trimmed)) return null;
  return trimmed;
}

function stagingKeyPrefix(uploadId: string): string {
  return `${RESTORE_STAGING_PREFIX}${uploadId}:`;
}

function stagingChunkKey(uploadId: string, chunkIndex: number): string {
  return `${stagingKeyPrefix(uploadId)}${String(chunkIndex).padStart(6, '0')}`;
}

async function cleanupStagingUpload(uploadId: string) {
  await prisma.siteSettings
    .deleteMany({
      where: { key: { startsWith: stagingKeyPrefix(uploadId) } },
    })
    .catch(() => undefined);
}

function revalidateAllPublicPaths() {
  try {
    revalidatePath('/', 'layout');
    for (const route of [
      '/',
      '/services',
      '/work',
      '/products',
      '/technology',
      '/about',
      '/leadership',
      '/team',
      '/blog',
      '/case-studies',
      '/careers',
      '/announcements',
    ]) {
      revalidatePath(route);
    }
  } catch {
    // Non-fatal outside request cache lifecycle
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (auth.error) return auth.error;
  const adminEmail = auth.session?.user?.email || null;

  try {
    const body = await request.json();
    const mode = body?.mode;

    if (mode === 'direct') {
      const backupPayload =
        typeof body.backupJson === 'string'
          ? JSON.parse(body.backupJson)
          : body.backup;

      const result = await executeRestorePackage(backupPayload, adminEmail);
      revalidateAllPublicPaths();

      return NextResponse.json({
        success: true,
        totalRestored: result.totalRestored,
      });
    }

    if (mode === 'chunk') {
      const uploadId = sanitizeUploadId(body.uploadId);
      const chunkIndex = Number(body.chunkIndex);
      const totalChunks = Number(body.totalChunks);
      const chunkData = body.chunkData;

      if (
        !uploadId ||
        !Number.isInteger(chunkIndex) ||
        chunkIndex < 0 ||
        !Number.isInteger(totalChunks) ||
        totalChunks < 1 ||
        totalChunks > 200 ||
        chunkIndex >= totalChunks ||
        typeof chunkData !== 'string' ||
        chunkData.length === 0 ||
        chunkData.length > MAX_CHUNK_CHARS
      ) {
        return NextResponse.json(
          { error: 'Invalid backup upload chunk payload.' },
          { status: 400 }
        );
      }

      if (chunkIndex === 0) {
        // Prune abandoned staging fragments from prior interrupted uploads
        const staleCutoff = new Date(Date.now() - STAGING_TTL_MS);
        await prisma.siteSettings
          .deleteMany({
            where: {
              key: { startsWith: RESTORE_STAGING_PREFIX },
              updatedAt: { lt: staleCutoff },
            },
          })
          .catch(() => undefined);
      }

      const key = stagingChunkKey(uploadId, chunkIndex);
      await prisma.siteSettings.upsert({
        where: { key },
        update: { value: chunkData },
        create: { key, value: chunkData },
      });

      return NextResponse.json({
        success: true,
        chunkIndex,
        totalChunks,
      });
    }

    if (mode === 'commit') {
      const uploadId = sanitizeUploadId(body.uploadId);
      const totalChunks = Number(body.totalChunks);

      if (!uploadId || !Number.isInteger(totalChunks) || totalChunks < 1 || totalChunks > 200) {
        return NextResponse.json(
          { error: 'Invalid backup commit request.' },
          { status: 400 }
        );
      }

      try {
        const prefix = stagingKeyPrefix(uploadId);
        const rows = await prisma.siteSettings.findMany({
          where: { key: { startsWith: prefix } },
          orderBy: { key: 'asc' },
          select: { key: true, value: true },
        });

        if (rows.length !== totalChunks) {
          return NextResponse.json(
            {
              error: `Upload incomplete: expected ${totalChunks} chunks, received ${rows.length}. Please retry.`,
            },
            { status: 400 }
          );
        }

        for (let i = 0; i < totalChunks; i++) {
          const expectedKey = stagingChunkKey(uploadId, i);
          if (rows[i].key !== expectedKey) {
            return NextResponse.json(
              { error: `Missing chunk #${i + 1} during restore assembly. Please retry.` },
              { status: 400 }
            );
          }
        }

        const fullJsonText = rows.map((r) => r.value).join('');
        let backupPayload: any;
        try {
          backupPayload = JSON.parse(fullJsonText);
        } catch {
          return NextResponse.json(
            { error: 'Assembled backup file is not valid JSON.' },
            { status: 400 }
          );
        }

        const result = await executeRestorePackage(backupPayload, adminEmail);
        revalidateAllPublicPaths();

        return NextResponse.json({
          success: true,
          totalRestored: result.totalRestored,
        });
      } finally {
        await cleanupStagingUpload(uploadId);
      }
    }

    if (mode === 'abort') {
      const uploadId = sanitizeUploadId(body.uploadId);
      if (uploadId) {
        await cleanupStagingUpload(uploadId);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unsupported restore mode.' }, { status: 400 });
  } catch (error: unknown) {
    logDatabaseDiagnostic('api/admin/backup/restore', error);
    const message =
      error instanceof Error ? error.message : 'Database restoration failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
