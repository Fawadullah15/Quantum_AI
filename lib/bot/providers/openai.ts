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

export function getOpenAIApiKey(): string | null {
  return process.env.OPENAI_API_KEY || null;
}

export function getOpenAIBaseUrl(): string {
  return (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
}

export class OpenAIProviderAdapter implements ProviderAdapter {
  id = 'openai' as const;
  name = 'OpenAI';

  isConfigured(): boolean {
    return Boolean(getOpenAIApiKey());
  }

  async verifyConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const key = getOpenAIApiKey();
    if (!key) {
      return { success: false, error: 'OPENAI_API_KEY is not configured in environment.' };
    }

    const baseUrl = getOpenAIBaseUrl();
    const t0 = Date.now();
    try {
      const res = await fetch(`${baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${key}`,
        },
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
    const key = getOpenAIApiKey();
    if (!key) {
      throw new Error(
        'OpenAI Provider is not configured. Please set OPENAI_API_KEY in your server environment.'
      );
    }

    const baseUrl = getOpenAIBaseUrl();
    const modelIdentifier = request.modelId.replace(/^openai\//, '');

    // Format messages for OpenAI API
    const messages: any[] = [];

    if (request.systemInstruction) {
      messages.push({
        role: 'system',
        content: request.systemInstruction,
      });
    }

    for (const msg of request.messages) {
      const contentParts: any[] = [];
      const textContent = formatMessageWithAttachments(msg);

      if (textContent) {
        contentParts.push({ type: 'text', text: textContent });
      }

      if (msg.attachments) {
        for (const att of msg.attachments) {
          if (att.mimeType.startsWith('image/')) {
            const url = att.base64?.startsWith('data:')
              ? att.base64
              : att.base64
              ? `data:${att.mimeType};base64,${att.base64}`
              : att.url;
            if (url) {
              contentParts.push({
                type: 'image_url',
                image_url: { url, detail: 'auto' },
              });
            }
          }
        }
      }

      // If text only, use string content for compatibility with older endpoints
      const finalContent =
        contentParts.length === 1 && contentParts[0].type === 'text'
          ? contentParts[0].text
          : contentParts;

      messages.push({
        role: msg.role === 'tool' ? 'tool' : msg.role,
        content: finalContent,
      });
    }

    const payload: any = {
      model: modelIdentifier,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
      stream_options: { include_usage: true },
    };

    if (request.tools && request.tools.length > 0) {
      payload.tools = request.tools.map((t) => ({
        type: 'function',
        function: {
          name: t.declaration.name,
          description: t.declaration.description,
          parameters: t.declaration.parameters,
        },
      }));
      payload.tool_choice = 'auto';
    }

    onChunk({ type: 'start', model: modelIdentifier });

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `OpenAI API Error (HTTP ${response.status}): ${response.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}
      onChunk({ type: 'error', error: errorMsg });
      throw new Error(errorMsg);
    }

    let fullText = '';
    const toolCallsMap: Record<number, { id: string; name: string; argsText: string }> = {};
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
          if (jsonStr === '[DONE]') continue;

          try {
            const data = JSON.parse(jsonStr);

            if (data.usage) {
              usage = {
                promptTokens: data.usage.prompt_tokens || 0,
                completionTokens: data.usage.completion_tokens || 0,
                totalTokens: data.usage.total_tokens || 0,
              };
            }

            const choice = data.choices?.[0];
            if (!choice) continue;

            if (choice.finish_reason) {
              finishReason = choice.finish_reason;
            }

            const delta = choice.delta;
            if (!delta) continue;

            // Stream text chunk
            if (delta.content) {
              fullText += delta.content;
              onChunk({ type: 'text', text: delta.content });
            }

            // Stream reasoning/thought if present (DeepSeek R1 / o1 / o3)
            if (delta.reasoning_content) {
              onChunk({ type: 'thought', thought: delta.reasoning_content });
            }

            // Stream tool calls
            if (Array.isArray(delta.tool_calls)) {
              for (const tc of delta.tool_calls) {
                const index = tc.index ?? 0;
                if (!toolCallsMap[index]) {
                  toolCallsMap[index] = {
                    id: tc.id || `call_${Date.now()}_${index}`,
                    name: tc.function?.name || '',
                    argsText: '',
                  };
                }
                if (tc.function?.name) {
                  toolCallsMap[index].name = tc.function.name;
                }
                if (tc.function?.arguments) {
                  toolCallsMap[index].argsText += tc.function.arguments;
                }
              }
            }
          } catch {
            // Partial JSON line ignored
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Assemble completed tool calls
    const completedToolCalls: BotToolCall[] = [];
    const completedToolResults: any[] = [];

    for (const item of Object.values(toolCallsMap)) {
      if (item.name) {
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(item.argsText || '{}');
        } catch {
          parsedArgs = { raw: item.argsText };
        }

        const toolCall: BotToolCall = {
          id: item.id,
          name: item.name,
          arguments: parsedArgs,
        };
        completedToolCalls.push(toolCall);
        onChunk({ type: 'tool_call', toolCall });

        const { result, isError } = await executeToolCall(item.name, parsedArgs, {
          conversationId: request.conversationId,
          modelId: request.modelId,
        });

        const toolResultObj = {
          toolCallId: item.id,
          toolName: item.name,
          result,
          isError,
        };
        completedToolResults.push(toolResultObj);
        onChunk({ type: 'tool_result', toolResult: toolResultObj });
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
      toolCalls: completedToolCalls.length > 0 ? completedToolCalls : undefined,
      toolResults: completedToolResults.length > 0 ? completedToolResults : undefined,
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
