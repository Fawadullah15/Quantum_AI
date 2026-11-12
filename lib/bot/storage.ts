/**
 * QuantumBot Local Persistence & Storage Layer
 * Manages multi-turn conversation persistence, grouping by date, pinning, and cross-tab sync.
 */

import { BotMessage } from './types';

export interface StoredConversation {
  id: string;
  title: string;
  modelId: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: BotMessage[];
  systemPrompt?: string;
}

export interface ConversationGroup {
  label: string;
  conversations: StoredConversation[];
}

const STORAGE_KEY = 'quantumbot_conversations_v1';
const ACTIVE_CONV_KEY = 'quantumbot_active_id_v1';

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/**
 * Retrieve all saved conversations sorted by updatedAt descending.
 */
export function getStoredConversations(): StoredConversation[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: StoredConversation[] = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.updatedAt - a.updatedAt)
      : [];
  } catch (err) {
    console.error('[QuantumBot Storage] Failed to load conversations:', err);
    return [];
  }
}

/**
 * Retrieve a single conversation by ID.
 */
export function getStoredConversation(id: string): StoredConversation | null {
  const all = getStoredConversations();
  return all.find((c) => c.id === id) || null;
}

/**
 * Save or update a conversation. Dispatches an update event for reactive synchronization.
 */
export function saveConversation(conv: StoredConversation): void {
  if (!isBrowser()) return;
  try {
    const all = getStoredConversations();
    const index = all.findIndex((c) => c.id === conv.id);

    const existing = index >= 0 ? all[index] : null;
    const rawTitle = conv.title?.trim();
    const resolvedTitle =
      rawTitle && rawTitle !== 'New Conversation'
        ? rawTitle
        : conv.messages.length > 0
        ? generateDefaultTitle(
            conv.messages[0].content ||
              (conv.messages[0].attachments?.[0]?.name
                ? `Analysis: ${conv.messages[0].attachments[0].name}`
                : '')
          )
        : 'New Conversation';

    const updatedConv: StoredConversation = {
      ...conv,
      createdAt: existing?.createdAt || conv.createdAt || Date.now(),
      updatedAt: Date.now(),
      title: resolvedTitle,
    };

    if (index >= 0) {
      all[index] = updatedConv;
    } else {
      all.unshift(updatedConv);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem(ACTIVE_CONV_KEY, updatedConv.id);

    // Notify other components & tabs
    window.dispatchEvent(
      new CustomEvent('quantumbot:sync', { detail: { conversationId: updatedConv.id } })
    );
  } catch (err) {
    console.error('[QuantumBot Storage] Failed to save conversation:', err);
  }
}

/**
 * Delete a conversation by ID.
 */
export function deleteStoredConversation(id: string): void {
  if (!isBrowser()) return;
  try {
    const all = getStoredConversations().filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    const active = localStorage.getItem(ACTIVE_CONV_KEY);
    if (active === id) {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }

    window.dispatchEvent(
      new CustomEvent('quantumbot:sync', { detail: { deletedId: id } })
    );
  } catch (err) {
    console.error('[QuantumBot Storage] Failed to delete conversation:', err);
  }
}

/**
 * Toggle pinned status for a conversation.
 */
export function togglePinConversation(id: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    saveConversation({
      ...conv,
      pinned: !conv.pinned,
    });
  }
}

/**
 * Rename a conversation.
 */
export function renameStoredConversation(id: string, newTitle: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    saveConversation({
      ...conv,
      title: newTitle.trim() || 'Untitled Conversation',
    });
  }
}

/**
 * Get or set the active conversation ID.
 */
export function getActiveConversationId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

export function setActiveConversationId(id: string): void {
  if (!isBrowser()) return;
  localStorage.setItem(ACTIVE_CONV_KEY, id);
  window.dispatchEvent(
    new CustomEvent('quantumbot:sync', { detail: { activeId: id } })
  );
}

/**
 * Clear all conversations from local storage.
 */
export function clearAllStoredConversations(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ACTIVE_CONV_KEY);
  window.dispatchEvent(new CustomEvent('quantumbot:sync', { detail: { cleared: true } }));
}

/**
 * Generate a smart concise title from the user's initial prompt.
 */
function generateDefaultTitle(firstMessageContent: string): string {
  const clean = firstMessageContent
    .replace(/[#*`_~]/g, '')
    .trim()
    .split('\n')[0];
  if (!clean) return 'New Conversation';
  return clean.length > 36 ? `${clean.slice(0, 36)}...` : clean;
}

/**
 * Group conversations chronologically (Today, Yesterday, Previous 7 Days, Older).
 */
export function groupConversationsByDate(
  conversations: StoredConversation[]
): ConversationGroup[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfLast7Days = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const today: StoredConversation[] = [];
  const yesterday: StoredConversation[] = [];
  const last7Days: StoredConversation[] = [];
  const older: StoredConversation[] = [];

  for (const conv of conversations) {
    const time = conv.updatedAt || conv.createdAt;
    if (time >= startOfToday) {
      today.push(conv);
    } else if (time >= startOfYesterday) {
      yesterday.push(conv);
    } else if (time >= startOfLast7Days) {
      last7Days.push(conv);
    } else {
      older.push(conv);
    }
  }

  const groups: ConversationGroup[] = [];
  if (today.length > 0) groups.push({ label: 'Today', conversations: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', conversations: yesterday });
  if (last7Days.length > 0) groups.push({ label: 'Previous 7 Days', conversations: last7Days });
  if (older.length > 0) groups.push({ label: 'Older', conversations: older });

  return groups;
}
