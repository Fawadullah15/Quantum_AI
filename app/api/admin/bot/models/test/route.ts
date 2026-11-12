import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthError, requireBotAdmin } from '@/lib/bot/admin-guard';
import {
  ensureAdminConfigLoaded,
  listSafeProviderConfigs,
  recordProviderConnectivityCheck,
} from '@/lib/bot/admin-config';
import { getModelById, getRegisteredModels } from '@/lib/bot/models';
import { getProviderAdapter } from '@/lib/bot/providers';
import { AIProvider } from '@/lib/bot/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_PROVIDERS = new Set<AIProvider>(['gemini', 'openai', 'anthropic', 'openweight']);

/**
 * POST /api/admin/bot/models/test — Verifies live connectivity for a provider (or specific modelId)
 * and persists the latency + status result.
 */
export async function POST(req: NextRequest) {
  try {
    await requireBotAdmin({ write: true });
    await ensureAdminConfigLoaded();

    const body = await req.json().catch(() => ({}));
    let provider: AIProvider | null = VALID_PROVIDERS.has(body?.provider)
      ? (body.provider as AIProvider)
      : null;

    if (!provider && typeof body?.modelId === 'string') {
      const m = getModelById(body.modelId);
      if (m) provider = m.provider;
    }

    if (!provider) {
      return NextResponse.json(
        { error: 'Specify a valid provider or modelId to test connectivity.' },
        { status: 400 }
      );
    }

    const adapter = getProviderAdapter(provider);
    const result = await adapter.verifyConnection();
    await recordProviderConnectivityCheck(provider, result);

    const [providers] = await Promise.all([listSafeProviderConfigs()]);
    return NextResponse.json({
      success: result.success,
      provider,
      latencyMs: result.latencyMs,
      error: result.error,
      providers,
      models: getRegisteredModels(),
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json(
      { success: false, error: err?.message || 'Connectivity check failed.' },
      { status: 500 }
    );
  }
}
