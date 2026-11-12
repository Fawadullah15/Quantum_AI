import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import {
  BotAttachment,
  BotMessage,
  ResponseStyle,
  ServerConversation,
  UserPreferences,
} from './types';
import { generateSmartConversationTitle } from './title-generator';

const DEFAULT_STORE_DIR = path.join(process.cwd(), '.private_storage', 'bot_conversations');

export interface ConversationStoreOptions {
  storageDir?: string;
  skipDatabase?: boolean;
}

export class ConversationForbiddenError extends Error {
  statusCode = 403;
  constructor(message = 'Access denied: you do not own this conversation.') {
    super(message);
    this.name = 'ConversationForbiddenError';
  }
}

export class ConversationValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'ConversationValidationError';
  }
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  displayName: undefined,
  responseStyle: 'balanced',
  language: 'English',
  customInstructions: undefined,
  defaultModelId: undefined,
  defaultWebSearch: false,
  enterToSend: true,
};

const VALID_RESPONSE_STYLES = new Set<ResponseStyle>([
  'balanced',
  'concise',
  'detailed',
  'technical',
  'beginner_friendly',
]);

let mutationChain = Promise.resolve();
function enqueueWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = mutationChain.then(fn, fn);
  mutationChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function shouldUseDatabase(options?: ConversationStoreOptions): boolean {
  return !options?.skipDatabase && !options?.storageDir && Boolean(process.env.DATABASE_URL);
}

export function assertValidConversationId(rawId: string): string {
  const clean = (rawId || '').trim();
  if (!/^conv_[a-zA-Z0-9_-]{4,72}$/.test(clean)) {
    throw new ConversationValidationError('Invalid conversation identifier format.');
  }
  return clean;
}

function sanitizeStoredAttachments(attachments?: BotAttachment[]): BotAttachment[] | undefined {
  if (!Array.isArray(attachments) || attachments.length === 0) return undefined;
  return attachments.map((att) => ({
    id: String(att.id || att.fileId || ''),
    fileId: att.fileId ? String(att.fileId) : undefined,
    name: String(att.name || 'file'),
    mimeType: String(att.mimeType || 'application/octet-stream'),
    extension: att.extension ? String(att.extension) : undefined,
    size: typeof att.size === 'number' ? att.size : 0,
    kind: att.kind,
    status: att.status,
    url: att.url || (att.fileId ? `/api/bot/files/${att.fileId}` : undefined),
    textPreview: att.textPreview ? String(att.textPreview).slice(0, 500) : undefined,
    extractedSummary: att.extractedSummary,
    expiresAt: att.expiresAt,
    errorMessage: att.errorMessage,
  }));
}

export function compactMessagesForStorage(messages: BotMessage[]): {
  messages: BotMessage[];
  attachmentIds: string[];
} {
  const fileIds = new Set<string>();
  const compacted = (Array.isArray(messages) ? messages : []).map((msg) => {
    const cleanAtts = sanitizeStoredAttachments(msg.attachments);
    if (cleanAtts) {
      for (const att of cleanAtts) {
        if (att.fileId) fileIds.add(att.fileId);
      }
    }
    return {
      id: String(msg.id || `msg_${Date.now()}`),
      role: msg.role,
      content: String(msg.content || ''),
      attachments: cleanAtts,
      toolCalls: msg.toolCalls,
      toolResults: msg.toolResults,
      createdAt: msg.createdAt,
      model: msg.model,
    };
  });

  return {
    messages: compacted,
    attachmentIds: Array.from(fileIds),
  };
}

function getLocalConvPath(id: string, options?: ConversationStoreOptions): string {
  const dir = options?.storageDir || DEFAULT_STORE_DIR;
  return path.join(dir, 'chats', `${id}.json`);
}

function getLocalPrefsPath(ownerId: string, options?: ConversationStoreOptions): string {
  const dir = options?.storageDir || DEFAULT_STORE_DIR;
  const ownerHash = crypto.createHash('sha256').update(ownerId).digest('hex').slice(0, 32);
  return path.join(dir, 'prefs', `${ownerHash}.json`);
}

async function atomicWriteJson(filePath: string, payload: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(payload, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

async function readLocalConversation(
  id: string,
  options?: ConversationStoreOptions
): Promise<ServerConversation | null> {
  try {
    const raw = await fs.readFile(getLocalConvPath(id, options), 'utf8');
    return JSON.parse(raw) as ServerConversation;
  } catch {
    return null;
  }
}

function mapDbConversation(row: any): ServerConversation {
  let parsedMessages: BotMessage[] = [];
  let parsedAttachments: string[] = [];
  try {
    parsedMessages = JSON.parse(row.messagesJson || '[]');
  } catch {}
  try {
    parsedAttachments = JSON.parse(row.attachmentIdsJson || '[]');
  } catch {}

  return {
    id: row.id,
    ownerId: row.ownerId,
    title: row.title,
    modelId: row.modelId,
    pinned: Boolean(row.pinned),
    archived: Boolean(row.archived),
    messages: Array.isArray(parsedMessages) ? parsedMessages : [],
    attachmentIds: Array.isArray(parsedAttachments) ? parsedAttachments : [],
    createdAt: row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt || Date.now()),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.getTime() : Number(row.updatedAt || Date.now()),
  };
}

function getBotUserIdFromOwner(ownerId: string): string | null {
  return ownerId.startsWith('qbuser:') ? ownerId.slice('qbuser:'.length) : null;
}

/**
 * Verifies a conversation is either brand-new OR strictly owned by actorOwnerId.
 * Rejects any cross-user conversationId injection with HTTP 403 Forbidden.
 */
export async function assertConversationOwnership(
  rawId: string,
  actorOwnerId: string,
  options?: ConversationStoreOptions
): Promise<ServerConversation | null> {
  const id = assertValidConversationId(rawId);

  if (shouldUseDatabase(options)) {
    const row = await prisma.botConversation.findUnique({ where: { id } });
    if (!row) return null;
    if (row.ownerId !== actorOwnerId) {
      throw new ConversationForbiddenError();
    }
    return mapDbConversation(row);
  }

  const existing = await readLocalConversation(id, options);
  if (!existing) return null;
  if (existing.ownerId !== actorOwnerId) {
    throw new ConversationForbiddenError();
  }
  return existing;
}

export async function listConversationsForOwner(
  actorOwnerId: string,
  filters?: {
    archivedOnly?: boolean;
    includeArchived?: boolean;
    search?: string;
  },
  options?: ConversationStoreOptions
): Promise<ServerConversation[]> {
  if (!actorOwnerId) return [];

  let items: ServerConversation[] = [];

  if (shouldUseDatabase(options)) {
    const where: any = { ownerId: actorOwnerId };
    if (filters?.archivedOnly) {
      where.archived = true;
    } else if (!filters?.includeArchived) {
      where.archived = false;
    }
    const rows = await prisma.botConversation.findMany({
      where,
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
    });
    items = rows.map(mapDbConversation);
  } else {
    const chatsDir = path.join(options?.storageDir || DEFAULT_STORE_DIR, 'chats');
    try {
      const files = await fs.readdir(chatsDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const raw = await fs.readFile(path.join(chatsDir, file), 'utf8');
          const conv = JSON.parse(raw) as ServerConversation;
          if (conv.ownerId !== actorOwnerId) continue;
          if (filters?.archivedOnly && !conv.archived) continue;
          if (!filters?.archivedOnly && !filters?.includeArchived && conv.archived) continue;
          items.push(conv);
        } catch {}
      }
    } catch {
      return [];
    }
  }

  const q = filters?.search?.trim().toLowerCase();
  if (q) {
    items = items.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => (m.content || '').toLowerCase().includes(q))
    );
  }

  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt);
  });
}

export async function getConversationForOwner(
  rawId: string,
  actorOwnerId: string,
  options?: ConversationStoreOptions
): Promise<ServerConversation | null> {
  return assertConversationOwnership(rawId, actorOwnerId, options);
}

export async function upsertConversationForOwner(
  input: {
    id: string;
    title?: string;
    modelId: string;
    pinned?: boolean;
    archived?: boolean;
    messages: BotMessage[];
  },
  actorOwnerId: string,
  options?: ConversationStoreOptions
): Promise<ServerConversation> {
  const id = assertValidConversationId(input.id);

  return enqueueWrite(async () => {
    const existing = await assertConversationOwnership(id, actorOwnerId, options);
    const { messages, attachmentIds } = compactMessagesForStorage(input.messages);

    const requestedTitle = input.title?.trim();
    const resolvedTitle =
      requestedTitle && requestedTitle !== 'New Conversation'
        ? requestedTitle.slice(0, 120)
        : existing?.title && existing.title !== 'New Conversation'
          ? existing.title
          : messages.length > 0
            ? generateSmartConversationTitle(messages)
            : 'New Conversation';

    const now = Date.now();
    const record: ServerConversation = {
      id,
      ownerId: actorOwnerId,
      title: resolvedTitle,
      modelId: input.modelId || existing?.modelId || 'gemini-3.5-flash',
      pinned: input.pinned !== undefined ? Boolean(input.pinned) : Boolean(existing?.pinned),
      archived: input.archived !== undefined ? Boolean(input.archived) : Boolean(existing?.archived),
      messages,
      attachmentIds,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };

    if (shouldUseDatabase(options)) {
      const botUserId = getBotUserIdFromOwner(actorOwnerId);
      const saved = await prisma.botConversation.upsert({
        where: { id },
        update: {
          title: record.title,
          modelId: record.modelId,
          pinned: record.pinned,
          archived: record.archived,
          messagesJson: JSON.stringify(record.messages),
          attachmentIdsJson: JSON.stringify(record.attachmentIds),
        },
        create: {
          id: record.id,
          ownerId: actorOwnerId,
          botUserId,
          title: record.title,
          modelId: record.modelId,
          pinned: record.pinned,
          archived: record.archived,
          messagesJson: JSON.stringify(record.messages),
          attachmentIdsJson: JSON.stringify(record.attachmentIds),
        },
      });
      return mapDbConversation(saved);
    }

    await atomicWriteJson(getLocalConvPath(id, options), record);
    return record;
  });
}

export async function updateConversationMetaForOwner(
  rawId: string,
  actorOwnerId: string,
  patch: {
    title?: string;
    pinned?: boolean;
    archived?: boolean;
    modelId?: string;
  },
  options?: ConversationStoreOptions
): Promise<ServerConversation | null> {
  const id = assertValidConversationId(rawId);

  return enqueueWrite(async () => {
    const existing = await assertConversationOwnership(id, actorOwnerId, options);
    if (!existing) return null;

    const nextTitle =
      patch.title !== undefined
        ? patch.title.trim().slice(0, 120) || existing.title || 'Untitled Conversation'
        : existing.title;

    const updated: ServerConversation = {
      ...existing,
      title: nextTitle,
      pinned: patch.pinned !== undefined ? Boolean(patch.pinned) : existing.pinned,
      archived: patch.archived !== undefined ? Boolean(patch.archived) : existing.archived,
      modelId: patch.modelId !== undefined ? patch.modelId : existing.modelId,
      updatedAt: Date.now(),
    };

    if (shouldUseDatabase(options)) {
      const saved = await prisma.botConversation.update({
        where: { id },
        data: {
          title: updated.title,
          pinned: updated.pinned,
          archived: updated.archived,
          modelId: updated.modelId,
        },
      });
      return mapDbConversation(saved);
    }

    await atomicWriteJson(getLocalConvPath(id, options), updated);
    return updated;
  });
}

export async function deleteConversationForOwner(
  rawId: string,
  actorOwnerId: string,
  options?: ConversationStoreOptions
): Promise<boolean> {
  const id = assertValidConversationId(rawId);

  return enqueueWrite(async () => {
    const existing = await assertConversationOwnership(id, actorOwnerId, options);
    if (!existing) return false;

    if (shouldUseDatabase(options)) {
      await prisma.botConversation.delete({ where: { id } });
      return true;
    }

    await fs.unlink(getLocalConvPath(id, options)).catch(() => {});
    return true;
  });
}

export async function deleteAllConversationsForOwner(
  actorOwnerId: string,
  options?: ConversationStoreOptions
): Promise<number> {
  if (!actorOwnerId) return 0;

  return enqueueWrite(async () => {
    if (shouldUseDatabase(options)) {
      const res = await prisma.botConversation.deleteMany({ where: { ownerId: actorOwnerId } });
      return res.count;
    }

    const chatsDir = path.join(options?.storageDir || DEFAULT_STORE_DIR, 'chats');
    let deleted = 0;
    try {
      const files = await fs.readdir(chatsDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const p = path.join(chatsDir, file);
        try {
          const raw = await fs.readFile(p, 'utf8');
          const conv = JSON.parse(raw) as ServerConversation;
          if (conv.ownerId === actorOwnerId) {
            await fs.unlink(p);
            deleted++;
          }
        } catch {}
      }
    } catch {
      return 0;
    }
    return deleted;
  });
}

export async function migrateConversationsOwner(
  fromAnonOwnerId: string,
  toOwnerId: string,
  options?: ConversationStoreOptions
): Promise<number> {
  if (!fromAnonOwnerId || !toOwnerId || fromAnonOwnerId === toOwnerId) return 0;

  return enqueueWrite(async () => {
    if (shouldUseDatabase(options)) {
      const botUserId = getBotUserIdFromOwner(toOwnerId);
      const res = await prisma.botConversation.updateMany({
        where: { ownerId: fromAnonOwnerId },
        data: { ownerId: toOwnerId, botUserId },
      });
      return res.count;
    }

    const chatsDir = path.join(options?.storageDir || DEFAULT_STORE_DIR, 'chats');
    let migrated = 0;
    try {
      const files = await fs.readdir(chatsDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const p = path.join(chatsDir, file);
        try {
          const raw = await fs.readFile(p, 'utf8');
          const conv = JSON.parse(raw) as ServerConversation;
          if (conv.ownerId === fromAnonOwnerId) {
            await atomicWriteJson(p, { ...conv, ownerId: toOwnerId });
            migrated++;
          }
        } catch {}
      }
    } catch {
      return 0;
    }
    return migrated;
  });
}

function sanitizePreferences(raw: Partial<UserPreferences>): UserPreferences {
  const style =
    raw.responseStyle && VALID_RESPONSE_STYLES.has(raw.responseStyle)
      ? raw.responseStyle
      : 'balanced';

  const cleanDisplayName =
    typeof raw.displayName === 'string' && raw.displayName.trim()
      ? raw.displayName.trim().slice(0, 60)
      : undefined;

  const cleanLang =
    typeof raw.language === 'string' && raw.language.trim()
      ? raw.language.trim().slice(0, 40)
      : 'English';

  const cleanInstructions =
    typeof raw.customInstructions === 'string' && raw.customInstructions.trim()
      ? raw.customInstructions.trim().slice(0, 1200)
      : undefined;

  return {
    displayName: cleanDisplayName,
    responseStyle: style,
    language: cleanLang,
    customInstructions: cleanInstructions,
    defaultModelId:
      typeof raw.defaultModelId === 'string' && raw.defaultModelId.trim()
        ? raw.defaultModelId.trim().slice(0, 64)
        : undefined,
    defaultWebSearch: Boolean(raw.defaultWebSearch),
    enterToSend: raw.enterToSend !== undefined ? Boolean(raw.enterToSend) : true,
    updatedAt: raw.updatedAt,
  };
}

export async function getUserPreferencesForOwner(
  ownerId: string,
  options?: ConversationStoreOptions
): Promise<UserPreferences> {
  if (!ownerId) return { ...DEFAULT_USER_PREFERENCES };

  if (shouldUseDatabase(options)) {
    const botUserId = getBotUserIdFromOwner(ownerId);
    if (botUserId) {
      const acct = await prisma.botUser.findUnique({ where: { id: botUserId } });
      if (acct) {
        return sanitizePreferences({
          displayName: acct.displayName ?? acct.name,
          responseStyle: acct.responseStyle as ResponseStyle,
          language: acct.language,
          customInstructions: acct.customInstructions ?? undefined,
          defaultModelId: acct.defaultModelId ?? undefined,
          defaultWebSearch: acct.defaultWebSearch,
          enterToSend: acct.enterToSend,
          updatedAt: acct.updatedAt.toISOString(),
        });
      }
    }
    const pref = await prisma.botPreference.findUnique({ where: { ownerId } });
    if (pref) {
      return sanitizePreferences({
        displayName: pref.displayName ?? undefined,
        responseStyle: pref.responseStyle as ResponseStyle,
        language: pref.language,
        customInstructions: pref.customInstructions ?? undefined,
        defaultModelId: pref.defaultModelId ?? undefined,
        defaultWebSearch: pref.defaultWebSearch,
        enterToSend: pref.enterToSend,
        updatedAt: pref.updatedAt.toISOString(),
      });
    }
    return { ...DEFAULT_USER_PREFERENCES };
  }

  try {
    const raw = await fs.readFile(getLocalPrefsPath(ownerId, options), 'utf8');
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_USER_PREFERENCES };
  }
}

export async function updateUserPreferencesForOwner(
  ownerId: string,
  patch: Partial<UserPreferences>,
  options?: ConversationStoreOptions
): Promise<UserPreferences> {
  return enqueueWrite(async () => {
    const current = await getUserPreferencesForOwner(ownerId, options);
    const merged = sanitizePreferences({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    });

    if (shouldUseDatabase(options)) {
      const botUserId = getBotUserIdFromOwner(ownerId);
      if (botUserId) {
        await prisma.botUser
          .update({
            where: { id: botUserId },
            data: {
              displayName: merged.displayName ?? null,
              responseStyle: merged.responseStyle,
              language: merged.language,
              customInstructions: merged.customInstructions ?? null,
              defaultModelId: merged.defaultModelId ?? null,
              defaultWebSearch: merged.defaultWebSearch,
              enterToSend: merged.enterToSend,
            },
          })
          .catch(() => {});
        return merged;
      }

      await prisma.botPreference.upsert({
        where: { ownerId },
        update: {
          displayName: merged.displayName ?? null,
          responseStyle: merged.responseStyle,
          language: merged.language,
          customInstructions: merged.customInstructions ?? null,
          defaultModelId: merged.defaultModelId ?? null,
          defaultWebSearch: merged.defaultWebSearch,
          enterToSend: merged.enterToSend,
        },
        create: {
          ownerId,
          displayName: merged.displayName ?? null,
          responseStyle: merged.responseStyle,
          language: merged.language,
          customInstructions: merged.customInstructions ?? null,
          defaultModelId: merged.defaultModelId ?? null,
          defaultWebSearch: merged.defaultWebSearch,
          enterToSend: merged.enterToSend,
        },
      });
      return merged;
    }

    await atomicWriteJson(getLocalPrefsPath(ownerId, options), merged);
    return merged;
  });
}

export async function deletePreferencesForOwner(
  ownerId: string,
  options?: ConversationStoreOptions
): Promise<void> {
  if (!ownerId) return;
  if (shouldUseDatabase(options)) {
    await prisma.botPreference.deleteMany({ where: { ownerId } }).catch(() => {});
    return;
  }
  await fs.unlink(getLocalPrefsPath(ownerId, options)).catch(() => {});
}
