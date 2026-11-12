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

export interface OpenWeightEndpointConfig {
  baseUrl: string;
  apiKey: string;
  providerName: string;
}

export function resolveOpenWeightEndpoint(): OpenWeightEndpointConfig | null {
  if (process.env.GROQ_API_KEY) {
    return {
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKey: process.env.GROQ_API_KEY,
      providerName: 'Groq',
    };
  }

  if (process.env.OPENROUTER_API_KEY) {
    return {
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      providerName: 'OpenRouter',
    };
  }

  if (process.env.TOGETHER_API_KEY) {
    return {
      baseUrl: 'https://api.together.xyz/v1',
      apiKey: process.env.TOGETHER_API_KEY,
      providerName: 'Together AI',
    };
  }

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

    const formattedTools =
      request.tools && request.tools.length > 0
        ? request.tools.map((t) => ({
            type: 'function',
            function: {
              name: t.declaration.name,
              description: t.declaration.description,
              parameters: toProviderParametersSchema(t.declaration.parameters),
            },
          }))
        : undefined;

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
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4096,
        stream: true,
      };

      if (formattedTools) {
        payload.tools = formattedTools;
      }

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

      let roundText = '';
      let roundUsage: TokenUsage | undefined;
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
                roundUsage = {
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

              if (delta.content) {
                roundText += delta.content;
                fullText += delta.content;
                onChunk({ type: 'text', text: delta.content });
              }

              if (delta.reasoning_content) {
                onChunk({ type: 'thought', thought: delta.reasoning_content });
              }

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

      if (roundUsage) {
        totalUsage = {
          promptTokens: (totalUsage?.promptTokens || 0) + roundUsage.promptTokens,
          completionTokens: (totalUsage?.completionTokens || 0) + roundUsage.completionTokens,
          totalTokens: (totalUsage?.totalTokens || 0) + roundUsage.totalTokens,
        };
      }

      const pendingItems = Object.values(toolCallsMap).filter((item) => Boolean(item.name));
      if (pendingItems.length === 0) {
        break;
      }

      const roundAssistantToolCalls: any[] = [];
      const roundToolMessages: any[] = [];
      let requiresConfirmationPause = false;

      for (const item of pendingItems) {
        let parsedArgs: Record<string, any> = {};
        try {
          parsedArgs = JSON.parse(item.argsText || '{}');
        } catch {
          parsedArgs = { raw: item.argsText };
        }

        const toolCall: BotToolCall = {
          id: item.id,
          name: item.name,
          arguments: parsedArgs,
          status: 'running',
        };
        allToolCalls.push(toolCall);
        onChunk({ type: 'tool_call', toolCall });

        roundAssistantToolCalls.push({
          id: item.id,
          type: 'function',
          function: {
            name: item.name,
            arguments: item.argsText || '{}',
          },
        });

        const outcome = await executeToolCall(item.name, parsedArgs, toolContext);

        const toolResultObj: BotToolResult = {
          toolCallId: item.id,
          toolName: item.name,
          result: outcome.result,
          isError: outcome.isError,
          status: outcome.status,
          durationMs: outcome.durationMs,
          confirmationRequired: outcome.confirmationRequired,
          actionPreview: outcome.actionPreview
            ? { ...outcome.actionPreview, toolCallId: item.id }
            : undefined,
        };
        allToolResults.push(toolResultObj);
        onChunk({ type: 'tool_result', toolResult: toolResultObj });

        if (outcome.confirmationRequired) {
          requiresConfirmationPause = true;
        }

        roundToolMessages.push({
          role: 'tool',
          tool_call_id: item.id,
          content: JSON.stringify(outcome.result),
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

      messages.push({
        role: 'assistant',
        content: roundText || null,
        tool_calls: roundAssistantToolCalls,
      });
      messages.push(...roundToolMessages);

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
