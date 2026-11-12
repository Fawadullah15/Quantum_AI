import { NextRequest, NextResponse } from 'next/server';
import {
  AdminAuthError,
  logAdminBotActivity,
  requireBotAdmin,
} from '@/lib/bot/admin-guard';
import {
  AdminConfigError,
  deleteCustomAdminModel,
  ensureAdminConfigLoaded,
  setDefaultAdminModel,
  setModelEnabledStatus,
  upsertAdminModelConfig,
} from '@/lib/bot/admin-config';
import { getRegisteredModels } from '@/lib/bot/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireBotAdmin({ write: false });
    await ensureAdminConfigLoaded();
    return NextResponse.json({
      success: true,
      models: getRegisteredModels(),
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: err?.message || 'Failed to load models.' }, { status: 500 });
  }
}

/**
 * POST /api/admin/bot/models — Add a custom model or update full model specification & capabilities.
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireBotAdmin({ write: true });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid model payload.' }, { status: 400 });
    }

    const saved = await upsertAdminModelConfig({
      id: String(body.id || ''),
      name: String(body.name || ''),
      provider: body.provider,
      modelIdentifier: String(body.modelIdentifier || ''),
      description: typeof body.description === 'string' ? body.description : undefined,
      capabilities: Array.isArray(body.capabilities) ? body.capabilities : ['streaming'],
      contextWindow: Number(body.contextWindow || 32768),
      maxOutputTokens: Number(body.maxOutputTokens || 4096),
      pricing: {
        inputPerMillion: Number(body.pricing?.inputPerMillion ?? body.inputPerMillion ?? 0),
        outputPerMillion: Number(body.pricing?.outputPerMillion ?? body.outputPerMillion ?? 0),
      },
      family: typeof body.family === 'string' ? body.family : undefined,
      recommendedFor: typeof body.recommendedFor === 'string' ? body.recommendedFor : undefined,
      enabled: body.enabled !== false,
      isDefault: body.isDefault === true,
    });

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'UPSERT',
      entity: 'BOT_MODEL',
      entityId: saved.id,
      entityName: saved.name,
      details: `Saved model configuration (${saved.provider}: ${saved.modelIdentifier})`,
    });

    return NextResponse.json(
      {
        success: true,
        model: saved,
        models: getRegisteredModels(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    if (err instanceof AdminAuthError || err instanceof AdminConfigError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: err?.message || 'Failed to save model.' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/bot/models — Toggle model enabled state or promote to default model.
 */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireBotAdmin({ write: true });
    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id.trim() : '';
    if (!id) {
      return NextResponse.json({ error: 'Model ID is required.' }, { status: 400 });
    }

    let updated;
    if (body.isDefault === true) {
      updated = await setDefaultAdminModel(id);
    } else if (typeof body.enabled === 'boolean') {
      updated = await setModelEnabledStatus(id, body.enabled);
    } else {
      return NextResponse.json(
        { error: 'Specify enabled (boolean) or isDefault: true.' },
        { status: 400 }
      );
    }

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'UPDATE',
      entity: 'BOT_MODEL',
      entityId: updated.id,
      entityName: updated.name,
      details: `Updated model flags (enabled=${updated.enabled}, isDefault=${updated.isDefault})`,
    });

    return NextResponse.json({
      success: true,
      model: updated,
      models: getRegisteredModels(),
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError || err instanceof AdminConfigError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: err?.message || 'Failed to update model.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/bot/models?id=... — Permanently removes a custom model configuration.
 */
export async function DELETE(req: NextRequest) {
  try {
    const admin = await requireBotAdmin({ write: true });
    const id = req.nextUrl.searchParams.get('id')?.trim() || '';
    if (!id) {
      return NextResponse.json({ error: 'Model id query parameter is required.' }, { status: 400 });
    }

    await deleteCustomAdminModel(id);

    await logAdminBotActivity({
      actorId: admin.id,
      action: 'DELETE',
      entity: 'BOT_MODEL',
      entityId: id,
      details: `Deleted custom model "${id}"`,
    });

    return NextResponse.json({
      success: true,
      models: getRegisteredModels(),
    });
  } catch (err: any) {
    if (err instanceof AdminAuthError || err instanceof AdminConfigError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: err?.message || 'Failed to delete model.' }, { status: 500 });
  }
}
