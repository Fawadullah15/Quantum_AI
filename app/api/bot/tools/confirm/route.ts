import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import { computeActionKey, executeToolCall, getToolByName } from '@/lib/bot/tools';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ConfirmToolBody {
  toolName: string;
  arguments: Record<string, any>;
  approved: boolean;
  actionKey?: string;
  conversationId?: string;
}

/**
 * Explicit User Confirmation Endpoint for Sensitive / Externally Visible QuantumBot Tools
 * POST /api/bot/tools/confirm
 */
export async function POST(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const rateLimit = checkRateLimit(`bot:toolconfirm:${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. Wait ${rateLimit.resetInSeconds}s.` },
      { status: 429 }
    );
  }

  let body: ConfirmToolBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const toolName = String(body?.toolName || '').trim();
  if (!toolName) {
    return NextResponse.json({ error: 'Missing "toolName".' }, { status: 400 });
  }

  const tool = getToolByName(toolName);
  if (!tool) {
    return NextResponse.json(
      { error: `Tool "${toolName}" is not registered or is unavailable.` },
      { status: 404 }
    );
  }

  const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
  const rawArgs = body.arguments && typeof body.arguments === 'object' ? body.arguments : {};

  if (!body.approved) {
    const res = NextResponse.json({
      approved: false,
      status: 'cancelled',
      toolName,
      result: {
        cancelled: true,
        message: 'Action cancelled by user. No external action was taken.',
      },
    });
    attachActorCookies(res, anonCookieToAttach, req);
    return res;
  }

  const expectedKey = computeActionKey(toolName, rawArgs);
  if (body.actionKey && body.actionKey !== expectedKey) {
    const res = NextResponse.json(
      {
        error: 'Action confirmation signature mismatch. Parameters cannot differ from the previewed action.',
      },
      { status: 400 }
    );
    attachActorCookies(res, anonCookieToAttach, req);
    return res;
  }

  const outcome = await executeToolCall(toolName, rawArgs, {
    conversationId: body.conversationId,
    ownerId: actor.ownerId,
    permissions: ['public_read', 'compute', 'external_write'],
    approvedActionKeys: [expectedKey],
  });

  const res = NextResponse.json({
    approved: true,
    toolName,
    status: outcome.status,
    isError: outcome.isError,
    durationMs: outcome.durationMs,
    result: outcome.result,
  });
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}
