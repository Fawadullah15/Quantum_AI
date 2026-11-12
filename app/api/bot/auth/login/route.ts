import { NextRequest, NextResponse } from 'next/server';
import {
  BotAuthError,
  attachBotSessionCookie,
  loginBotUser,
} from '@/lib/bot/auth';
import { OWNER_COOKIE_NAME, verifySignedOwnerToken } from '@/lib/bot/file-security';
import { enforceSameOrigin } from '@/lib/bot/http-security';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;

  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';
  const ipRl = checkRateLimit(`bot:auth:login-ip:${clientIp}`, 25, 5 * 60 * 1000);
  if (!ipRl.allowed) {
    return NextResponse.json(
      { error: `Too many sign-in attempts from this network. Please wait ${ipRl.resetInSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(ipRl.resetInSeconds) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const rawAnonCookie = req.cookies.get(OWNER_COOKIE_NAME)?.value;
  const verifiedAnonOwner = verifySignedOwnerToken(rawAnonCookie);

  try {
    const result = await loginBotUser({
      email: String(body?.email || ''),
      password: String(body?.password || ''),
      guestOwnerId: verifiedAnonOwner,
      claimGuestData: body?.claimGuestData === true,
    });

    const res = NextResponse.json({
      authenticated: true,
      authType: 'bot_account',
      user: result.user,
      preferences: result.preferences,
      migratedConversations: result.migratedConversations,
      migratedFiles: result.migratedFiles,
    });
    attachBotSessionCookie(res, result.sessionToken, req);
    return res;
  } catch (err: any) {
    if (err instanceof BotAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: 'Sign-in failed. Please try again.' },
      { status: 500 }
    );
  }
}
