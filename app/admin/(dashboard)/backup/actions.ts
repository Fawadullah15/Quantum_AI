'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  generateBackupPackage,
  preflightValidateBackup,
  executeRestorePackage,
  getDatabaseEnvironmentInfo,
  PreflightValidationResult,
} from '@/lib/backup-engine';
import { logDatabaseDiagnostic } from '@/lib/db-diagnostics';
import { put, list, del } from '@vercel/blob';

const checkAdminAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized: Admin session required.');
  }
  const role = (session.user as any).role;
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Only administrators can access database backups.');
  }
  return session;
};

/**
 * Returns environment diagnostic info for the backup admin UI
 */
export async function getDatabaseStatusAction() {
  await checkAdminAuth();
  const envInfo = getDatabaseEnvironmentInfo();

  let isConnected = false;
  let totalRecords = 0;

  try {
    const counts = await prisma.$transaction([
      prisma.user.count(),
      prisma.product.count(),
      prisma.caseStudy.count(),
      prisma.service.count(),
      prisma.leadership.count(),
    ]);
    isConnected = true;
    totalRecords = counts.reduce((acc, c) => acc + c, 0);
  } catch (err) {
    logDatabaseDiagnostic('backup:getDatabaseStatusAction', err);
    isConnected = false;
  }

  return {
    ...envInfo,
    isConnected,
    sampleRecordCount: totalRecords,
  };
}

/**
 * Creates a persistent snapshot in Vercel Blob storage (if configured)
 */
export async function createBackup() {
  await checkAdminAuth();
  try {
    const backupPackage = await generateBackupPackage();
    const jsonString = JSON.stringify(backupPackage, null, 2);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backups/quantum-ai-backup-${timestamp}.json`;

    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    if (!token) {
      return {
        success: false,
        error:
          'Vercel Blob storage (BLOB_READ_WRITE_TOKEN) is not configured in this environment. Please use "DOWNLOAD FULL BACKUP" to export directly to your computer.',
      };
    }

    const blob = await put(fileName, jsonString, {
      access: 'public',
      contentType: 'application/json',
      token,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      totalRecords: backupPackage.meta.totalRecords,
    };
  } catch (error: unknown) {
    logDatabaseDiagnostic('backup:createBackup', error);
    const message = error instanceof Error ? error.message : 'Backup snapshot creation failed';
    return { success: false, error: message };
  }
}

/**
 * Lists stored snapshots from Vercel Blob
 */
export async function listBackups() {
  await checkAdminAuth();
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    if (!token) {
      return { success: true, backups: [] };
    }
    const { blobs } = await list({ prefix: 'backups/', token });
    return {
      success: true,
      backups: blobs
        .map((b) => ({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt.toISOString(),
        }))
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    };
  } catch (error: unknown) {
    logDatabaseDiagnostic('backup:listBackups', error);
    const message = error instanceof Error ? error.message : 'Failed to list backups';
    return { success: false, error: message };
  }
}

/**
 * Deletes a stored snapshot from Vercel Blob
 */
export async function deleteBackup(pathname: string) {
  await checkAdminAuth();
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
    await del(pathname, { token });
    return { success: true };
  } catch (error: unknown) {
    logDatabaseDiagnostic('backup:deleteBackup', error);
    const message = error instanceof Error ? error.message : 'Failed to delete backup';
    return { success: false, error: message };
  }
}

/**
 * Runs a preflight inspection on backup content or a remote blob URL
 * without modifying any database tables.
 */
export async function preflightValidateAction(
  urlOrContent: string | object
): Promise<PreflightValidationResult> {
  await checkAdminAuth();
  try {
    let payload: any = null;

    if (typeof urlOrContent === 'string') {
      if (urlOrContent.startsWith('http://') || urlOrContent.startsWith('https://')) {
        const isPublicUrl = urlOrContent.includes('.public.blob.vercel-storage.com');
        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
        const fetchHeaders: HeadersInit = (!isPublicUrl && token) ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(urlOrContent, { headers: fetchHeaders });
        if (!res.ok) throw new Error(`Failed to fetch remote backup file (HTTP ${res.status})`);
        payload = await res.json();
      } else {
        payload = JSON.parse(urlOrContent);
      }
    } else {
      payload = urlOrContent;
    }

    return preflightValidateBackup(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Preflight inspection failed';
    return { valid: false, error: message };
  }
}

/**
 * Executes the full atomic restore operation with rollback protection
 */
export async function restoreBackup(urlOrBackupData: string | object) {
  const session = await checkAdminAuth();
  try {
    let backup: any = null;

    if (typeof urlOrBackupData === 'string') {
      if (urlOrBackupData.startsWith('http://') || urlOrBackupData.startsWith('https://')) {
        const isPublicUrl = urlOrBackupData.includes('.public.blob.vercel-storage.com');
        const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
        const fetchHeaders: HeadersInit = (!isPublicUrl && token) ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(urlOrBackupData, { headers: fetchHeaders });
        if (!res.ok) throw new Error(`Failed to download backup file for restore (HTTP ${res.status})`);
        backup = await res.json();
      } else {
        backup = JSON.parse(urlOrBackupData);
      }
    } else {
      backup = urlOrBackupData;
    }

    const adminEmail = session?.user?.email || null;
    const result = await executeRestorePackage(backup, adminEmail);

    return { success: true, totalRestored: result.totalRestored };
  } catch (error: unknown) {
    logDatabaseDiagnostic('backup:restoreBackup', error);
    const message = error instanceof Error ? error.message : 'Database restoration failed';
    return { success: false, error: message };
  }
}

/**
 * Uploads an external backup file to Vercel Blob storage
 */
export async function uploadBackup(formData: FormData) {
  await checkAdminAuth();
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Strict 50MB limit
    if (file.size > 50 * 1024 * 1024) throw new Error('File exceeds the 50MB size limit.');
    if (!file.name.endsWith('.json')) throw new Error('Backup file must have a .json extension.');

    const bytes = await file.arrayBuffer();
    const jsonString = Buffer.from(bytes).toString('utf8');

    // Validate structure prior to uploading
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      throw new Error('Malformed file: Content is not valid JSON.');
    }

    const preflight = preflightValidateBackup(parsed);
    if (!preflight.valid) {
      throw new Error(preflight.error || 'Backup failed validation.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `backups/uploaded-backup-${timestamp}.json`;
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('Vercel Blob token is not configured in this environment.');
    }

    const blob = await put(fileName, jsonString, {
      access: 'public',
      contentType: 'application/json',
      token,
    });

    return {
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      summary: preflight.summary,
    };
  } catch (error: unknown) {
    logDatabaseDiagnostic('backup:uploadBackup', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return { success: false, error: message };
  }
}
