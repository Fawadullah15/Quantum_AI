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

export interface OpenWeightEndpointConfig {
  baseUrl: string;
  apiKey: string;
  providerName: string;
}

export function resolveOpenWeightEndpoint(): OpenWeightEndpointConfig | null {
  // 1. Groq (Ultra-fast Llama & Qwen inference)
  if (process.env.GROQ_API_KEY) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      providerName: 'Groq',
    };
  }

  // 2. OpenRouter (Universal open-weight gateway)
  if (process.env.OPENROUTER_API_KEY) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      providerName: 'OpenRouter',
    };
  }

  // 3. Together AI
  if (process.env.TOGETHER_API_KEY) {
    return {
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY,
      providerName: 'Together AI',
    };
  }

  // 4. Local Ollama (if explicitly configured or reachable)
  if (process.env.OLLAMA_BASE_URL) {
    return {
      baseUrl: process.env.OLLAMA_BASE_URL.replace(/\/+$/, '') + '/v1',
      apiKey: 'ollama',
      providerName: 'Ollama Local',
    };
  }

  return null;
}

export class OpenWeightProviderAdapter implements ProviderAdapter {
  id = 'openweight' as const;
  name = 'Open-Weight (Llama / Qwen / DeepSeek)';

  isConfigured(): boolean {
    return Boolean(resolveOpenWeightEndpoint());
  }

  async verifyConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const config = resolveOpenWeightEndpoint();
    if (!config) {
      return {
        success: false,
        error:
          'No open-weight inference provider configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or TOGETHER_API_KEY.',
      };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(`${config.baseUrl}/models`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Date.now() - t0;
      if (!res.ok) {
        return {
          success: false,
          latencyMs,
          error: `${config.providerName} returned HTTP ${res.status}: ${res.statusText}`,
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
    const config = resolveOpenWeightEndpoint();
    if (!config) {
      throw new Error(
        'Open-weight provider is not configured. Please set GROQ_API_KEY or OPENROUTER_API_KEY.'
      );
    }

    const modelIdentifier = request.modelId.replace(/^openweight\//, '');

    // Format messages
    const messages: any[] = [];
    if (request.systemInstruction) {
      messages.push({
        role: 'system',
        content: request.systemInstruction,
      });
    }

    for (const msg of request.messages) {
      const text = formatMessageWithAttachments(msg);
      if (text) {
        messages.push({
          role: msg.role === 'tool' ? 'tool' : msg.role,
          content: text,
        });
      }
    }

    const payload: any = {
      model: modelIdentifier,
      messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.maxTokens ?? 4096,
      stream: true,
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
    }

    onChunk({ type: 'start', model: modelIdentifier });

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `${config.providerName} API Error (HTTP ${response.status}): ${response.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}
      onChunk({ type: 'error', error: errorMsg });
      throw new Error(errorMsg);
    }

    let fullText = '';
    let usage: TokenUsage | undefined;
    let finishReason: string | undefined;
    const toolCallsMap: Record<number, { id: string; name: string; argsText: string }> = {};

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Response stream unavailable.');

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

            if (choice.finish_reason) finishReason = choice.finish_reason;

            const delta = choice.delta;
            if (!delta) continue;

            // Text stream
            if (delta.content) {
              fullText += delta.content;
              onChunk({ type: 'text', text: delta.content });
            }

            // Reasoning content (e.g. DeepSeek R1)
            if (delta.reasoning_content) {
              onChunk({ type: 'thought', thought: delta.reasoning_content });
            }

            // Tool calls
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
                if (tc.function?.name) toolCallsMap[index].name = tc.function.name;
                if (tc.function?.arguments) toolCallsMap[index].argsText += tc.function.arguments;
              }
            }
          } catch {
            // Partial JSON ignored
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Execute tool calls
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
