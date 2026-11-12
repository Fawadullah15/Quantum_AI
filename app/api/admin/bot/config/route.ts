import { NextRequest, NextResponse } from 'next/server';
import {
  AdminAuthError,
  logAdminBotActivity,
  requireBotAdmin,
} from '@/lib/bot/admin-guard';
import {
  AdminConfigError,
  ALL_CAPABILITIES,
  ensureAdminConfigLoaded,
  getEffectiveUsageLimits,
  listSafeProviderConfigs,
  updateProviderConfig,
} from '@/lib/bot/admin-config';
import { getRegisteredModels } from '@/lib/bot/models';
import { enforceSameOrigin } from '@/lib/bot/http-security';
import { AIProvider } from '@/lib/bot/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/bot/config — Returns SAFE masked provider settings, model catalog, and usage limits.
 * API keys are NEVER returned in plaintext.
 */
export async function GET() {
  try {
    await requireBotAdmin({ write: false });
    await ensureAdminConfigLoaded();

    const [providers] = await Promise.all([listSafeProviderConfigs()]);
    const models = getRegisteredModels();
    const limits = getEffectiveUsageLimits();

    return NextResponse.json({
      success: true,
      providers,
      models,
      limits,
      allCapabilities: ALL_CAPABILITIES,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to load QuantumBot configuration.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bot/config — Updates a provider configuration (key encrypted immediately on write).
 */
export async function PATCH(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;

  try {
    const admin = await requireBotAdmin({ write: true });
    const body = await req.json().catch(() => null);
    if (!body || !body.provider) {
      return NextResponse.json(
        { error: 'A valid provider identifier is required.' },
        { status: 400 }
      );
    }

    const updatedProvider = await updateProviderConfig(body.provider as AIProvider, {
      enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
      apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
      clearApiKey: body.clearApiKey === true,
      baseUrl: body.baseUrl !== undefined ? body.baseUrl : undefined,
      openweightBackend:
        body.openweightBackend !== undefined ? body.openweightBackend : undefined,
      monthlyBudgetUsd:
        body.monthlyBudgetUsd !== undefined
          ? body.monthlyBudgetUsd === null || body.monthlyBudgetUsd === ''
            ? null
            : Number(body.monthlyBudgetUsd)
          : undefined,
      alertThresholdPct:
        body.alertThresholdPct !== undefined ? Number(body.alertThresholdPct) : undefined,
    });

    const models = getRegisteredModels();

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'UPDATE',
      entity: 'BOT_PROVIDER',
      entityId: updatedProvider.provider,
      entityName: updatedProvider.name,
      details: `Updated provider config (enabled=${updatedProvider.enabled}, keyUpdated=${Boolean(body.apiKey || body.clearApiKey)})`,
    });

    return NextResponse.json({
      success: true,
      provider: updatedProvider,
      models,
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError || err instanceof AdminConfigError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { error: err?.message || 'Failed to update provider configuration.' },
      { status: 500 }
    );
  }
}
