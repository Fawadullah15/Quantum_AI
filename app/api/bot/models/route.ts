import { NextRequest, NextResponse } from 'next/server';
import { getRegisteredModels, resolveActiveModel, getModelById, isModelExplicitlyDisabled } from '@/lib/bot/models';
import { getProviderAdapter } from '@/lib/bot/providers';
import { ensureAdminConfigLoaded, recordProviderConnectivityCheck } from '@/lib/bot/admin-config';
import { requireBotAdmin } from '@/lib/bot/admin-guard';
import { checkRateLimit } from '@/lib/rate-limit';
import { enforceSameOrigin } from '@/lib/bot/http-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureAdminConfigLoaded();
    const models = getRegisteredModels().filter((m) => m.enabled !== false);
    const active = resolveActiveModel();

    return NextResponse.json({
      success: true,
      defaultModelId: active.model.id,
      isDefaultFallback: active.isFallback,
      fallbackReason: active.fallbackReason,
      models,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to retrieve models.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;

  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';
  const rl = checkRateLimit(`bot:models:test:${clientIp}`, 15, 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: `Rate limit exceeded. Wait ${rl.resetInSeconds}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.resetInSeconds) } }
    );
  }

  try {
    await ensureAdminConfigLoaded();
    const body = await req.json().catch(() => ({}));
    const modelId = body?.modelId;

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'modelId is required for connection testing.' },
        { status: 400 }
      );
    }

    const disabledCheck = isModelExplicitlyDisabled(modelId);
    if (disabledCheck.disabled) {
      return NextResponse.json(
        { success: false, error: disabledCheck.reason },
        { status: 403 }
      );
    }

    const model = getModelById(modelId);
    if (!model) {
      return NextResponse.json(
        { success: false, error: `Model "${modelId}" is not in the registry.` },
        { status: 404 }
      );
    }

    const adapter = getProviderAdapter(model.provider);
    const verification = await adapter.verifyConnection();

    // Only write connectivity telemetry to persistent admin config when an authorized admin initiates it
    try {
      await requireBotAdmin({ write: true });
      await recordProviderConnectivityCheck(model.provider, verification).catch(() => {});
    } catch {
      // Public visitors get ephemeral test result only without mutating admin telemetry
    }

    return NextResponse.json({
      success: verification.success,
      modelId,
      provider: model.provider,
      latencyMs: verification.latencyMs,
      error: verification.error,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
