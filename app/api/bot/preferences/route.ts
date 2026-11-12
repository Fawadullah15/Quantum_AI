import { NextRequest, NextResponse } from 'next/server';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import {
  getUserPreferencesForOwner,
  updateUserPreferencesForOwner,
} from '@/lib/bot/conversation-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
  const prefs = await getUserPreferencesForOwner(actor.ownerId);

  const res = NextResponse.json({
    success: true,
    preferences: prefs,
  });
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}

export async function PATCH(req: NextRequest) {
  const { actor, anonCookieToAttach } = await resolveBotActor(req, true);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const patch: Record<string, any> = {};
  if ('displayName' in body) patch.displayName = body.displayName;
  if ('responseStyle' in body) patch.responseStyle = body.responseStyle;
  if ('language' in body) patch.language = body.language;
  if ('customInstructions' in body) patch.customInstructions = body.customInstructions;
  if ('defaultModelId' in body) patch.defaultModelId = body.defaultModelId;
  if ('defaultWebSearch' in body) patch.defaultWebSearch = body.defaultWebSearch;
  if ('enterToSend' in body) patch.enterToSend = body.enterToSend;

  const updated = await updateUserPreferencesForOwner(actor.ownerId, patch);

  const res = NextResponse.json({
    success: true,
    preferences: updated,
  });
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}
