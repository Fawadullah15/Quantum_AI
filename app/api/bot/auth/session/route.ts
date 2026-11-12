import { NextRequest, NextResponse } from 'next/server';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { actor, anonCookieToAttach } = await resolveBotActor(req, false);

  const res = NextResponse.json({
    authenticated: actor.isAuthenticated,
    authType: actor.authType,
    user: actor.user,
    preferences: actor.preferences,
  });
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}
