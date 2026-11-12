import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireBotAdmin } from '@/lib/bot/admin-guard';
import { listAdminUsersWithUsage } from '@/lib/bot/usage-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bot/users?q=...
 * Returns registered users, status, access limits, and aggregate usage counts ONLY.
 * Respects privacy: never returns conversation titles or message transcripts.
 */
export async function GET(req: NextRequest) {
  try {
    await requireBotAdmin({ write: false });
    const search = req.nextUrl.searchParams.get('q') || undefined;
    const users = await listAdminUsersWithUsage(search);

    return NextResponse.json({
      success: true,
      privacyNotice:
        'User conversation contents and prompt transcripts are private and isolated from administrative inspection.',
      users,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to retrieve QuantumBot users.' },
      { status: 500 }
    );
  }
}
