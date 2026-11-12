import { NextRequest, NextResponse } from 'next/server';
import { resolveBotActor } from '@/lib/bot/auth';
import { listConversationsForOwner } from '@/lib/bot/conversation-store';
import { listBotFilesForOwner, toPublicAttachment } from '@/lib/bot/file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      account: null,
      preferences: actor.preferences,
      conversations: [],
      activeUploadedFiles: [],
    });
  }

  const [conversations, files] = await Promise.all([
    listConversationsForOwner(actor.ownerId, { includeArchived: true }),
    listBotFilesForOwner(actor.ownerId),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: actor.user,
    preferences: actor.preferences,
    conversations,
    activeUploadedFiles: files.map(toPublicAttachment),
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="quantumbot-data-export-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
