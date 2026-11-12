import { NextRequest, NextResponse } from 'next/server';
import {
  AdminAuthError,
  logAdminBotActivity,
  requireBotAdmin,
} from '@/lib/bot/admin-guard';
import {
  ensureAdminConfigLoaded,
  getEffectiveUsageLimits,
  updateUsageLimitsConfig,
} from '@/lib/bot/admin-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireBotAdmin({ write: false });
    await ensureAdminConfigLoaded();
    return NextResponse.json({
      success: true,
      limits: getEffectiveUsageLimits(),
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: err?.message || 'Failed to read limits.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireBotAdmin({ write: true });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid usage limits payload.' }, { status: 400 });
    }

    const limits = await updateUsageLimitsConfig(body);

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'UPDATE',
      entity: 'BOT_USAGE_LIMITS',
      entityId: 'default',
      details: `Updated quotas & spending alerts (anonDay=${limits.anonMessagesPerDay}, authDay=${limits.authMessagesPerDay}, hardStop=${limits.enforceSpendingHardStop})`,
    });

    return NextResponse.json({
      success: true,
      limits,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to update usage limits.' },
      { status: 500 }
    );
  }
}
