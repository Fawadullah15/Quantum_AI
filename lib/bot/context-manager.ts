import { BotMessage, BotAttachment, ModelDefinition } from './types';

/**
 * Heuristic token estimation: ~3.6 chars per token for English text & code,
 * with safety margin for structural tokens, spreadsheets, and multimodal payloads.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.6);
}

export function estimateMessageTokens(message: BotMessage): number {
  let tokens = estimateTokens(message.content);
  if (message.attachments) {
    for (const att of message.attachments) {
      if (att.status === 'expired' || att.status === 'error') {
        tokens += 20;
        continue;
      }
      if (att.textContent) {
        tokens += estimateTokens(att.textContent);
      }
      if (att.mimeType.startsWith('image/')) {
        // Vision models typically consume ~258 to 1600 tokens per image
        tokens += 900;
      } else if (att.mimeType === 'application/pdf' && (att.base64 || att.geminiFileUri)) {
        // Native PDF multimodal page rendering allowance
        const pages = att.extractedSummary?.pageCount || 1;
        tokens += Math.min(pages * 300, 12000);
      }
    }
  }
  if (message.toolCalls) {
    tokens += estimateTokens(JSON.stringify(message.toolCalls));
  }
  if (message.toolResults) {
    tokens += estimateTokens(JSON.stringify(message.toolResults));
  }
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
 * 2. Multi-turn document & spreadsheet analyses stay within high-context frontier budgets (up to 180k tokens).
 * 3. Older turns are pruned gracefully if the context window nears 75% capacity.
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

  // Safe ceiling: 75% of model context window or 180k tokens max
  const maxSafeTokens = Math.min(Math.floor(model.contextWindow * 0.75), 180000);
  const systemTokens = estimateTokens(customSystemPrompt || '');

  const processedMessages: BotMessage[] = [];
  let totalTokens = systemTokens;
  let prunedCount = 0;

  // Process backwards from most recent message to preserve immediate & multi-document context
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

function buildAttachmentDescriptor(att: BotAttachment, index: number): string {
  const details: string[] = [];
  const sizeKb = Math.max(1, Math.round(att.size / 1024));
  details.push(`${sizeKb} KB`);
  if (att.extractedSummary?.language) details.push(att.extractedSummary.language);
  if (att.extractedSummary?.pageCount) details.push(`${att.extractedSummary.pageCount} page${att.extractedSummary.pageCount > 1 ? 's' : ''}`);
  if (att.extractedSummary?.sheetNames?.length) {
    details.push(`Sheets: ${att.extractedSummary.sheetNames.join(', ')}`);
  }
  if (att.extractedSummary?.lineCount) details.push(`${att.extractedSummary.lineCount} lines`);
  if (att.extractedSummary?.imageDimensions) {
    details.push(`${att.extractedSummary.imageDimensions.width}×${att.extractedSummary.imageDimensions.height}px`);
  }
  return `Attachment ${index + 1}: ${att.name} (${att.mimeType}, ${details.join(' · ')})`;
}

/**
 * Normalizes message content for LLM ingestion by appending extracted document/spreadsheet/code text
 * cleanly, while respecting expired attachments and skipping redundant PDF dumps when native PDF binary is attached.
 */
export function formatMessageWithAttachments(
  msg: BotMessage,
  options: { skipPdfTextWhenNative?: boolean } = {}
): string {
  let content = msg.content || '';

  if (msg.attachments && msg.attachments.length > 0) {
    const blocks: string[] = [];

    msg.attachments.forEach((att, idx) => {
      if (att.status === 'expired') {
        blocks.push(
          `\n\n--- [Expired Attachment ${idx + 1}: ${att.name}] ---\nThis file has expired under QuantumBot retention policy and is no longer accessible.\n--- End of Attachment ---`
        );
        return;
      }

      if (att.status === 'error') {
        blocks.push(
          `\n\n--- [Unavailable Attachment ${idx + 1}: ${att.name}] ---\nAttachment failed validation or processing (${att.errorMessage || 'unavailable'}).\n--- End of Attachment ---`
        );
        return;
      }

      const header = buildAttachmentDescriptor(att, idx);

      // When native PDF vision payload is also included, keep extracted text concise if huge,
      // or include header + note so the model sees both exact structure and visual layout.
      if (
        options.skipPdfTextWhenNative &&
        att.mimeType === 'application/pdf' &&
        (att.base64 || att.geminiFileUri)
      ) {
        const note = att.extractedSummary?.note ? `\nNote: ${att.extractedSummary.note}` : '';
        const snippet =
          att.textContent && !att.extractedSummary?.isScannedOrImageOnly
            ? `\n${att.textContent.slice(0, 24000)}`
            : '';
        blocks.push(`\n\n--- ${header} [Delivered with native PDF visual understanding] ---${note}${snippet}\n--- End of Attachment ${idx + 1} ---`);
        return;
      }

      if (att.textContent) {
        const langNote = att.extractedSummary?.note ? ` (${att.extractedSummary.note})` : '';
        blocks.push(
          `\n\n--- ${header}${langNote} ---\n${att.textContent}\n--- End of Attachment ${idx + 1} ---`
        );
      } else if (att.mimeType.startsWith('image/')) {
        blocks.push(`\n\n[${header} — Attached as visual image input]`);
      }
    });

    content += blocks.join('');
  }

  return content;
}
