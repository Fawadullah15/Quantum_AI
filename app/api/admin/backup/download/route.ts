import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateBackupPackage } from '@/lib/backup-engine';
import { logDatabaseDiagnostic } from '@/lib/db-diagnostics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify administrator session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required to download database backups.' },
        { status: 401 }
      );
    }

    const userRole = (session.user as any).role || 'EDITOR';
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient privileges to perform database backups.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const direct = searchParams.get('direct') === 'true';
    const url = searchParams.get('url');
    const pathname = searchParams.get('pathname');
    const requestedFilename = searchParams.get('filename');

    // ─── MODE A: LIVE DIRECT DATABASE EXPORT ───
    if (direct) {
      const backupPackage = await generateBackupPackage();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `quantum-ai-backup-${timestamp}.json`;
      const jsonString = JSON.stringify(backupPackage, null, 2);

      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': Buffer.byteLength(jsonString, 'utf8').toString(),
          'X-Backup-Checksum': backupPackage.meta.checksum,
          'X-Backup-Total-Records': backupPackage.meta.totalRecords.toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // ─── MODE B: DOWNLOAD STORED BACKUP FROM VERCEL BLOB ───
    if (!url && !pathname) {
      return NextResponse.json(
        { error: 'Missing backup url or pathname parameter.' },
        { status: 400 }
      );
    }

    let targetUrl = url;
    if (!targetUrl && pathname) {
      const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
      if (token) {
        try {
          const { list } = await import('@vercel/blob');
          const { blobs } = await list({ prefix: pathname, token });
          const found = blobs.find((b) => b.pathname === pathname);
          if (found) targetUrl = found.url;
        } catch (storageErr) {
          logDatabaseDiagnostic('download:listBlobs', storageErr);
        }
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Backup file not found in storage.' },
        { status: 404 }
      );
    }

    // NOTE: Public Vercel Blob URLs reject Authorization headers with 400/403.
    // Fetch directly as a public resource or with credentials only if required.
    const isPublicUrl = targetUrl.includes('.public.blob.vercel-storage.com');
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    const fetchHeaders: HeadersInit = (!isPublicUrl && token) ? { Authorization: `Bearer ${token}` } : {};

    const blobResponse = await fetch(targetUrl, { headers: fetchHeaders });
    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: `Failed to retrieve backup file from storage (HTTP ${blobResponse.status}).` },
        { status: 502 }
      );
    }

    const fallbackName = (pathname || targetUrl).split('/').pop() || 'quantum-ai-backup.json';
    const cleanFilename = (requestedFilename || fallbackName).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const content = await blobResponse.text();

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${cleanFilename}"`,
        'Content-Length': Buffer.byteLength(content, 'utf8').toString(),
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    logDatabaseDiagnostic('app/api/admin/backup/download/route.ts', error);
    const message = error instanceof Error ? error.message : 'Internal error preparing backup download.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
