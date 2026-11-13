import {
  ChatRequest,
  ChatResponse,
  StreamChunk,
  BotMessage,
  BotAttachment,
  ModelDefinition,
  BotPermission,
  UserPreferences,
} from './types';
import { resolveActiveModel, getRegisteredModels } from './models';
import { getProviderAdapter } from './providers';
import { prepareConversationContext } from './context-manager';
import { buildSystemInstruction } from './prompt';
import { getAvailableToolsForContext } from './tools';
import { getBotFileForOwner } from './file-store';
import { retrieveContextualCompanyKnowledge } from './knowledge/retriever';
import { ensureAdminConfigLoaded } from './admin-config';

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
  userPreferences?: UserPreferences;
  temperature?: number;
  maxTokens?: number;
  enableTools?: boolean;
  enableWebSearch?: boolean;
  permissions?: BotPermission[];
  approvedActionKeys?: string[];
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
    userPreferences,
    temperature = 0.7,
    maxTokens,
    enableTools = true,
    enableWebSearch = false,
    permissions,
    approvedActionKeys,
    conversationId,
    ownerId,
    onChunk,
    signal,
  } = options;

  // 0. Ensure dynamic Admin Panel model/provider config & limits are hydrated
  await ensureAdminConfigLoaded().catch(() => {});

  // 1. Resolve and verify active model
  const { model, isFallback, fallbackReason } = resolveActiveModel(modelId);

  if (isFallback && fallbackReason) {
    onChunk({
      type: 'thought',
      thought: `Using ${model.name} instead — continuing your request.`,
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

  // 4. Compute effective permissions and active tools first so system instructions reflect exact capabilities
  const effectivePermissions: BotPermission[] = permissions || [
    'public_read',
    'compute',
    'external_write',
    ...(enableWebSearch ? (['web_research'] as BotPermission[]) : []),
  ];

  const toolsToProvide =
    enableTools && model.capabilities.includes('tools')
      ? getAvailableToolsForContext({
          conversationId,
          ownerId,
          modelId: model.modelIdentifier,
          permissions: effectivePermissions,
          enableWebSearch,
          approvedActionKeys,
        })
      : [];

  // 5. Phase 6 Contextual Retrieval (only injects verified company context when relevant; general queries bypass RAG)
  const knowledgeContext = await retrieveContextualCompanyKnowledge(resolvedMessages).catch(() => null);

  // 6. Build master system instruction with Phase 6 identity, active capabilities, preferences & company context
  const fullSystemInstruction = buildSystemInstruction({
    customInstruction: customSystemPrompt,
    userPreferences,
    activeModel: model,
    enableWebSearch,
    availableToolNames: toolsToProvide.map((t) => t.declaration.name),
    companyContextBlock: knowledgeContext?.shouldInjectContext
      ? knowledgeContext.formattedContextBlock
      : undefined,
  });

  // 7. Prepare and trim multi-turn context
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

  const chatRequest: ChatRequest = {
    modelId: model.modelIdentifier,
    messages: preparedContext.messages,
    systemInstruction: fullSystemInstruction,
    temperature,
    maxTokens: maxTokens ?? model.maxOutputTokens,
    tools: toolsToProvide,
    conversationId,
    ownerId,
    permissions: effectivePermissions,
    enableWebSearch,
    approvedActionKeys,
  };

  // 7. Execute streaming generation with retry backoff + automatic same-provider quota fallback
  const maxRetries = 2;
  let lastError: any = null;
  let activeModel = model;
  let activeAdapter = adapter;
  let activeRequest = chatRequest;
  let hasEmittedResponseContent = false;
  let quotaFallbackAttempted = false;

  const trackedOnChunk = (chunk: StreamChunk) => {
    if (chunk.type === 'text' || chunk.type === 'tool_call') {
      hasEmittedResponseContent = true;
    }
    onChunk(chunk);
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        onChunk({
          type: 'thought',
          thought: `Retrying request (attempt ${attempt + 1}/${maxRetries + 1})...`,
        });
        await new Promise((r) => setTimeout(r, attempt === 1 ? 1200 : 2500));
      }

      const response = await activeAdapter.streamChat(activeRequest, trackedOnChunk, signal);
      return response;
    } catch (err: any) {
      lastError = err;

      if (signal?.aborted || err?.name === 'AbortError') {
        throw new Error('Generation cancelled by user.');
      }

      const errStr = `${err?.message || ''} ${err?.cause?.message || ''} ${err?.cause?.code || ''}`.toLowerCase();
      const isQuotaError =
        errStr.includes('quota') || errStr.includes('resource_exhausted') || errStr.includes('429');

      // If primary model hits quota/rate limit before producing output, fail over seamlessly
      // to an alternate lightweight model on the same configured provider (e.g. gemini-3.5-flash-lite).
      if (isQuotaError && !hasEmittedResponseContent && !quotaFallbackAttempted) {
        quotaFallbackAttempted = true;
        const providerAlternatives = getRegisteredModels().filter(
          (m) =>
            m.enabled !== false &&
            m.isAvailable &&
            m.provider === activeModel.provider &&
            m.id !== activeModel.id
        );
        const preferredAlt =
          providerAlternatives.find((m) => m.id === 'gemini-3.5-flash-lite') ||
          providerAlternatives.find((m) => !m.id.includes('argon')) ||
          providerAlternatives[0];

        if (preferredAlt) {
          onChunk({
            type: 'thought',
            thought: `Switching to ${preferredAlt.name} — continuing your request...`,
          });

          activeModel = preferredAlt;
          activeAdapter = getProviderAdapter(preferredAlt.provider);

          const fallbackTools =
            enableTools && preferredAlt.capabilities.includes('tools')
              ? getAvailableToolsForContext({
                  conversationId,
                  ownerId,
                  modelId: preferredAlt.modelIdentifier,
                  permissions: effectivePermissions,
                  enableWebSearch,
                  approvedActionKeys,
                })
              : [];

          const fallbackSystemInstruction = buildSystemInstruction({
            customInstruction: customSystemPrompt,
            userPreferences,
            activeModel: preferredAlt,
            enableWebSearch,
            availableToolNames: fallbackTools.map((t) => t.declaration.name),
            companyContextBlock: knowledgeContext?.shouldInjectContext
              ? knowledgeContext.formattedContextBlock
              : undefined,
          });

          const fallbackPrepared = prepareConversationContext(
            resolvedMessages,
            preferredAlt,
            fallbackSystemInstruction
          );

          activeRequest = {
            ...chatRequest,
            modelId: preferredAlt.modelIdentifier,
            messages: fallbackPrepared.messages,
            systemInstruction: fallbackSystemInstruction,
            maxTokens: maxTokens ?? preferredAlt.maxOutputTokens,
            tools: fallbackTools,
          };

          try {
            const fallbackResponse = await activeAdapter.streamChat(
              activeRequest,
              trackedOnChunk,
              signal
            );
            return fallbackResponse;
          } catch (fallbackErr: any) {
            lastError = fallbackErr;
          }
        }
      }

      const isTransient =
        !errStr.includes('exceeded your current quota') &&
        (errStr.includes('429') ||
          errStr.includes('rate limit') ||
          errStr.includes('503') ||
          errStr.includes('high demand') ||
          errStr.includes('500') ||
          errStr.includes('overloaded') ||
          errStr.includes('network') ||
          errStr.includes('fetch failed') ||
          errStr.includes('timeout') ||
          errStr.includes('econnreset') ||
          errStr.includes('etimedout'));

      if (!isTransient || attempt === maxRetries) {
        break;
      }
    }
  }

  // Build a clean user-facing error — never expose raw quota/API error strings
  const rawFinal = lastError?.message || 'Generation failed due to provider error.';
  const lowerFinal = rawFinal.toLowerCase();
  const isQuotaFinal =
    lowerFinal.includes('quota') ||
    lowerFinal.includes('resource_exhausted') ||
    lowerFinal.includes('rate limit') ||
    lowerFinal.includes('429');
  const finalMessage = isQuotaFinal
    ? 'All available AI models are currently at their usage limit. Please try again in a few minutes.'
    : rawFinal;

  // Only emit the error chunk if no response content was produced at all
  if (!hasEmittedResponseContent) {
    onChunk({ type: 'error', error: finalMessage });
  }
  throw new Error(finalMessage);
}
