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
};

export async function createBackup() {
  await checkAuth();
  try {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      tables: {
        SubmissionNote: await prisma.submissionNote.findMany(),
        ActivityLog: await prisma.activityLog.findMany(),
        ProductFeature: await prisma.productFeature.findMany(),
        CaseStudyMetric: await prisma.caseStudyMetric.findMany(),
        Product: await prisma.product.findMany(),
        CaseStudy: await prisma.caseStudy.findMany(),
        CareerApplication: await prisma.careerApplication.findMany(),
        PartnershipRequest: await prisma.partnershipRequest.findMany(),
        User: await prisma.user.findMany(),
        SiteSettings: await prisma.siteSettings.findMany(),
        NavigationItem: await prisma.navigationItem.findMany(),
        Founder: await prisma.founder.findMany(),
        TeamMember: await prisma.teamMember.findMany(),
        Leadership: await prisma.leadership.findMany(),
        Service: await prisma.service.findMany(),
        Technology: await prisma.technology.findMany(),
        BlogPost: await prisma.blogPost.findMany(),
        Testimonial: await prisma.testimonial.findMany(),
        Client: await prisma.client.findMany(),
        ContactSubmission: await prisma.contactSubmission.findMany(),
        Media: await prisma.media.findMany(),
        CareerPosition: await prisma.careerPosition.findMany(),
      },
    };

    const jsonString = JSON.stringify(data);
    const sizeBytes = Buffer.byteLength(jsonString, 'utf8');

    const fileName = "backups/db-backup-" + new Date().toISOString().replace(/[:.]/g, '-') + ".json";
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
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
    await del(pathname, { token });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    return { success: false, error: error.message };
  }
}

export async function restoreBackup(url: string) {
  await checkAuth();
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to download backup file');
    const backup = await res.json();
    if (!backup.tables) throw new Error('Invalid backup file format');

    await prisma.$transaction(async (tx) => {
      await tx.submissionNote.deleteMany();
      await tx.activityLog.deleteMany();
      await tx.productFeature.deleteMany();
      await tx.caseStudyMetric.deleteMany();
      await tx.product.deleteMany();
      await tx.caseStudy.deleteMany();
      await tx.careerApplication.deleteMany();
      await tx.partnershipRequest.deleteMany();
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
      await tx.media.deleteMany();
      await tx.careerPosition.deleteMany();
      await tx.user.deleteMany();

      const t = backup.tables;
      if (t.User?.length) await tx.user.createMany({ data: t.User });
      if (t.SiteSettings?.length) await tx.siteSettings.createMany({ data: t.SiteSettings });
      if (t.NavigationItem?.length) await tx.navigationItem.createMany({ data: t.NavigationItem });
      if (t.Founder?.length) await tx.founder.createMany({ data: t.Founder });
      if (t.TeamMember?.length) await tx.teamMember.createMany({ data: t.TeamMember });
      if (t.Leadership?.length) await tx.leadership.createMany({ data: t.Leadership });
      if (t.Service?.length) await tx.service.createMany({ data: t.Service });
      if (t.Technology?.length) await tx.technology.createMany({ data: t.Technology });
      if (t.BlogPost?.length) await tx.blogPost.createMany({ data: t.BlogPost });
      if (t.Testimonial?.length) await tx.testimonial.createMany({ data: t.Testimonial });
      if (t.Client?.length) await tx.client.createMany({ data: t.Client });
      if (t.ContactSubmission?.length) await tx.contactSubmission.createMany({ data: t.ContactSubmission });
      if (t.Media?.length) await tx.media.createMany({ data: t.Media });
      if (t.CareerPosition?.length) await tx.careerPosition.createMany({ data: t.CareerPosition });
      if (t.CareerApplication?.length) await tx.careerApplication.createMany({ data: t.CareerApplication });
      if (t.PartnershipRequest?.length) await tx.partnershipRequest.createMany({ data: t.PartnershipRequest });
      if (t.Product?.length) await tx.product.createMany({ data: t.Product });
      if (t.CaseStudy?.length) await tx.caseStudy.createMany({ data: t.CaseStudy });
      if (t.ProductFeature?.length) await tx.productFeature.createMany({ data: t.ProductFeature });
      if (t.CaseStudyMetric?.length) await tx.caseStudyMetric.createMany({ data: t.CaseStudyMetric });
      if (t.ActivityLog?.length) await tx.activityLog.createMany({ data: t.ActivityLog });
      if (t.SubmissionNote?.length) await tx.submissionNote.createMany({ data: t.SubmissionNote });
    }, { timeout: 30000 });

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

    // Basic validation
    if (file.size > 15 * 1024 * 1024) throw new Error('File too large. Max 15MB.');
    if (!file.name.endsWith('.json')) throw new Error('Must be a JSON file');

    const bytes = await file.arrayBuffer();
    const jsonString = Buffer.from(bytes).toString('utf8');

    // Parse to ensure it's a valid JSON backup
    const parsed = JSON.parse(jsonString);
    if (!parsed.tables || !parsed.version) {
      throw new Error('Invalid backup file structure');
    }

    const fileName = "backups/uploaded-backup-" + new Date().toISOString().replace(/[:.]/g, '-') + ".json";
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
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
