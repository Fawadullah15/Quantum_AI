import { NextRequest, NextResponse } from 'next/server';
import { resolveOwnerIdentity } from '@/lib/bot/file-security';
import {
  deleteBotFileForOwner,
  getBotFileForOwner,
  toPublicAttachment,
} from '@/lib/bot/file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ fileId: string }>;
};

/**
 * GET /api/bot/files/[fileId] — Streams private file bytes or extracted text preview strictly to its owner.
 */
export async function GET(req: NextRequest, context: RouteContext) {
  const { fileId } = await context.params;
  const resolvedOwner = await resolveOwnerIdentity(req, false);
  const previewMode = req.nextUrl.searchParams.get('preview');

  const lookup = await getBotFileForOwner(fileId, resolvedOwner?.ownerId, {
    includeBuffer: previewMode !== 'text',
  });

  if (lookup.status === 'not_found') {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
  if (lookup.status === 'forbidden') {
    return NextResponse.json(
      { error: 'Access denied: you do not own this file.' },
      { status: 403 }
    );
  }
  if (lookup.status === 'expired') {
    return NextResponse.json(
      { error: 'This file has expired and was removed per retention policy.' },
      { status: 410 }
    );
  }

  const { record, buffer } = lookup;

  if (previewMode === 'text') {
    return NextResponse.json({
      success: true,
      attachment: toPublicAttachment(record),
      textContent: record.textContent ? record.textContent.slice(0, 40000) : undefined,
    });
  }

  if (!buffer) {
    return NextResponse.json({ error: 'Stored file payload is unavailable.' }, { status: 404 });
  }

  const isSafeInlineImage =
    record.kind === 'image' &&
    ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(record.mimeType);

  const safeFilename = record.name.replace(/["\r\n]/g, '_');
  const disposition = isSafeInlineImage
    ? `inline; filename="${safeFilename}"`
    : `attachment; filename="${safeFilename}"`;

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': record.mimeType || 'application/octet-stream',
      'Content-Length': String(buffer.length),
      'Content-Disposition': disposition,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store, max-age=0',
      'Content-Security-Policy': "default-src 'none'; sandbox",
    },
  });
}

/**
 * DELETE /api/bot/files/[fileId] — Permanently deletes an owned file before or after sending.
 */
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { fileId } = await context.params;
  const resolvedOwner = await resolveOwnerIdentity(req, false);

  const result = await deleteBotFileForOwner(fileId, resolvedOwner?.ownerId);

  if (result === 'not_found') {
    return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  }
  if (result === 'forbidden') {
    return NextResponse.json(
      { error: 'Access denied: you do not have permission to delete this file.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, fileId });
}
