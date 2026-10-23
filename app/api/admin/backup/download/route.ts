import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify administrator session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin authentication required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const direct = searchParams.get('direct') === 'true';
    const url = searchParams.get('url');
    const pathname = searchParams.get('pathname');
    const requestedFilename = searchParams.get('filename');

    // ─── MODE A: LIVE EXPORT ON THE FLY DIRECT FROM DATABASE ───
    if (direct) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `db-backup-${timestamp}.json`;

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

      const jsonString = JSON.stringify(data, null, 2);

      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': Buffer.byteLength(jsonString, 'utf8').toString(),
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // ─── MODE B: STREAM / DOWNLOAD STORED VERCEL BLOB BACKUP ───
    if (!url && !pathname) {
      return NextResponse.json(
        { error: 'Missing backup url or pathname parameter.' },
        { status: 400 }
      );
    }

    // Determine target URL
    let targetUrl = url;
    if (!targetUrl && pathname) {
      // If only pathname is given, we can reconstruct the blob url or fetch via Vercel Blob list
      const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
      const { list } = await import('@vercel/blob');
      const { blobs } = await list({ prefix: pathname, token });
      const found = blobs.find((b) => b.pathname === pathname);
      if (found) {
        targetUrl = found.url;
      }
    }

    if (!targetUrl) {
      return NextResponse.json(
        { error: 'Backup file not found in storage.' },
        { status: 404 }
      );
    }

    // Fetch the file server-to-server (immune to browser CORS restrictions)
    const token = process.env.BLOB_READ_WRITE_TOKEN || process.env.DATABASE_URL_READ_WRITE_TOKEN;
    const fetchHeaders: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const blobResponse = await fetch(targetUrl, { headers: fetchHeaders });

    if (!blobResponse.ok) {
      return NextResponse.json(
        { error: `Failed to retrieve backup file from storage (HTTP ${blobResponse.status}).` },
        { status: 502 }
      );
    }

    const fallbackName = (pathname || targetUrl).split('/').pop() || 'backup.json';
    const cleanFilename = (requestedFilename || fallbackName).replace(/[^a-zA-Z0-9_.-]/g, '_');

    // Stream the body directly to the client with attachment disposition
    const blobBody = blobResponse.body;
    const contentLength = blobResponse.headers.get('content-length');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="${cleanFilename}"`,
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    };

    if (contentLength) {
      headers['Content-Length'] = contentLength;
    }

    return new NextResponse(blobBody as any, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('[Backup Download Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while preparing backup download.' },
      { status: 500 }
    );
  }
}
