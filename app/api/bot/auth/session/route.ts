import { NextRequest, NextResponse } from 'next/server';
import { attachActorCookies, clearBotSessionCookie, resolveBotActor } from '@/lib/bot/auth';
import { BOT_SESSION_COOKIE_NAME } from '@/lib/bot/file-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const hadBotSessionCookie = Boolean(req.cookies.get(BOT_SESSION_COOKIE_NAME)?.value);
  const { actor, anonCookieToAttach } = await resolveBotActor(req, false);
  const sessionExpired = hadBotSessionCookie && actor.authType !== 'bot_account';

  const res = NextResponse.json({
    authenticated: actor.isAuthenticated,
    authType: actor.authType,
    sessionExpired,
    user: actor.user,
    preferences: actor.preferences,
  });
  if (sessionExpired) {
    clearBotSessionCookie(res, req);
  }
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}
