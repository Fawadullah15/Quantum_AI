import { NextRequest, NextResponse } from 'next/server';
import {
  AdminAuthError,
  logAdminBotActivity,
  requireBotAdmin,
} from '@/lib/bot/admin-guard';
import { BotAuthError, updateBotUserGovernance } from '@/lib/bot/auth';
import { BotUserStatus } from '@/lib/bot/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = new Set<BotUserStatus>(['ACTIVE', 'LIMITED', 'SUSPENDED']);

/**
 * PATCH /api/admin/bot/users/[id] — Update user status (ACTIVE | LIMITED | SUSPENDED),
 * per-user daily message limit override, or suspension reason.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireBotAdmin({ write: true });
    const { id } = await context.params;
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid user governance payload.' }, { status: 400 });
    }

    let status: BotUserStatus | undefined;
    if (body.status !== undefined) {
      if (!VALID_STATUSES.has(body.status)) {
        return NextResponse.json(
          { error: 'Status must be ACTIVE, LIMITED, or SUSPENDED.' },
          { status: 400 }
        );
      }
      status = body.status as BotUserStatus;
    }

    const dailyMessageLimitOverride =
      body.dailyMessageLimitOverride !== undefined
        ? body.dailyMessageLimitOverride === null || body.dailyMessageLimitOverride === ''
          ? null
          : Number(body.dailyMessageLimitOverride)
        : undefined;

    if (
      dailyMessageLimitOverride !== undefined &&
      dailyMessageLimitOverride !== null &&
      (!Number.isFinite(dailyMessageLimitOverride) || dailyMessageLimitOverride < 0)
    ) {
      return NextResponse.json(
        { error: 'dailyMessageLimitOverride must be null or a non-negative integer.' },
        { status: 400 }
      );
    }

    const updated = await updateBotUserGovernance(id, {
      status,
      dailyMessageLimitOverride,
      suspendedReason:
        body.suspendedReason !== undefined ? body.suspendedReason : undefined,
    });

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'UPDATE',
      entity: 'BOT_USER',
      entityId: updated.id,
      entityName: updated.email,
      details: `Updated user status=${updated.status}, dailyLimitOverride=${updated.dailyMessageLimitOverride ?? 'default'}`,
    });

    return NextResponse.json({
      success: true,
      user: updated,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError || err instanceof BotAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to update user governance.' },
      { status: 500 }
    );
  }
}
