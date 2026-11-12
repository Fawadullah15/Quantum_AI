import { NextRequest, NextResponse } from 'next/server';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import {
  ConversationForbiddenError,
  ConversationValidationError,
  deleteAllConversationsForOwner,
  listConversationsForOwner,
  upsertConversationForOwner,
} from '@/lib/bot/conversation-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
    if (!actor.ownerId) {
      return NextResponse.json({ conversations: [], archivedCount: 0 });
    }

    const archivedParam = req.nextUrl.searchParams.get('archived');
    const q = req.nextUrl.searchParams.get('q') || undefined;

    const [conversations, archivedList] = await Promise.all([
      listConversationsForOwner(actor.ownerId, {
        archivedOnly: archivedParam === 'true',
        includeArchived: archivedParam === 'all',
        search: q,
      }),
      listConversationsForOwner(actor.ownerId, { archivedOnly: true }),
    ]);

    const res = NextResponse.json({
      conversations,
      archivedCount: archivedList.length,
      isAuthenticated: actor.isAuthenticated,
      authType: actor.authType,
    });
    attachActorCookies(res, anonCookieToAttach, req);
    return res;
  } catch (err: any) {
    console.error('[QuantumBot /api/bot/conversations GET] Error:', err?.message || err);
    return NextResponse.json(
      { error: 'Failed to load conversations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
    if (!actor.ownerId) {
      return NextResponse.json({ error: 'Unable to establish owner session.' }, { status: 403 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const convId =
      typeof body?.id === 'string' && body.id.trim()
        ? body.id.trim()
        : `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const saved = await upsertConversationForOwner(
      {
        id: convId,
        title: typeof body?.title === 'string' ? body.title : undefined,
        modelId: typeof body?.modelId === 'string' && body.modelId ? body.modelId : 'gemini-3.5-flash',
        pinned: body?.pinned,
        archived: body?.archived,
        messages: Array.isArray(body?.messages) ? body.messages : [],
      },
      actor.ownerId
    );

    const res = NextResponse.json({ conversation: saved }, { status: 201 });
    attachActorCookies(res, anonCookieToAttach, req);
    return res;
  } catch (err: any) {
    if (err instanceof ConversationForbiddenError || err instanceof ConversationValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to save conversation.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { actor } = await resolveBotActor(req, false);
    if (!actor.ownerId) {
      return NextResponse.json({ success: true, deletedCount: 0 });
    }

    const deletedCount = await deleteAllConversationsForOwner(actor.ownerId);
    return NextResponse.json({ success: true, deletedCount });
  } catch {
    return NextResponse.json({ error: 'Failed to clear conversations.' }, { status: 500 });
  }
}
