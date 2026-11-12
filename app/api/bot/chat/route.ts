import { NextRequest, NextResponse } from 'next/server';
import { executeQuantumBotChat } from '@/lib/bot/engine';
import { BotMessage, StreamChunk } from '@/lib/bot/types';
import { checkRateLimit } from '@/lib/rate-limit';

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
}

/**
 * QuantumBot Streaming Chat Endpoint (SSE)
 * POST /api/bot/chat
 */
export async function POST(req: NextRequest) {
  // 1. IP-based sliding window rate limiter
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const clientIp = (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || '127.0.0.1';

  const rateLimit = checkRateLimit(`bot:chat:${clientIp}`, 45, 60 * 1000);
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
    return NextResponse.json(
      { error: 'Invalid JSON request body.' },
      { status: 400 }
    );
  }

  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: 'A non-empty "messages" array is required.' },
      { status: 400 }
    );
  }

  // 3. Setup Server-Sent Events (SSE) Response Stream
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
        await executeQuantumBotChat({
          modelId: body.modelId,
          messages: body.messages,
          customSystemPrompt: body.customSystemPrompt,
          temperature: typeof body.temperature === 'number' ? body.temperature : 0.7,
          maxTokens: body.maxTokens,
          enableTools: body.enableTools !== false,
          conversationId: body.conversationId,
          onChunk: send,
          signal: req.signal,
        });
      } catch (err: any) {
        if (!req.signal.aborted && !isClosed) {
          send({
            type: 'error',
            error: err?.message || 'Chat generation encountered an error.',
          });
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

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
