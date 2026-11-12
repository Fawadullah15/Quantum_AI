import { NextResponse } from 'next/server';
import { getRegisteredModels, resolveActiveModel, getModelById } from '@/lib/bot/models';
import { getProviderAdapter } from '@/lib/bot/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const models = getRegisteredModels();
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

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const modelId = body?.modelId;

    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'modelId is required for connection testing.' },
        { status: 400 }
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
