import { NextRequest, NextResponse } from 'next/server';
import {
  BotAuthError,
  attachBotSessionCookie,
  loginBotUser,
} from '@/lib/bot/auth';
import { OWNER_COOKIE_NAME, verifySignedOwnerToken } from '@/lib/bot/file-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
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
