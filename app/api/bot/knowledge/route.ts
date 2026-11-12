import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getKnowledgeIndexStats,
  ingestKnowledgeDocument,
  listKnowledgeDocuments,
  reindexKnowledgeBase,
  searchKnowledgeBase,
} from '@/lib/bot/knowledge/store';
import { KNOWLEDGE_CATEGORIES, KnowledgeCategory } from '@/lib/bot/knowledge/types';

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

/**
 * GET /api/bot/knowledge
 * Public visitors can inspect verified documents & search;
 * Authenticated admins can pass ?includeUnverified=true to manage drafts/needs_review.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const rawCategory = (searchParams.get('category') || 'all').trim();
    const includeUnverifiedReq = searchParams.get('includeUnverified') === 'true';

    const category: KnowledgeCategory | 'all' =
      rawCategory === 'all' || (KNOWLEDGE_CATEGORIES as readonly string[]).includes(rawCategory)
        ? (rawCategory as KnowledgeCategory | 'all')
        : 'all';

    let includeUnverified = false;
    if (includeUnverifiedReq) {
      const admin = await requireAdminSession();
      if (!admin) {
        return NextResponse.json(
          { error: 'Unauthorized: admin session required to view unverified records.' },
          { status: 401 }
        );
      }
      includeUnverified = true;
    }

    if (q) {
      const { hits, stats } = await searchKnowledgeBase(q, {
        category,
        limit: 15,
        includeUnverified,
      });
      return NextResponse.json({
        query: q,
        category,
        stats,
        documents: hits.map((h) => ({
          ...h.document,
          score: h.score,
          matchedTerms: h.matchedTerms,
        })),
      });
    }

    const [documents, stats] = await Promise.all([
      listKnowledgeDocuments({ category, includeUnverified }),
      getKnowledgeIndexStats(),
    ]);

    return NextResponse.json({
      category,
      stats,
      documents,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to query Quantum AI knowledge base.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/knowledge
 * Admin-only source management: ingest a new document or trigger full re-indexing.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json(
      { error: 'Unauthorized: admin authentication required to manage knowledge sources.' },
      { status: 401 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  try {
    if (body?.action === 'reindex') {
      const stats = await reindexKnowledgeBase();
      return NextResponse.json({
        success: true,
        action: 'reindex',
        stats,
      });
    }

    const { document, stats } = await ingestKnowledgeDocument({
      id: body?.id,
      title: body?.title,
      category: body?.category,
      source: body?.source,
      content: body?.content,
      verificationStatus: body?.verificationStatus,
      lastUpdated: body?.lastUpdated,
      tags: body?.tags,
      path: body?.path,
      url: body?.url,
    });

    return NextResponse.json(
      {
        success: true,
        document,
        stats,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update knowledge base.' },
      { status: 400 }
    );
  }
}
