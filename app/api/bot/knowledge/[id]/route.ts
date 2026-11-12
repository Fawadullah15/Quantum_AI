import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getKnowledgeDocumentById,
  removeKnowledgeDocument,
  updateKnowledgeDocument,
} from '@/lib/bot/knowledge/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdminSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !user?.id) {
    return null;
  }
  const role = (user.role || '').toUpperCase();
  if (role && !['SUPER_ADMIN', 'ADMIN', 'EDITOR'].includes(role)) {
    return null;
  }
  return session;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const doc = await getKnowledgeDocumentById(id);
  if (!doc) {
    return NextResponse.json({ error: 'Knowledge document not found.' }, { status: 404 });
  }

  if (doc.verificationStatus !== 'verified') {
    const admin = await requireAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'Knowledge document not found.' }, { status: 404 });
    }
  }

  return NextResponse.json({ document: doc });
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: admin authentication required.' },
      { status: 401 }
    );
  }

  let patch: any;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  try {
    const { id } = await context.params;
    const { document, stats } = await updateKnowledgeDocument(id, {
      title: patch?.title,
      category: patch?.category,
      source: patch?.source,
      content: patch?.content,
      verificationStatus: patch?.verificationStatus,
      lastUpdated: patch?.lastUpdated,
      tags: patch?.tags,
      path: patch?.path,
      url: patch?.url,
    });

    return NextResponse.json({ success: true, document, stats });
  } catch (err: any) {
    const msg = err?.message || 'Failed to update knowledge document.';
    const status = msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: admin authentication required.' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const { removedId, stats } = await removeKnowledgeDocument(id);
    return NextResponse.json({ success: true, removedId, stats });
  } catch (err: any) {
    const msg = err?.message || 'Failed to remove knowledge document.';
    const status = msg.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
