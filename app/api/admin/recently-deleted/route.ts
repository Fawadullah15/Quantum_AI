import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import {
  getRecentlyDeletedItems,
  restoreItem,
  permanentDeleteItem,
  emptyRecentlyDeleted,
  getRecoveryAuditLogs,
} from '@/lib/recovery';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);

    if (searchParams.get('audit') === 'true') {
      const logs = await getRecoveryAuditLogs(30);
      return NextResponse.json({ logs });
    }

    const filter = searchParams.get('filter') || 'ALL';
    const section = searchParams.get('section') || 'ALL';
    const search = searchParams.get('search') || '';
    const dateRange = searchParams.get('dateRange') || 'ALL';
    const sortBy = (searchParams.get('sortBy') as any) || 'NEWEST';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const result = await getRecentlyDeletedItems({
      filter,
      section,
      search,
      dateRange,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('GET /api/admin/recently-deleted error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const body = await request.json();
    const { action, id } = body;

    if (action === 'restore') {
      if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
      const result = await restoreItem({
        id,
        adminUser: { id: user?.id, name: user?.name, email: user?.email },
      });
      return NextResponse.json(result);
    }

    if (action === 'empty') {
      const result = await emptyRecentlyDeleted({
        adminUser: { id: user?.id, name: user?.name, email: user?.email },
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('POST /api/admin/recently-deleted error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });

    const result = await permanentDeleteItem({
      id,
      adminUser: { id: user?.id, name: user?.name, email: user?.email },
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('DELETE /api/admin/recently-deleted error:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
