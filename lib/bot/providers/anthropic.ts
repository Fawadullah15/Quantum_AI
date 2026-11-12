import {
  ProviderAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  BotMessage,
  TokenUsage,
  BotToolCall,
} from '../types';
import { executeToolCall } from '../tools';
import { formatMessageWithAttachments } from '../context-manager';

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
      // Send a minimal 1-token ping message
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

    // Format messages for Anthropic
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

    // Format tools for Anthropic
    const tools: any[] = [];
    if (request.tools && request.tools.length > 0) {
      for (const t of request.tools) {
        tools.push({
          name: t.declaration.name,
          description: t.declaration.description,
          input_schema: t.declaration.parameters,
        });
      }
    }

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

    onChunk({ type: 'start', model: modelIdentifier });

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

    let fullText = '';
    const pendingToolCalls: any[] = [];
    let currentToolCall: any = null;
    let toolJsonBuffer = '';
    let usage: TokenUsage | undefined;
    let finishReason: string | undefined;

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
              usage = {
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
                };
                toolJsonBuffer = '';
              }
            }

            if (data.type === 'content_block_delta') {
              if (data.delta?.type === 'text_delta' && data.delta.text) {
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
                pendingToolCalls.push(currentToolCall);
                onChunk({ type: 'tool_call', toolCall: currentToolCall });
                currentToolCall = null;
                toolJsonBuffer = '';
              }
            }

            if (data.type === 'message_delta') {
              if (data.delta?.stop_reason) {
                finishReason = data.delta.stop_reason;
              }
              if (data.usage?.output_tokens && usage) {
                usage.completionTokens = data.usage.output_tokens;
                usage.totalTokens = usage.promptTokens + usage.completionTokens;
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

    // Execute tool calls
    const toolResults: any[] = [];
    if (pendingToolCalls.length > 0) {
      for (const call of pendingToolCalls) {
        const { result, isError } = await executeToolCall(call.name, call.arguments, {
          conversationId: request.conversationId,
          modelId: request.modelId,
        });

        const toolResObj = {
          toolCallId: call.id,
          toolName: call.name,
          result,
          isError,
        };
        toolResults.push(toolResObj);
        onChunk({ type: 'tool_result', toolResult: toolResObj });
      }
    }

    onChunk({
      type: 'done',
      model: modelIdentifier,
      usage,
      finishReason,
    });

    return {
      content: fullText,
      model: modelIdentifier,
      toolCalls: pendingToolCalls.length > 0 ? pendingToolCalls : undefined,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      usage,
      finishReason,
    };
  }

  async chat(request: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
    let text = '';
    return this.streamChat(
      request,
      (c) => {
        if (c.text) text += c.text;
      },
      signal
    );
  }
}
