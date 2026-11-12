import {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  BotMessage,
  BotAttachment,
  ModelDefinition,
} from './types';
import { resolveActiveModel, getRegisteredModels } from './models';
import { getProviderAdapter } from './providers';
import { prepareConversationContext } from './context-manager';
import { buildSystemInstruction } from './prompt';
import { STANDARD_BOT_TOOLS } from './tools';
import { getBotFileForOwner } from './file-store';

export class AttachmentResolutionError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'AttachmentResolutionError';
    this.statusCode = statusCode;
  }
}

/**
 * Resolves private server-side fileIds with strict ownership & expiration enforcement,
 * hydrates multimodal/document payloads for the selected provider, and enforces model vision gating.
 */
export async function resolveAndValidateChatMessages(
  messages: BotMessage[],
  model: ModelDefinition,
  ownerId?: string
): Promise<BotMessage[]> {
  const supportsVision = model.capabilities.includes('vision');
  const supportsNativePdf = model.provider === 'gemini' || model.provider === 'anthropic';
  const visionModelNames = getRegisteredModels()
    .filter((m) => m.isAvailable && m.capabilities.includes('vision'))
    .map((m) => m.name)
    .slice(0, 3)
    .join(', ');

  const resolvedMessages: BotMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const srcMsg = messages[i];
    const isLatestMessage = i === messages.length - 1;

    if (!srcMsg.attachments || srcMsg.attachments.length === 0) {
      resolvedMessages.push({ ...srcMsg });
      continue;
    }

    const resolvedAttachments: BotAttachment[] = [];

    for (const srcAtt of srcMsg.attachments) {
      const att: BotAttachment = { ...srcAtt };

      // 1. Check client-supplied expiration markers first
      const clientExpired =
        att.status === 'expired' ||
        (att.expiresAt ? Date.now() > new Date(att.expiresAt).getTime() : false);

      if (clientExpired && !att.fileId) {
        if (isLatestMessage) {
          throw new AttachmentResolutionError(
            410,
            `Attachment "${att.name}" has expired under retention policy and cannot be analyzed.`
          );
        }
        resolvedAttachments.push({
          ...att,
          status: 'expired',
          base64: undefined,
          textContent: undefined,
          geminiFileUri: undefined,
        });
        continue;
      }

      // 2. If persisted on private server storage via fileId, resolve & verify ownership
      if (att.fileId) {
        const lookup = await getBotFileForOwner(att.fileId, ownerId, { includeBuffer: true });

        if (lookup.status === 'forbidden') {
          throw new AttachmentResolutionError(
            403,
            `Access denied: you do not have permission to access attached file "${att.name}".`
          );
        }

        if (lookup.status === 'expired') {
          if (isLatestMessage) {
            throw new AttachmentResolutionError(
              410,
              `Attached file "${att.name}" has expired under QuantumBot retention policy. Please remove it or re-upload.`
            );
          }
          resolvedAttachments.push({
            ...att,
            status: 'expired',
            base64: undefined,
            textContent: undefined,
            geminiFileUri: undefined,
          });
          continue;
        }

        if (lookup.status === 'not_found') {
          if (isLatestMessage) {
            throw new AttachmentResolutionError(
              404,
              `Attached file "${att.name}" could not be found or was deleted.`
            );
          }
          resolvedAttachments.push({
            ...att,
            status: 'expired',
            errorMessage: 'File no longer exists on server.',
            base64: undefined,
            textContent: undefined,
            geminiFileUri: undefined,
          });
          continue;
        }

        const { record, buffer } = lookup;
        att.name = record.name;
        att.mimeType = record.mimeType;
        att.kind = record.kind;
        att.extension = record.extension;
        att.size = record.size;
        att.extractedSummary = record.extractedSummary;
        att.expiresAt = record.expiresAt;
        att.status = 'ready';
        att.textContent = record.textContent;

        // Enforce vision capability strictly before hydrating image bytes
        if (record.kind === 'image' || record.mimeType.startsWith('image/')) {
          if (!supportsVision) {
            throw new AttachmentResolutionError(
              400,
              `Model "${model.name}" does not support image understanding. Please switch to a vision-capable model (${visionModelNames || 'Gemini 3.5 Flash'}) or remove "${record.name}".`
            );
          }
          att.base64 = buffer?.toString('base64');
        } else if (record.mimeType === 'application/pdf' && supportsNativePdf) {
          const cachedGeminiValid =
            model.provider === 'gemini' &&
            record.geminiFileUri &&
            record.geminiFileExpiresAt &&
            new Date(record.geminiFileExpiresAt).getTime() > Date.now() + 5 * 60 * 1000;

          if (cachedGeminiValid) {
            att.geminiFileUri = record.geminiFileUri;
          } else if (buffer) {
            att.base64 = buffer.toString('base64');
          }
        } else {
          att.base64 = undefined;
        }
      } else {
        // Inline attachment without fileId (e.g., direct programmatic call)
        if ((att.mimeType.startsWith('image/') || att.kind === 'image') && att.status !== 'expired') {
          if (!supportsVision) {
            throw new AttachmentResolutionError(
              400,
              `Model "${model.name}" does not support image understanding. Please switch to a vision-capable model (${visionModelNames || 'Gemini 3.5 Flash'}) or remove "${att.name}".`
            );
          }
        }
      }

      resolvedAttachments.push(att);
    }

    resolvedMessages.push({
      ...srcMsg,
      attachments: resolvedAttachments,
    });
  }

  return resolvedMessages;
}

export interface ExecuteChatOptions {
  modelId?: string;
  messages: BotMessage[];
  validatedMessages?: BotMessage[];
  customSystemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  conversationId?: string;
  ownerId?: string;
  onChunk: (chunk: StreamChunk) => void;
  signal?: AbortSignal;
}

/**
 * Universal QuantumBot Chat Execution Pipeline
 * Executes streaming generation with attachment security/vision gating, long-context management, tool loop, and retry resilience.
 */
export async function executeQuantumBotChat(options: ExecuteChatOptions): Promise<ChatResponse> {
  const {
    modelId,
    messages,
    validatedMessages,
    customSystemPrompt,
    temperature = 0.7,
    maxTokens,
    enableTools = true,
    conversationId,
    ownerId,
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

  // 3. Resolve private attachments, enforce ownership, retention expiration, and vision capability
  let resolvedMessages: BotMessage[];
  try {
    resolvedMessages =
      validatedMessages || (await resolveAndValidateChatMessages(messages, model, ownerId));
  } catch (err: any) {
    const errMsg = err?.message || 'Attachment validation failed.';
    onChunk({ type: 'error', error: errMsg });
    throw err;
  }

  // 4. Build system instruction with master persona
  const fullSystemInstruction = buildSystemInstruction(customSystemPrompt);

  // 5. Prepare and trim multi-turn context
  const preparedContext = prepareConversationContext(
    resolvedMessages,
    model,
    fullSystemInstruction
  );

  if (preparedContext.hasSummary) {
    onChunk({
      type: 'thought',
      thought: `Optimized conversation context: retained ${preparedContext.messages.length} recent messages (${preparedContext.prunedCount} earlier turns compacted).`,
    });
  }

  // 6. Filter tools based on model capabilities
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
    ownerId,
  };

  // 7. Execute streaming generation with retry backoff for transient errors
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        onChunk({
          type: 'thought',
          thought: `Retrying request (attempt ${attempt + 1}/${maxRetries + 1})...`,
        });
        await new Promise((r) => setTimeout(r, attempt === 1 ? 1200 : 2500));
      }

      const response = await adapter.streamChat(chatRequest, onChunk, signal);
      return response;
    } catch (err: any) {
      lastError = err;

      if (signal?.aborted || err?.name === 'AbortError') {
        throw new Error('Generation cancelled by user.');
      }

      const errStr = String(err?.message || '').toLowerCase();
      const isTransient =
        errStr.includes('429') ||
        errStr.includes('rate limit') ||
        errStr.includes('503') ||
        errStr.includes('high demand') ||
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
