import {
  ProviderAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  TokenUsage,
  BotToolCall,
  BotToolResult,
  BotToolContext,
} from '../types';
import { executeToolCall } from '../tools';
import { toProviderParametersSchema } from '../tools/schema-validator';
import { formatMessageWithAttachments } from '../context-manager';

const MAX_TOOL_ROUNDS = 4;

export function getAnthropicApiKey(): string | null {
  return process.env.ANTHROPIC_API_KEY || null;
}

export function getAnthropicBaseUrl(): string {
  return (process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
}

export class AnthropicProviderAdapter implements ProviderAdapter {
  id = 'anthropic' as const;
  name = 'Anthropic Claude';

  isConfigured(): boolean {
    return Boolean(getAnthropicApiKey());
  }

  async verifyConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const key = getAnthropicApiKey();
    if (!key) {
      return { success: false, error: 'ANTHROPIC_API_KEY is not configured in environment.' };
    }

    const baseUrl = getAnthropicBaseUrl();
    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'ping' }],
        }),
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          latencyMs,
          error: errJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`,
        };
      }

      return { success: true, latencyMs };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Date.now() - t0,
        error: err?.message || 'Connection timed out or network error',
      };
    }
  }

  async streamChat(
    request: ChatRequest,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<ChatResponse> {
    const key = getAnthropicApiKey();
    if (!key) {
      throw new Error(
        'Anthropic Provider is not configured. Please set ANTHROPIC_API_KEY in your server environment.'
      );
    }

    const baseUrl = getAnthropicBaseUrl();
    const modelIdentifier = request.modelId.replace(/^anthropic\//, '');

    const messages: any[] = [];
    for (const msg of request.messages) {
      if (msg.role === 'system') continue;

      const contentBlocks: any[] = [];
      const textContent = formatMessageWithAttachments(msg, { skipPdfTextWhenNative: true });

      if (msg.attachments) {
        for (const att of msg.attachments) {
          if (att.status === 'expired' || att.status === 'error') continue;
          if (att.mimeType.startsWith('image/') && att.base64) {
            contentBlocks.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: att.mimeType,
                data: att.base64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          } else if (att.mimeType === 'application/pdf' && att.base64) {
            contentBlocks.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: att.base64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          }
        }
      }

      if (textContent) {
        contentBlocks.push({ type: 'text', text: textContent });
      }

      if (contentBlocks.length > 0) {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: contentBlocks,
        });
      }
    }

    const tools: any[] = [];
    if (request.tools && request.tools.length > 0) {
      for (const t of request.tools) {
        tools.push({
          name: t.declaration.name,
          description: t.declaration.description,
          input_schema: toProviderParametersSchema(t.declaration.parameters),
        });
      }
    }

    const toolContext: BotToolContext = {
      conversationId: request.conversationId,
      ownerId: request.ownerId,
      modelId: request.modelId,
      permissions: request.permissions,
      enableWebSearch: request.enableWebSearch,
      approvedActionKeys: request.approvedActionKeys,
    };

    onChunk({ type: 'start', model: modelIdentifier });

    let fullText = '';
    const allToolCalls: BotToolCall[] = [];
    const allToolResults: BotToolResult[] = [];
    let totalUsage: TokenUsage | undefined;
    let finishReason: string | undefined;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const payload: any = {
        model: modelIdentifier,
        messages,
        max_tokens: request.maxTokens ?? 4096,
        temperature: request.temperature ?? 0.7,
        stream: true,
      };

      if (request.systemInstruction) {
        payload.system = request.systemInstruction;
      }

      if (tools.length > 0) {
        payload.tools = tools;
      }

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(payload),
        signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        let errorMsg = `Anthropic API Error (HTTP ${response.status}): ${response.statusText}`;
        try {
          const parsed = JSON.parse(errText);
          if (parsed.error?.message) errorMsg = parsed.error.message;
        } catch {}
        onChunk({ type: 'error', error: errorMsg });
        throw new Error(errorMsg);
      }

      let roundText = '';
      const roundToolCalls: BotToolCall[] = [];
      let currentToolCall: BotToolCall | null = null;
      let toolJsonBuffer = '';
      let roundUsage: TokenUsage | undefined;

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream body unavailable.');

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const jsonStr = trimmed.slice(6);

            try {
              const data = JSON.parse(jsonStr);

              if (data.type === 'message_start' && data.message?.usage) {
                roundUsage = {
                  promptTokens: data.message.usage.input_tokens || 0,
                  completionTokens: 0,
                  totalTokens: data.message.usage.input_tokens || 0,
                };
              }

              if (data.type === 'content_block_start') {
                if (data.content_block?.type === 'tool_use') {
                  currentToolCall = {
                    id: data.content_block.id,
                    name: data.content_block.name,
                    arguments: {},
                    status: 'running',
                  };
                  toolJsonBuffer = '';
                }
              }

              if (data.type === 'content_block_delta') {
                if (data.delta?.type === 'text_delta' && data.delta.text) {
                  roundText += data.delta.text;
                  fullText += data.delta.text;
                  onChunk({ type: 'text', text: data.delta.text });
                } else if (data.delta?.type === 'input_json_delta' && data.delta.partial_json) {
                  toolJsonBuffer += data.delta.partial_json;
                }
              }

              if (data.type === 'content_block_stop') {
                if (currentToolCall) {
                  try {
                    currentToolCall.arguments = JSON.parse(toolJsonBuffer || '{}');
                  } catch {
                    currentToolCall.arguments = { raw: toolJsonBuffer };
                  }
                  roundToolCalls.push(currentToolCall);
                  allToolCalls.push(currentToolCall);
                  onChunk({ type: 'tool_call', toolCall: currentToolCall });
                  currentToolCall = null;
                  toolJsonBuffer = '';
                }
              }

              if (data.type === 'message_delta') {
                if (data.delta?.stop_reason) {
                  finishReason = data.delta.stop_reason;
                }
                if (data.usage?.output_tokens && roundUsage) {
                  roundUsage.completionTokens = data.usage.output_tokens;
                  roundUsage.totalTokens = roundUsage.promptTokens + roundUsage.completionTokens;
                }
              }
            } catch {
              // Partial JSON line
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (roundUsage) {
        totalUsage = {
          promptTokens: (totalUsage?.promptTokens || 0) + roundUsage.promptTokens,
          completionTokens: (totalUsage?.completionTokens || 0) + roundUsage.completionTokens,
          totalTokens: (totalUsage?.totalTokens || 0) + roundUsage.totalTokens,
        };
      }

      if (roundToolCalls.length === 0) {
        break;
      }

      const assistantBlocks: any[] = [];
      if (roundText) assistantBlocks.push({ type: 'text', text: roundText });
      for (const call of roundToolCalls) {
        assistantBlocks.push({
          type: 'tool_use',
          id: call.id,
          name: call.name,
          input: call.arguments,
        });
      }

      const userToolResultBlocks: any[] = [];
      let requiresConfirmationPause = false;

      for (const call of roundToolCalls) {
        const outcome = await executeToolCall(call.name, call.arguments, toolContext);

        const toolResObj: BotToolResult = {
          toolCallId: call.id,
          toolName: call.name,
          result: outcome.result,
          isError: outcome.isError,
          status: outcome.status,
          durationMs: outcome.durationMs,
          confirmationRequired: outcome.confirmationRequired,
          actionPreview: outcome.actionPreview
            ? { ...outcome.actionPreview, toolCallId: call.id }
            : undefined,
        };
        allToolResults.push(toolResObj);
        onChunk({ type: 'tool_result', toolResult: toolResObj });

        if (outcome.confirmationRequired) {
          requiresConfirmationPause = true;
        }

        userToolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify(outcome.result),
          is_error: Boolean(outcome.isError),
        });
      }

      if (requiresConfirmationPause) {
        if (!fullText.trim()) {
          const pauseNote =
            'Please review the pending action details below and click **Approve & Execute** to proceed, or **Cancel** to discard.';
          fullText += pauseNote;
          onChunk({ type: 'text', text: pauseNote });
        }
        finishReason = 'confirmation_required';
        break;
      }

      messages.push({ role: 'assistant', content: assistantBlocks });
      messages.push({ role: 'user', content: userToolResultBlocks });

      if (round < MAX_TOOL_ROUNDS - 1) {
        onChunk({
          type: 'thought',
          thought: 'Analyzing retrieved tool results...',
        });
      }
    }

    onChunk({
      type: 'done',
      model: modelIdentifier,
      usage: totalUsage,
      finishReason,
    });

    return {
      content: fullText,
      model: modelIdentifier,
      toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
      toolResults: allToolResults.length > 0 ? allToolResults : undefined,
      usage: totalUsage,
      finishReason,
    };
  }

  async chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    return this.streamChat(request, () => {}, signal);
  }
}
