import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Verify authenticated admin session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in as an administrator to download private submissions.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'career' | 'partnership'
    const id = searchParams.get('id');
    const field = searchParams.get('field') || 'resume'; // 'resume' | 'additionalDocs' | 'photo' | 'attachment'

    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id parameter' }, { status: 400 });
    }

    let fileUrl: string | null = null;
    let fallbackFileName = 'attachment';
    let applicantName = 'submission';

    if (type === 'career') {
      const application = await prisma.careerApplication.findUnique({
        where: { id },
      });
      if (!application) {
        return NextResponse.json({ error: 'Career application not found' }, { status: 404 });
      }

      applicantName = application.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');

      if (field === 'resume') {
        fileUrl = application.resumeUrl;
        fallbackFileName = `${applicantName}_Resume.pdf`;
      } else if (field === 'additionalDocs') {
        fileUrl = application.additionalDocsUrl;
        fallbackFileName = `${applicantName}_Portfolio.zip`;
      } else if (field === 'photo') {
        fileUrl = application.photoUrl;
        fallbackFileName = `${applicantName}_Photo.jpg`;
      }
    } else if (type === 'partnership') {
      const partnership = await prisma.partnershipRequest.findUnique({
        where: { id },
      });
      if (!partnership) {
        return NextResponse.json({ error: 'Partnership request not found' }, { status: 404 });
      }

      applicantName = partnership.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
      fileUrl = partnership.attachmentUrl;
      fallbackFileName = `${applicantName}_Proposal_Deck.pdf`;
    } else {
      return NextResponse.json({ error: 'Invalid submission type' }, { status: 400 });
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'No attached file found for this field' }, { status: 404 });
    }

    // 2. Resolve file data from storage
    let fileBuffer: Buffer | null = null;
    let contentType = 'application/octet-stream';

    // A. Local secure development storage
    if (fileUrl.startsWith('local://')) {
      const localName = fileUrl.replace('local://', '');
      const securePath = join(process.cwd(), '.private_storage', 'submissions', localName);
      if (!existsSync(securePath)) {
        return NextResponse.json({ error: 'Local file asset does not exist on disk' }, { status: 404 });
      }
      fileBuffer = await readFile(securePath);
    }
    // B. Base64 Data URL (e.g. historical fallback)
    else if (fileUrl.startsWith('data:')) {
      const parts = fileUrl.split(';base64,');
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:(.*)/);
        if (mimeMatch) contentType = mimeMatch[1];
        fileBuffer = Buffer.from(parts[1], 'base64');
      }
    }
    // C. Legacy public uploads folder fallback (served securely through this authenticated gateway)
    else if (fileUrl.startsWith('/uploads/')) {
      const diskPath = join(process.cwd(), 'public', fileUrl);
      if (existsSync(diskPath)) {
        fileBuffer = await readFile(diskPath);
      }
    }
    // D. Cloud storage (Vercel Blob / S3)
    else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: 'Failed to retrieve file from cloud storage' }, { status: 502 });
      }
      const arrayBuf = await response.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
      const remoteType = response.headers.get('content-type');
      if (remoteType) contentType = remoteType;
    }

    if (!fileBuffer) {
      return NextResponse.json({ error: 'Unable to read submission document' }, { status: 500 });
    }

    // Determine clean attachment filename
    let downloadName = fallbackFileName;
    try {
      const urlParsed = new URL(fileUrl.startsWith('http') ? fileUrl : `http://localhost/${fileUrl}`);
      const rawName = urlParsed.pathname.split('/').pop();
      if (rawName && rawName.includes('.')) {
        downloadName = rawName.replace(/^[^a-zA-Z0-9]+/, '');
      }
    } catch {}

    // 3. Return authenticated download stream
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('[Admin File Download Error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Server error downloading private file' },
      { status: 500 }
    );
  }
}
