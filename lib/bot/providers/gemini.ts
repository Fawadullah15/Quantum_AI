import {
  ProviderAdapter,
  ChatRequest,
  ChatResponse,
  StreamChunk,
  BotMessage,
  BotTool,
  TokenUsage,
} from '../types';
import { executeToolCall } from '../tools';
import { formatMessageWithAttachments } from '../context-manager';

export function getGeminiApiKey(): string | null {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    null
  );
}

export class GeminiProviderAdapter implements ProviderAdapter {
  id = 'gemini' as const;
  name = 'Google Gemini';

  isConfigured(): boolean {
    return Boolean(getGeminiApiKey());
  }

  async verifyConnection(): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
    const key = getGeminiApiKey();
    if (!key) {
      return { success: false, error: 'GEMINI_API_KEY is not configured in environment.' };
    }

    const t0 = Date.now();
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash?key=${key}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(8000),
        }
      );

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
    const key = getGeminiApiKey();
    if (!key) {
      throw new Error(
        'Gemini Provider is not configured. Please set GEMINI_API_KEY in your server environment.'
      );
    }

    // Map model ID to supported Gemini identifier
    const modelIdentifier = request.modelId.replace(/^gemini\//, '');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelIdentifier}:streamGenerateContent?alt=sse&key=${key}`;

    // Format messages for Gemini API
    const contents: any[] = [];
    for (const msg of request.messages) {
      if (msg.role === 'system') continue; // Handled via systemInstruction

      const parts: any[] = [];
      const textContent = formatMessageWithAttachments(msg);
      if (textContent) {
        parts.push({ text: textContent });
      }

      // Add image attachments as inlineData if available
      if (msg.attachments) {
        for (const att of msg.attachments) {
          if (att.mimeType.startsWith('image/') && att.base64) {
            parts.push({
              inlineData: {
                mimeType: att.mimeType,
                data: att.base64.replace(/^data:[^;]+;base64,/, ''),
              },
            });
          }
        }
      }

      if (parts.length > 0) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Format tools for Gemini API
    const geminiTools: any[] = [];
    if (request.tools && request.tools.length > 0) {
      geminiTools.push({
        functionDeclarations: request.tools.map((t) => ({
          name: t.declaration.name,
          description: t.declaration.description,
          parameters: t.declaration.parameters,
        })),
      });
    }

    const payload: any = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4096,
      },
    };

    if (request.systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: request.systemInstruction }],
      };
    }

    if (geminiTools.length > 0) {
      payload.tools = geminiTools;
    }

    onChunk({ type: 'start', model: modelIdentifier });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = `Gemini API Error (HTTP ${response.status}): ${response.statusText}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error?.message) errorMsg = parsed.error.message;
      } catch {}
      onChunk({ type: 'error', error: errorMsg });
      throw new Error(errorMsg);
    }

    let fullText = '';
    let pendingToolCalls: any[] = [];
    let usage: TokenUsage | undefined;
    let finishReason: string | undefined;

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body stream is unavailable.');
    }

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
            const candidate = data.candidates?.[0];
            if (!candidate) continue;

            if (candidate.finishReason) {
              finishReason = candidate.finishReason;
            }

            if (data.usageMetadata) {
              usage = {
                promptTokens: data.usageMetadata.promptTokenCount || 0,
                completionTokens: data.usageMetadata.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata.totalTokenCount || 0,
              };
            }

            const parts = candidate.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                // Text stream
                if (part.text) {
                  fullText += part.text;
                  onChunk({ type: 'text', text: part.text });
                }

                // Tool / Function Call
                if (part.functionCall) {
                  const call = {
                    id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    name: part.functionCall.name,
                    arguments: part.functionCall.args || {},
                  };
                  pendingToolCalls.push(call);
                  onChunk({ type: 'tool_call', toolCall: call });
                }
              }
            }
          } catch {
            // Incomplete JSON chunk in stream line; ignored
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // Execute tool calls if any were emitted
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
    let collectedText = '';
    return this.streamChat(
      request,
      (chunk) => {
        if (chunk.text) collectedText += chunk.text;
      },
      signal
    );
  }
}
