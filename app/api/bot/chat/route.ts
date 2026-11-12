import { NextRequest, NextResponse } from 'next/server';
import {
  AttachmentResolutionError,
  executeQuantumBotChat,
  resolveAndValidateChatMessages,
} from '@/lib/bot/engine';
import {
  getModelById,
  isModelExplicitlyDisabled,
  resolveActiveModel,
} from '@/lib/bot/models';
import { ensureAdminConfigLoaded, getEffectiveUsageLimits } from '@/lib/bot/admin-config';
import {
  checkChatUsageLimits,
  estimateModelCostUsd,
  recordBotUsageEvent,
} from '@/lib/bot/usage-tracker';
import { BotMessage, StreamChunk } from '@/lib/bot/types';
import { checkRateLimit } from '@/lib/rate-limit';
import { enforceSameOrigin } from '@/lib/bot/http-security';
import { attachActorCookies, resolveBotActor } from '@/lib/bot/auth';
import {
  ConversationForbiddenError,
  ConversationValidationError,
  assertConversationOwnership,
  upsertConversationForOwner,
} from '@/lib/bot/conversation-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface BotChatRequestBody {
  messages: BotMessage[];
  modelId?: string;
  conversationId?: string;
  customSystemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  enableWebSearch?: boolean;
  approvedActionKeys?: string[];
}

/**
 * QuantumBot Streaming Chat Endpoint (SSE)
 * POST /api/bot/chat
 */
export async function POST(req: NextRequest) {
  const originErr = enforceSameOrigin(req);
  if (originErr) return originErr;

  await ensureAdminConfigLoaded().catch(() => {});

  // 1. IP-based coarse burst protection
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const rateLimit = checkRateLimit(`bot:chat:${clientIp}`, 60, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please wait ${rateLimit.resetInSeconds}s before sending another message.`,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetInSeconds),
        },
      }
    );
  }

  // 2. Parse and validate payload
  let body: BotChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'A non-empty "messages" array is required.' },
      { status: 400 }
    );
  }

  // 3. Resolve actor identity (Bot Account > NextAuth Admin > Isolated Anonymous Session)
  const { actor, anonCookieToAttach } = await resolveBotActor(req, true);
  const botUserId = actor.authType === 'bot_account' && actor.user ? actor.user.id : null;

  // 3a. Enforce explicitly disabled model/provider before falling back
  const disabledCheck = isModelExplicitlyDisabled(body.modelId);
  if (disabledCheck.disabled) {
    await recordBotUsageEvent({
      eventType: 'limit_exceeded',
      ownerId: actor.ownerId || 'anonymous',
      botUserId,
      authType: actor.authType,
      conversationId: body.conversationId,
      modelId: body.modelId,
      statusCode: 403,
      errorMessage: disabledCheck.reason,
    }).catch(() => {});
    const disabledRes = NextResponse.json(
      { error: disabledCheck.reason || 'Selected model is disabled.' },
      { status: 403 }
    );
    attachActorCookies(disabledRes, anonCookieToAttach, req);
    return disabledRes;
  }

  const { model } = resolveActiveModel(body.modelId);

  // 3b. Enforce strict conversation ownership BEFORE running limits or model
  if (body.conversationId) {
    try {
      await assertConversationOwnership(body.conversationId, actor.ownerId);
    } catch (ownErr: any) {
      if (ownErr instanceof ConversationForbiddenError) {
        const forbiddenRes = NextResponse.json({ error: ownErr.message }, { status: 403 });
        attachActorCookies(forbiddenRes, anonCookieToAttach, req);
        return forbiddenRes;
      }
      if (ownErr instanceof ConversationValidationError) {
        const badRes = NextResponse.json({ error: ownErr.message }, { status: 400 });
        attachActorCookies(badRes, anonCookieToAttach, req);
        return badRes;
      }
    }
  }

  // 3c. Enforce server-side usage limits, per-user RPM, request size & spending controls
  const limits = getEffectiveUsageLimits();
  const limitCheck = await checkChatUsageLimits({
    actor,
    messages: body.messages,
    model,
    limits,
    conversationId: body.conversationId,
  });

  if (!limitCheck.allowed) {
    const blockedRes = NextResponse.json(
      { error: limitCheck.reason || 'Usage limit exceeded.' },
      {
        status: limitCheck.statusCode || 429,
        headers: limitCheck.retryAfterSeconds
          ? { 'Retry-After': String(limitCheck.retryAfterSeconds) }
          : undefined,
      }
    );
    attachActorCookies(blockedRes, anonCookieToAttach, req);
    return blockedRes;
  }

  // 3d. Validate attachments & vision capability
  let validatedMessages: BotMessage[];
  try {
    validatedMessages = await resolveAndValidateChatMessages(
      body.messages,
      model,
      actor.ownerId
    );
  } catch (err: any) {
    if (err instanceof AttachmentResolutionError) {
      const errRes = NextResponse.json({ error: err.message }, { status: err.statusCode });
      attachActorCookies(errRes, anonCookieToAttach, req);
      return errRes;
    }
    const errRes = NextResponse.json(
      { error: err?.message || 'Attachment validation failed.' },
      { status: 400 }
    );
    attachActorCookies(errRes, anonCookieToAttach, req);
    return errRes;
  }

  // 4. Setup Server-Sent Events (SSE) Response Stream
  const requestStartedAt = Date.now();
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let isClosed = false;

      const send = (chunk: StreamChunk) => {
        if (isClosed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        } catch {
          // Controller might have been closed by consumer abort
        }
      };

      try {
        const chatResponse = await executeQuantumBotChat({
          modelId: body.modelId,
          messages: body.messages,
          validatedMessages,
          customSystemPrompt: body.customSystemPrompt,
          userPreferences: actor.preferences,
          temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
          maxTokens: body.maxTokens,
          enableTools: body.enableTools !== false,
          enableWebSearch: body.enableWebSearch === true,
          approvedActionKeys: Array.isArray(body.approvedActionKeys)
            ? body.approvedActionKeys.filter((k) => typeof k === 'string')
            : undefined,
          conversationId: body.conversationId,
          ownerId: actor.ownerId,
          onChunk: send,
          signal: req.signal,
        });

        const latencyMs = Date.now() - requestStartedAt;
        const usedModelDef = getModelById(chatResponse.model) || model;
        const estimatedCostUsd = estimateModelCostUsd(usedModelDef, chatResponse.usage);

        // Record genuine telemetry event (no prompt/response content stored)
        await recordBotUsageEvent({
          eventType: 'chat_success',
          ownerId: actor.ownerId || 'anonymous',
          botUserId,
          authType: actor.authType,
          conversationId: body.conversationId,
          modelId: usedModelDef.id,
          provider: usedModelDef.provider,
          promptTokens: chatResponse.usage?.promptTokens || 0,
          completionTokens: chatResponse.usage?.completionTokens || 0,
          totalTokens: chatResponse.usage?.totalTokens || 0,
          estimatedCostUsd,
          latencyMs,
          statusCode: 200,
        }).catch(() => {});

        // Persist conversation turn safely on the backend for cross-session history
        if (
          body.conversationId &&
          actor.ownerId &&
          (chatResponse.content || (chatResponse.toolCalls && chatResponse.toolCalls.length > 0))
        ) {
          const assistantMsg: BotMessage = {
            id: `msg_asst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content: chatResponse.content,
            model: chatResponse.model || model.id,
            toolCalls: chatResponse.toolCalls,
            toolResults: chatResponse.toolResults,
            createdAt: new Date().toISOString(),
          };
          await upsertConversationForOwner(
            {
              id: body.conversationId,
              modelId: usedModelDef.id,
              messages: [...body.messages, assistantMsg],
            },
            actor.ownerId
          ).catch(() => {});
        }
      } catch (err: any) {
        if (!req.signal.aborted) {
          const latencyMs = Date.now() - requestStartedAt;
          await recordBotUsageEvent({
            eventType: 'chat_error',
            ownerId: actor.ownerId || 'anonymous',
            botUserId,
            authType: actor.authType,
            conversationId: body.conversationId,
            modelId: model.id,
            provider: model.provider,
            latencyMs,
            statusCode: 500,
            errorMessage: err?.message || 'Chat generation encountered an error.',
          }).catch(() => {});

          if (!isClosed) {
            send({
              type: 'error',
              error: err?.message || 'Chat generation encountered an error.',
            });
          }
        }
      } finally {
        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch {
            // Safe ignore if already closed
          }
        }
      }
    },
    cancel() {
      // Client disconnected / stopped generation
    },
  });

  const res = new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
  attachActorCookies(res, anonCookieToAttach, req);
  return res;
}
