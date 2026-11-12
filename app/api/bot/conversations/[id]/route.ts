import { NextRequest, NextResponse } from 'next/server';
import { resolveBotActor } from '@/lib/bot/auth';
import {
  ConversationForbiddenError,
  ConversationValidationError,
  deleteConversationForOwner,
  getConversationForOwner,
  updateConversationMetaForOwner,
} from '@/lib/bot/conversation-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  try {
    const conv = await getConversationForOwner(id, actor.ownerId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    return NextResponse.json({ conversation: conv });
  } catch (err: any) {
    if (err instanceof ConversationForbiddenError || err instanceof ConversationValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to retrieve conversation.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({ error: 'Unauthorized: no active session.' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  try {
    const patch: Record<string, any> = {};
    if ('title' in body) patch.title = String(body.title || '');
    if ('pinned' in body) patch.pinned = Boolean(body.pinned);
    if ('archived' in body) patch.archived = Boolean(body.archived);
    if ('modelId' in body) patch.modelId = String(body.modelId || '');

    const updated = await updateConversationMetaForOwner(id, actor.ownerId, patch);
    if (!updated) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    return NextResponse.json({ conversation: updated });
  } catch (err: any) {
    if (err instanceof ConversationForbiddenError || err instanceof ConversationValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to update conversation.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({ error: 'Unauthorized: no active session.' }, { status: 401 });
  }

  try {
    const deleted = await deleteConversationForOwner(id, actor.ownerId);
    if (!deleted) {
      return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    if (err instanceof ConversationForbiddenError || err instanceof ConversationValidationError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Failed to delete conversation.' }, { status: 500 });
  }
}
