import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import { validateFileUploadPolicy } from '@/lib/bot/file-security';
import {
  listBotFilesForOwner,
  saveBotFile,
  toPublicAttachment,
} from '@/lib/bot/file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/bot/files — Validates, extracts, and stores a user-uploaded document or image privately.
 */
export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const rateLimit = checkRateLimit(`bot:files:upload:${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Upload rate limit exceeded. Please wait ${rateLimit.resetInSeconds}s before uploading more files.`,
      },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
  if (!actor.ownerId) {
    return NextResponse.json({ error: 'Unable to establish secure file ownership session.' }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data payload containing a "file" field.' },
      { status: 400 }
    );
  }

  const uploaded = formData.get('file');
  const rawConvId = formData.get('conversationId');
  const conversationId = typeof rawConvId === 'string' && rawConvId.trim() ? rawConvId.trim() : undefined;

  if (!uploaded || typeof uploaded === 'string' || typeof (uploaded as Blob).arrayBuffer !== 'function') {
    return NextResponse.json(
      { error: 'A valid file field is required.' },
      { status: 400 }
    );
  }

  const fileObj = uploaded as File;
  const filename = fileObj.name || 'upload.bin';
  const declaredMime = fileObj.type || 'application/octet-stream';

  try {
    // Pre-check extension & declared byte size before loading into memory
    validateFileUploadPolicy(filename, declaredMime, fileObj.size);

    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const stored = await saveBotFile({
      buffer,
      filename,
      declaredMimeType: declaredMime,
      ownerId: actor.ownerId,
      conversationId,
    });

    const response = NextResponse.json(
      {
        success: true,
        attachment: toPublicAttachment(stored),
      },
      { status: 201 }
    );
    attachActorCookies(response, anonCookieToAttach, req);
    return response;
  } catch (err: any) {
    const response = NextResponse.json(
      {
        success: false,
        error: err?.message || 'File upload failed security or format validation.',
      },
      { status: 400 }
    );
    attachActorCookies(response, anonCookieToAttach, req);
    return response;
  }
}

/**
 * GET /api/bot/files — Lists active (non-expired) files belonging exclusively to the caller.
 */
export async function GET(req: NextRequest) {
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({ success: true, files: [] });
  }

  const conversationId = req.nextUrl.searchParams.get('conversationId') || undefined;
  const records = await listBotFilesForOwner(actor.ownerId, conversationId);

  return NextResponse.json({
    success: true,
    files: records.map(toPublicAttachment),
  });
}
