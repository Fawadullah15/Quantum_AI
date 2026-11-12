import { NextRequest, NextResponse } from 'next/server';
import {
  clearBotSessionCookie,
  resolveBotActor,
  revokeAllBotUserSessions,
} from '@/lib/bot/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const { actor } = await resolveBotActor(req, false);

  if (body?.allDevices === true && actor.authType === 'bot_account' && actor.user?.id) {
    await revokeAllBotUserSessions(actor.user.id);
  }

  const res = NextResponse.json({
    success: true,
    authenticated: false,
  });
  clearBotSessionCookie(res, req);
  return res;
}
