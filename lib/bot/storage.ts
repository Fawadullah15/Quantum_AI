/**
 * QuantumBot Client + Server Persistence & Storage Layer
 * Manages multi-turn conversation persistence, smart auto-titling,
 * chronological grouping, pinning, archiving, restoration, and server sync.
 */

import { BotMessage, ServerConversation } from './types';
import { generateSmartConversationTitle } from './title-generator';

export interface StoredConversation {
  id: string;
  title: string;
  modelId: string;
  pinned?: boolean;
  archived?: boolean;
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
      ? parsed.sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
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
 * Replace local cache cleanly with authoritative server conversations for the active identity.
 */
export function replaceAllStoredConversations(convs: ServerConversation[]): void {
  if (!isBrowser()) return;
  try {
    const mapped: StoredConversation[] = convs.map((c) => ({
      id: c.id,
      title: c.title,
      modelId: c.modelId,
      pinned: Boolean(c.pinned),
      archived: Boolean(c.archived),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      messages: c.messages || [],
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));

    const active = localStorage.getItem(ACTIVE_CONV_KEY);
    if (active && mapped.length > 0 && !mapped.some((c) => c.id === active)) {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }

    window.dispatchEvent(new CustomEvent('quantumbot:sync', { detail: { refreshed: true } }));
  } catch (err) {
    console.error('[QuantumBot Storage] Failed to replace conversations:', err);
  }
}

/**
 * Save or update a conversation locally and emit reactive sync event.
 */
export function saveConversation(conv: StoredConversation): StoredConversation {
  if (!isBrowser()) return conv;
  try {
    const all = getStoredConversations();
    const index = all.findIndex((c) => c.id === conv.id);
    const existing = index >= 0 ? all[index] : null;

    const rawTitle = conv.title?.trim();
    const resolvedTitle =
      conv.messages.length === 0
        ? rawTitle && rawTitle !== 'New Conversation' && existing?.messages.length === 0
          ? rawTitle
          : 'New Conversation'
        : rawTitle && rawTitle !== 'New Conversation'
          ? rawTitle
          : existing?.title && existing.title !== 'New Conversation'
            ? existing.title
            : generateSmartConversationTitle(conv.messages);

    const updatedConv: StoredConversation = {
      ...conv,
      pinned: conv.pinned !== undefined ? conv.pinned : existing?.pinned,
      archived: conv.archived !== undefined ? conv.archived : existing?.archived,
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

    window.dispatchEvent(
      new CustomEvent('quantumbot:sync', { detail: { conversationId: updatedConv.id } })
    );
    return updatedConv;
  } catch (err) {
    console.error('[QuantumBot Storage] Failed to save conversation:', err);
    return conv;
  }
}

/**
 * Delete a conversation by ID locally and on backend.
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
  void deleteConversationOnServer(id);
}

/**
 * Toggle pinned status for a conversation locally and on backend.
 */
export function togglePinConversation(id: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    const nextPinned = !conv.pinned;
    saveConversation({
      ...conv,
      pinned: nextPinned,
    });
    void patchConversationOnServer(id, { pinned: nextPinned });
  }
}

/**
 * Archive or restore a conversation locally and on backend.
 */
export function archiveStoredConversation(id: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    saveConversation({
      ...conv,
      archived: true,
      pinned: false,
    });
    void patchConversationOnServer(id, { archived: true, pinned: false });
  }
}

export function restoreStoredConversation(id: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    saveConversation({
      ...conv,
      archived: false,
    });
    void patchConversationOnServer(id, { archived: false });
  }
}

/**
 * Rename a conversation locally and on backend.
 */
export function renameStoredConversation(id: string, newTitle: string): void {
  const conv = getStoredConversation(id);
  if (conv) {
    const clean = newTitle.trim() || 'Untitled Conversation';
    saveConversation({
      ...conv,
      title: clean,
    });
    void patchConversationOnServer(id, { title: clean });
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

// ─── Server Persistence Helpers ─────────────────────────────────────────────

export async function fetchServerConversations(): Promise<ServerConversation[] | null> {
  try {
    const res = await fetch('/api/bot/conversations?archived=all', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.conversations) ? data.conversations : [];
  } catch {
    return null;
  }
}

export async function fetchSingleServerConversation(id: string): Promise<ServerConversation | null> {
  try {
    const res = await fetch(`/api/bot/conversations/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.conversation || null;
  } catch {
    return null;
  }
}

export async function syncConversationToServer(conv: StoredConversation): Promise<void> {
  try {
    await fetch('/api/bot/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: conv.id,
        title: conv.title,
        modelId: conv.modelId,
        pinned: Boolean(conv.pinned),
        archived: Boolean(conv.archived),
        messages: conv.messages,
      }),
    });
  } catch {
    // Non-blocking best-effort sync
  }
}

export async function patchConversationOnServer(
  id: string,
  patch: { title?: string; pinned?: boolean; archived?: boolean; modelId?: string }
): Promise<void> {
  try {
    await fetch(`/api/bot/conversations/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
  } catch {
    // Non-blocking sync
  }
}

export async function deleteConversationOnServer(id: string): Promise<void> {
  try {
    await fetch(`/api/bot/conversations/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch {
    // Non-blocking sync
  }
}

export async function clearAllServerConversations(): Promise<void> {
  try {
    await fetch('/api/bot/conversations', { method: 'DELETE' });
  } catch {
    // Non-blocking sync
  }
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
