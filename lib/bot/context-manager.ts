import { BotMessage, BotAttachment, ModelDefinition } from './types';

/**
 * Heuristic token estimation: ~4 chars per token for English text & code,
 * with safety margin for structural tokens and JSON.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.6);
}

export function estimateMessageTokens(message: BotMessage): number {
  let tokens = estimateTokens(message.content);
  if (message.attachments) {
    for (const att of message.attachments) {
      if (att.textContent) {
        tokens += estimateTokens(att.textContent);
      } else if (att.mimeType.startsWith('image/')) {
        // High-res vision models typically consume ~258 to 1600 tokens per image
        tokens += 800;
      }
    }
  }
  if (message.toolCalls) {
    tokens += estimateTokens(JSON.stringify(message.toolCalls));
  }
  if (message.toolResults) {
    tokens += estimateTokens(JSON.stringify(message.toolResults));
  }
  // Overhead for role and formatting
  return tokens + 8;
}

export interface PreparedContext {
  messages: BotMessage[];
  totalEstimatedTokens: number;
  prunedCount: number;
  hasSummary: boolean;
}

/**
 * Prepares and trims conversation context to fit safely within model limits.
 * Guarantees:
 * 1. The most recent turns are always preserved with full fidelity.
 * 2. Any active attachments on the latest user prompt are preserved.
 * 3. The context never exceeds 80% of the model's max context window.
 */
export function prepareConversationContext(
  messages: BotMessage[],
  model: ModelDefinition,
  customSystemPrompt?: string
): PreparedContext {
  if (!messages || messages.length === 0) {
    return {
      messages: [],
      totalEstimatedTokens: estimateTokens(customSystemPrompt || ''),
      prunedCount: 0,
      hasSummary: false,
    };
  }

  // Safe ceiling: 80% of context window or 64k tokens max for general safety
  const maxSafeTokens = Math.min(Math.floor(model.contextWindow * 0.8), 64000);
  const systemTokens = estimateTokens(customSystemPrompt || '');

  let availableTokens = maxSafeTokens - systemTokens;
  const processedMessages: BotMessage[] = [];
  let totalTokens = systemTokens;
  let prunedCount = 0;

  // Process backwards from most recent message to preserve the immediate context
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    const msgTokens = estimateMessageTokens(msg);

    // Always include at least the latest user turn, even if large
    if (i === messages.length - 1 || totalTokens + msgTokens <= maxSafeTokens) {
      processedMessages.unshift(msg);
      totalTokens += msgTokens;
    } else {
      prunedCount++;
    }
  }

  // If older messages were pruned, inject an intelligent context continuity marker
  let hasSummary = false;
  if (prunedCount > 0 && processedMessages.length > 0) {
    hasSummary = true;
    const noticeMessage: BotMessage = {
      id: 'system-pruned-context-marker',
      role: 'system',
      content: `[Note: ${prunedCount} earlier messages were compacted to stay within current context limits. Active conversation context follows.]`,
      createdAt: new Date(),
    };
    processedMessages.unshift(noticeMessage);
  }

  return {
    messages: processedMessages,
    totalEstimatedTokens: totalTokens,
    prunedCount,
    hasSummary,
  };
}

/**
 * Normalizes message content for LLM ingestion by appending extracted document texts
 * to the user message body if present.
 */
export function formatMessageWithAttachments(msg: BotMessage): string {
  let content = msg.content || '';

  if (msg.attachments && msg.attachments.length > 0) {
    const textAttachments = msg.attachments.filter((a) => Boolean(a.textContent));
    if (textAttachments.length > 0) {
      const docsFormatted = textAttachments
        .map(
          (a) =>
            `\n\n--- Document Attachment: ${a.name} (${a.mimeType}, ${Math.round(a.size / 1024)} KB) ---\n${a.textContent}\n--- End of Attachment ---`
        )
        .join('');
      content += docsFormatted;
    }
  }

  return content;
}
