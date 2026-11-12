import {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  BotMessage,
  ModelDefinition,
} from './types';
import { resolveActiveModel, getModelById } from './models';
import { getProviderAdapter } from './providers';
import { prepareConversationContext } from './context-manager';
import { buildSystemInstruction } from './prompt';
import { STANDARD_BOT_TOOLS } from './tools';

export interface ExecuteChatOptions {
  modelId?: string;
  messages: BotMessage[];
  customSystemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  conversationId?: string;
  onChunk: (chunk: StreamChunk) => void;
  signal?: AbortSignal;
}

/**
 * Universal QuantumBot Chat Execution Pipeline
 * Executes streaming or batch generation with long-context trimming, tool loop, and error resilience.
 */
export async function executeQuantumBotChat(options: ExecuteChatOptions): Promise<ChatResponse> {
  const {
    modelId,
    messages,
    customSystemPrompt,
    temperature = 0.7,
    maxTokens,
    enableTools = true,
    conversationId,
    onChunk,
    signal,
  } = options;

  // 1. Resolve and verify active model
  const { model, isFallback, fallbackReason } = resolveActiveModel(modelId);

  if (isFallback && fallbackReason) {
    onChunk({
      type: 'thought',
      thought: `System Notice: ${fallbackReason}`,
    });
  }

  // 2. Obtain provider adapter
  const adapter = getProviderAdapter(model.provider);
  if (!adapter.isConfigured()) {
    const errorMsg = `Provider "${adapter.name}" is not configured. Please set the appropriate API key in your server environment (e.g. GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY, or GROQ_API_KEY).`;
    onChunk({ type: 'error', error: errorMsg });
    throw new Error(errorMsg);
  }

  // 3. Build system instruction with master persona
  const fullSystemInstruction = buildSystemInstruction(customSystemPrompt);

  // 4. Prepare and trim multi-turn context
  const preparedContext = prepareConversationContext(
    messages,
    model,
    fullSystemInstruction
  );

  if (preparedContext.hasSummary) {
    onChunk({
      type: 'thought',
      thought: `Optimized conversation context: retained ${preparedContext.messages.length} recent messages (${preparedContext.prunedCount} earlier turns compacted).`,
    });
  }

  // 5. Filter tools based on model capabilities
  const toolsToProvide =
    enableTools && model.capabilities.includes('tools') ? STANDARD_BOT_TOOLS : [];

  const chatRequest: ChatRequest = {
    modelId: model.modelIdentifier,
    messages: preparedContext.messages,
    systemInstruction: fullSystemInstruction,
    temperature,
    maxTokens: maxTokens ?? model.maxOutputTokens,
    tools: toolsToProvide,
    conversationId,
  };

  // 6. Execute streaming generation with retry backoff for transient errors
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        onChunk({
          type: 'thought',
          thought: `Retrying request (attempt ${attempt + 1}/${maxRetries + 1})...`,
        });
        // Exponential backoff
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }

      const response = await adapter.streamChat(chatRequest, onChunk, signal);
      return response;
    } catch (err: any) {
      lastError = err;

      // AbortSignal triggered by client disconnect should stop immediately
      if (signal?.aborted || err?.name === 'AbortError') {
        throw new Error('Generation cancelled by user.');
      }

      // Only retry on transient rate limit (429) or temporary server errors (500, 503)
      const errStr = String(err?.message || '');
      const isTransient =
        errStr.includes('429') ||
        errStr.includes('rate limit') ||
        errStr.includes('503') ||
        errStr.includes('500') ||
        errStr.includes('overloaded') ||
        errStr.includes('network');

      if (!isTransient || attempt === maxRetries) {
        break;
      }
    }
  }

  const finalMessage = lastError?.message || 'Generation failed due to provider error.';
  onChunk({ type: 'error', error: finalMessage });
  throw new Error(finalMessage);
}
