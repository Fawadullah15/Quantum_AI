import { NextRequest, NextResponse } from 'next/server';
import {
  BotAuthError,
  attachBotSessionCookie,
  registerBotUser,
} from '@/lib/bot/auth';
import { OWNER_COOKIE_NAME, verifySignedOwnerToken } from '@/lib/bot/file-security';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const rl = checkRateLimit(`bot:auth:register:${clientIp}`, 12, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many registration attempts. Please wait ${rl.resetInSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.resetInSeconds) } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  // Only migrate guest items owned by a cryptographically verified anon cookie
  const rawAnonCookie = req.cookies.get(OWNER_COOKIE_NAME)?.value;
  const verifiedAnonOwner = verifySignedOwnerToken(rawAnonCookie);

  try {
    const result = await registerBotUser({
      name: String(body?.name || ''),
      email: String(body?.email || ''),
      password: String(body?.password || ''),
      guestOwnerId: verifiedAnonOwner,
      claimGuestData: body?.claimGuestData !== false,
    });

    const res = NextResponse.json(
      {
        authenticated: true,
        authType: 'bot_account',
        user: result.user,
        preferences: result.preferences,
        migratedConversations: result.migratedConversations,
        migratedFiles: result.migratedFiles,
      },
      { status: 201 }
    );
    attachBotSessionCookie(res, result.sessionToken, req);
    return res;
  } catch (err: any) {
    if (err instanceof BotAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: 'Unable to create account. Please try again.' },
      { status: 500 }
    );
  }
}
