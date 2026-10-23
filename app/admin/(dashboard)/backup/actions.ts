'use server';

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { put, list, del } from '@vercel/blob';

const checkAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  return session;
};

/**
 * Converts string dates inside an array of table records to Date objects
 * so Prisma createMany passes strict DateTime validations across PostgreSQL.
 */
function sanitizeTableData(records: any[]) {
  if (!Array.isArray(records)) return [];
  const dateFieldNames = new Set([
    'createdAt', 'updatedAt', 'publishedAt', 'readAt', 
    'lastLogin', 'startDate', 'endDate', 'deletedAt', 'timestamp'
  ]);

  return records.map((record) => {
    if (!record || typeof record !== 'object') return record;
    const clean: any = { ...record };
    for (const [key, val] of Object.entries(clean)) {
      if (typeof val === 'string' && (dateFieldNames.has(key) || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val))) {
        const parsed = new Date(val);
        if (!isNaN(parsed.getTime())) {
          clean[key] = parsed;
        }
      }
    }
    return clean;
  });
}

export async function createBackup() {
  await checkAuth();
  try {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {
        User: await prisma.user.findMany().catch(() => []),
        SiteSettings: await prisma.siteSettings.findMany().catch(() => []),
        NavigationItem: await prisma.navigationItem.findMany().catch(() => []),
        Founder: await prisma.founder.findMany().catch(() => []),
        TeamMember: await prisma.teamMember.findMany().catch(() => []),
        Leadership: await prisma.leadership.findMany().catch(() => []),
        Service: await prisma.service.findMany().catch(() => []),
        Technology: await prisma.technology.findMany().catch(() => []),
        BlogPost: await prisma.blogPost.findMany().catch(() => []),
        Testimonial: await prisma.testimonial.findMany().catch(() => []),
        Client: await prisma.client.findMany().catch(() => []),
        ContactSubmission: await prisma.contactSubmission.findMany().catch(() => []),
        Notification: await prisma.notification.findMany().catch(() => []),
        Media: await prisma.media.findMany().catch(() => []),
        CareerPosition: await prisma.careerPosition.findMany().catch(() => []),
        CareerApplication: await prisma.careerApplication.findMany().catch(() => []),
        PartnershipRequest: await prisma.partnershipRequest.findMany().catch(() => []),
        Product: await prisma.product.findMany().catch(() => []),
        CaseStudy: await prisma.caseStudy.findMany().catch(() => []),
        ProductFeature: await prisma.productFeature.findMany().catch(() => []),
        CaseStudyMetric: await prisma.caseStudyMetric.findMany().catch(() => []),
        ActivityLog: await prisma.activityLog.findMany().catch(() => []),
        SubmissionNote: await prisma.submissionNote.findMany().catch(() => []),
        RecentlyDeleted: await prisma.recentlyDeleted.findMany().catch(() => []),
        Campaign: await prisma.campaign.findMany().catch(() => []),
      },
    };

    const jsonString = JSON.stringify(data);
    const fileName = "backups/db-backup-" + new Date().toISOString().replace(/[:.]/g, '-') + ".json";
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('Vercel Blob storage token (BLOB_READ_WRITE_TOKEN) is not configured in environment. Please use the direct "EXPORT CURRENT DB" button to download backups directly to your device.');
    }

    const blob = await put(fileName, jsonString, {
      access: 'public',
      contentType: 'application/json',
      token,
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error('Backup creation failed:', error);
    return { success: false, error: error.message };
  }
}

export async function listBackups() {
  await checkAuth();
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    if (!token) {
      return { success: true, backups: [] };
    }
    const { blobs } = await list({ prefix: 'backups/', token });
    return {
      success: true,
      backups: blobs.map((b) => ({
        url: b.url,
        pathname: b.pathname,
        size: b.size,
        uploadedAt: b.uploadedAt.toISOString(),
      })).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()),
    };
  } catch (error: any) {
    console.error('Failed to list backups:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteBackup(pathname: string) {
  await checkAuth();
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    if (!token) throw new Error('Missing BLOB_READ_WRITE_TOKEN');
    await del(pathname, { token });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    return { success: false, error: error.message };
  }
}

export async function restoreBackup(urlOrBackupData: string | object) {
  const session = await checkAuth();
  try {
    let backup: any = null;

    if (typeof urlOrBackupData === 'string') {
      const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
      const fetchHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(urlOrBackupData, { headers: fetchHeaders });
      if (!res.ok) throw new Error(`Failed to download backup file (HTTP ${res.status})`);
      backup = await res.json();
    } else {
      backup = urlOrBackupData;
    }

    if (!backup?.tables) throw new Error('Invalid backup file format: missing tables');

    const currentAdminUser = session?.user?.email ? await prisma.user.findUnique({
      where: { email: session.user.email.trim().toLowerCase() }
    }).catch(() => null) : null;

    await prisma.$transaction(async (tx) => {
      // 1. Delete dependent children first to prevent foreign key errors
      await tx.submissionNote.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.productFeature.deleteMany();
      await tx.caseStudyMetric.deleteMany();

      // 2. Delete parent records
      await tx.product.deleteMany();
      await tx.caseStudy.deleteMany();
      await tx.careerApplication.deleteMany();
      await tx.partnershipRequest.deleteMany();
      await tx.campaign.deleteMany();
      await tx.siteSettings.deleteMany();
      await tx.navigationItem.deleteMany();
      await tx.founder.deleteMany();
      await tx.teamMember.deleteMany();
      await tx.leadership.deleteMany();
      await tx.service.deleteMany();
      await tx.technology.deleteMany();
      await tx.blogPost.deleteMany();
      await tx.testimonial.deleteMany();
      await tx.client.deleteMany();
      await tx.contactSubmission.deleteMany();
      await tx.notification.deleteMany();
      await tx.media.deleteMany();
      await tx.careerPosition.deleteMany();
      await tx.recentlyDeleted.deleteMany();

      // 3. User table: replace users but preserve current admin if not in backup
      const t = backup.tables;
      const usersToInsert = sanitizeTableData(t.User);

      if (usersToInsert.length > 0) {
        await tx.user.deleteMany();
        await tx.user.createMany({ data: usersToInsert, skipDuplicates: true });
        
        // Ensure current active admin user is never locked out
        if (currentAdminUser && !usersToInsert.some((u: any) => u.email?.toLowerCase() === currentAdminUser.email?.toLowerCase())) {
          await tx.user.create({ data: currentAdminUser });
        }
      }

      // 4. Independent tables
      if (t.SiteSettings?.length) await tx.siteSettings.createMany({ data: sanitizeTableData(t.SiteSettings), skipDuplicates: true });
      if (t.NavigationItem?.length) await tx.navigationItem.createMany({ data: sanitizeTableData(t.NavigationItem), skipDuplicates: true });
      if (t.Founder?.length) await tx.founder.createMany({ data: sanitizeTableData(t.Founder), skipDuplicates: true });
      if (t.TeamMember?.length) await tx.teamMember.createMany({ data: sanitizeTableData(t.TeamMember), skipDuplicates: true });
      if (t.Leadership?.length) await tx.leadership.createMany({ data: sanitizeTableData(t.Leadership), skipDuplicates: true });
      if (t.Service?.length) await tx.service.createMany({ data: sanitizeTableData(t.Service), skipDuplicates: true });
      if (t.Technology?.length) await tx.technology.createMany({ data: sanitizeTableData(t.Technology), skipDuplicates: true });
      if (t.BlogPost?.length) await tx.blogPost.createMany({ data: sanitizeTableData(t.BlogPost), skipDuplicates: true });
      if (t.Testimonial?.length) await tx.testimonial.createMany({ data: sanitizeTableData(t.Testimonial), skipDuplicates: true });
      if (t.Client?.length) await tx.client.createMany({ data: sanitizeTableData(t.Client), skipDuplicates: true });
      if (t.ContactSubmission?.length) await tx.contactSubmission.createMany({ data: sanitizeTableData(t.ContactSubmission), skipDuplicates: true });
      if (t.Notification?.length) await tx.notification.createMany({ data: sanitizeTableData(t.Notification), skipDuplicates: true });
      if (t.Media?.length) await tx.media.createMany({ data: sanitizeTableData(t.Media), skipDuplicates: true });
      if (t.CareerPosition?.length) await tx.careerPosition.createMany({ data: sanitizeTableData(t.CareerPosition), skipDuplicates: true });
      if (t.Campaign?.length) await tx.campaign.createMany({ data: sanitizeTableData(t.Campaign), skipDuplicates: true });
      if (t.RecentlyDeleted?.length) await tx.recentlyDeleted.createMany({ data: sanitizeTableData(t.RecentlyDeleted), skipDuplicates: true });

      // 5. Parent tables
      if (t.Product?.length) await tx.product.createMany({ data: sanitizeTableData(t.Product), skipDuplicates: true });
      if (t.CaseStudy?.length) await tx.caseStudy.createMany({ data: sanitizeTableData(t.CaseStudy), skipDuplicates: true });
      if (t.CareerApplication?.length) await tx.careerApplication.createMany({ data: sanitizeTableData(t.CareerApplication), skipDuplicates: true });
      if (t.PartnershipRequest?.length) await tx.partnershipRequest.createMany({ data: sanitizeTableData(t.PartnershipRequest), skipDuplicates: true });

      // 6. Child tables with foreign keys
      if (t.ProductFeature?.length) await tx.productFeature.createMany({ data: sanitizeTableData(t.ProductFeature), skipDuplicates: true });
      if (t.CaseStudyMetric?.length) await tx.caseStudyMetric.createMany({ data: sanitizeTableData(t.CaseStudyMetric), skipDuplicates: true });
      if (t.SubmissionNote?.length) await tx.submissionNote.createMany({ data: sanitizeTableData(t.SubmissionNote), skipDuplicates: true });
      if (t.ActivityLog?.length) await tx.activityLog.createMany({ data: sanitizeTableData(t.ActivityLog), skipDuplicates: true });
    }, { timeout: 60000 });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to restore backup:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadBackup(formData: FormData) {
  await checkAuth();
  try {
    const file = formData.get('file') as File;
    if (!file) throw new Error('No file provided');

    // Support up to 50MB backups
    if (file.size > 50 * 1024 * 1024) throw new Error('File too large. Max 50MB.');
    if (!file.name.endsWith('.json')) throw new Error('Must be a JSON file');

    const bytes = await file.arrayBuffer();
    const jsonString = Buffer.from(bytes).toString('utf8');

    // Parse to ensure it's a valid JSON backup
    const parsed = JSON.parse(jsonString);
    if (!parsed.tables || !parsed.version) {
      throw new Error('Invalid backup file structure: missing tables or version');
    }

    const fileName = "backups/uploaded-backup-" + new Date().toISOString().replace(/[:.]/g, '-') + ".json";
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;

    if (!token) {
      throw new Error('Vercel Blob token is not configured.');
    }

    const blob = await put(fileName, jsonString, {
      access: 'public',
      contentType: 'application/json',
      token,
    });

    return { success: true, url: blob.url };
  } catch (error: any) {
    console.error('Failed to upload backup:', error);
    return { success: false, error: error.message };
  }
}
