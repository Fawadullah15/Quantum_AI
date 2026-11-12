import { NextRequest, NextResponse } from 'next/server';
import { resolveBotActor } from '@/lib/bot/auth';
import { deleteAllBotFilesForOwner } from '@/lib/bot/file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  const { actor } = await resolveBotActor(req, false);
  if (!actor.ownerId) {
    return NextResponse.json({ success: true, deletedFiles: 0 });
  }

  const deletedFiles = await deleteAllBotFilesForOwner(actor.ownerId);
  return NextResponse.json({
    success: true,
    deletedFiles,
  });
}
