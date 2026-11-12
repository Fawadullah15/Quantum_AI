import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import { ensureAdminConfigLoaded, getEffectiveUsageLimits } from '@/lib/bot/admin-config';
import { validateFileUploadPolicy } from '@/lib/bot/file-security';
import {
  listBotFilesForOwner,
  saveBotFile,
  toPublicAttachment,
} from '@/lib/bot/file-store';
import { recordBotUsageEvent } from '@/lib/bot/usage-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/bot/files — Validates, extracts, and stores a user-uploaded document or image privately.
 */
export async function POST(req: NextRequest) {
  await ensureAdminConfigLoaded().catch(() => {});
  const limits = getEffectiveUsageLimits();

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
    return NextResponse.json(
      { error: 'Unable to establish secure file ownership session.' },
      { status: 403 }
    );
  }

  const botUserId = actor.authType === 'bot_account' && actor.user ? actor.user.id : null;

  if (actor.user?.status === 'SUSPENDED') {
    const reason =
      actor.user.suspendedReason ||
      'Your QuantumBot account has been suspended by an administrator.';
    await recordBotUsageEvent({
      eventType: 'file_rejected',
      ownerId: actor.ownerId,
      botUserId,
      authType: actor.authType,
      statusCode: 403,
      errorMessage: reason,
    }).catch(() => {});
    const suspendedRes = NextResponse.json({ success: false, error: reason }, { status: 403 });
    attachActorCookies(suspendedRes, anonCookieToAttach, req);
    return suspendedRes;
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
  const conversationId =
    typeof rawConvId === 'string' && rawConvId.trim() ? rawConvId.trim() : undefined;

  if (!uploaded || typeof uploaded === 'string' || typeof (uploaded as Blob).arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'A valid file field is required.' }, { status: 400 });
  }

  const fileObj = uploaded as File;
  const filename = fileObj.name || 'upload.bin';
  const declaredMime = fileObj.type || 'application/octet-stream';

  const limitsOverride = {
    maxDocImageBytes: limits.maxDocImageBytes,
    maxTextCodeBytes: limits.maxTextCodeBytes,
  };

  try {
    // Pre-check extension, MIME, and dynamic admin size limits before reading buffer into RAM
    validateFileUploadPolicy(filename, declaredMime, fileObj.size, limitsOverride);

    const arrayBuffer = await fileObj.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const stored = await saveBotFile({
      buffer,
      filename,
      declaredMimeType: declaredMime,
      ownerId: actor.ownerId,
      conversationId,
      limitsOverride,
    });

    await recordBotUsageEvent({
      eventType: 'file_upload',
      ownerId: actor.ownerId,
      botUserId,
      authType: actor.authType,
      conversationId,
      statusCode: 201,
    }).catch(() => {});

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
    const errMsg = err?.message || 'File upload failed security or format validation.';
    await recordBotUsageEvent({
      eventType: 'file_rejected',
      ownerId: actor.ownerId,
      botUserId,
      authType: actor.authType,
      conversationId,
      statusCode: 400,
      errorMessage: errMsg,
    }).catch(() => {});

    const response = NextResponse.json(
      {
        success: false,
        error: errMsg,
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
