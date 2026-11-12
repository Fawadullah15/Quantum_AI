import { NextRequest, NextResponse } from 'next/server';
import {
  BotAuthError,
  clearBotSessionCookie,
  deleteBotUserAccount,
  resolveBotActor,
} from '@/lib/bot/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const { actor } = await resolveBotActor(req, false);
  if (!actor.isAuthenticated || actor.authType !== 'bot_account' || !actor.user?.id) {
    return NextResponse.json(
      { error: 'You must be signed in with a QuantumBot account to delete it.' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Password confirmation is required.' }, { status: 400 });
  }

  try {
    const result = await deleteBotUserAccount({
      userId: actor.user.id,
      password: String(body?.password || ''),
    });

    const res = NextResponse.json({
      success: true,
      deletedConversations: result.deletedConversations,
      deletedFiles: result.deletedFiles,
    });
    clearBotSessionCookie(res, req);
    return res;
  } catch (err: any) {
    if (err instanceof BotAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: 'Unable to delete account.' },
      { status: 500 }
    );
  }
}
