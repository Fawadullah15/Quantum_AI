import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireBotAdmin } from '@/lib/bot/admin-guard';
import { ensureAdminConfigLoaded } from '@/lib/bot/admin-config';
import { getBotAdminAnalytics } from '@/lib/bot/usage-tracker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bot/analytics?days=14
 * Computes genuine DAU, conversations, token/message volume, costs, latency, errors & spending alerts.
 */
export async function GET(req: NextRequest) {
  try {
    await requireBotAdmin({ write: false });
    await ensureAdminConfigLoaded();

    const rawDays = Number(req.nextUrl.searchParams.get('days') || '14');
    const windowDays = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.round(rawDays))) : 14;
    const analytics = await getBotAdminAnalytics(windowDays);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to compute analytics.' },
      { status: 500 }
    );
  }
}
