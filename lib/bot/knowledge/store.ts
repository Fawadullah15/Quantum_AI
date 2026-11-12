import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '@/lib/db';
import { DEFAULT_SETTINGS } from '@/lib/settings';
import { DEFAULT_KNOWLEDGE_DOCUMENTS } from './default-docs';
import { KnowledgeSearchIndex } from './indexer';
import {
  KNOWLEDGE_CATEGORIES,
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeIndexStats,
  KnowledgeIngestInput,
  KnowledgeSearchHit,
  KnowledgeUpdatePatch,
  KnowledgeVerificationStatus,
} from './types';

const STORE_SETTINGS_KEY = 'bot_knowledge_store_v1';
const DEFAULT_STORAGE_DIR = path.join(process.cwd(), '.private_storage', 'bot-knowledge');
const DB_REFRESH_TTL_MS = 60_000;

interface PersistedKnowledgeOverlay {
  version: 1;
  updatedAt: string;
  customDocs: KnowledgeDocument[];
  overrides: Record<string, KnowledgeUpdatePatch>;
  deletedIds: string[];
}

export interface KnowledgeStoreOptions {
  storageDir?: string;
  skipDatabase?: boolean;
}

const DEFAULT_EMPTY_OVERLAY: PersistedKnowledgeOverlay = {
  version: 1,
  updatedAt: new Date(0).toISOString(),
  customDocs: [],
  overrides: {},
  deletedIds: [],
};

// Module-level index cache keyed by storageDir ('default' or explicit path)
interface CachedIndexState {
  index: KnowledgeSearchIndex;
  docs: KnowledgeDocument[];
  dbSyncedAt: number;
  dirty: boolean;
}

const indexCache = new Map<string, CachedIndexState>();
let mutationChain = Promise.resolve();

function enqueueMutation<T>(fn: () => Promise<T>): Promise<T> {
  const result = mutationChain.then(fn, fn);
  mutationChain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

function getCacheKey(options?: KnowledgeStoreOptions): string {
  return options?.storageDir ? `dir:${path.resolve(options.storageDir)}` : 'default';
}

function getStoreFilePath(options?: KnowledgeStoreOptions): string {
  const dir = options?.storageDir || DEFAULT_STORAGE_DIR;
  return path.join(dir, 'store.json');
}

function isValidCategory(cat: string): cat is KnowledgeCategory {
  return (KNOWLEDGE_CATEGORIES as readonly string[]).includes(cat);
}

function isValidVerificationStatus(status: string): status is KnowledgeVerificationStatus {
  return status === 'verified' || status === 'draft' || status === 'needs_review';
}

function sanitizeId(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return cleaned || `kb-${crypto.randomBytes(4).toString('hex')}`;
}

async function readOverlay(options?: KnowledgeStoreOptions): Promise<PersistedKnowledgeOverlay> {
  const useDb = !options?.skipDatabase && !options?.storageDir && Boolean(process.env.DATABASE_URL);
  if (useDb) {
    try {
      const row = await prisma.siteSettings.findUnique({ where: { key: STORE_SETTINGS_KEY } });
      if (row?.value) {
        const parsed = JSON.parse(row.value) as Partial<PersistedKnowledgeOverlay>;
        return {
          version: 1,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          customDocs: Array.isArray(parsed.customDocs) ? parsed.customDocs : [],
          overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
          deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
        };
      }
    } catch {
      // Fallback transparently to local store file
    }
  }

  const filePath = getStoreFilePath(options);
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw) as Partial<PersistedKnowledgeOverlay>;
      return {
        version: 1,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        customDocs: Array.isArray(parsed.customDocs) ? parsed.customDocs : [],
        overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
        deletedIds: Array.isArray(parsed.deletedIds) ? parsed.deletedIds : [],
      };
    }
  } catch {
    // Corrupted file fallback
  }

  return {
    ...DEFAULT_EMPTY_OVERLAY,
    customDocs: [],
    overrides: {},
    deletedIds: [],
  };
}

async function writeOverlay(
  overlay: PersistedKnowledgeOverlay,
  options?: KnowledgeStoreOptions
): Promise<void> {
  overlay.updatedAt = new Date().toISOString();
  const serialized = JSON.stringify(overlay, null, 2);

  // Write atomically to local private storage
  const filePath = getStoreFilePath(options);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmpPath = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpPath, serialized, 'utf8');
  fs.renameSync(tmpPath, filePath);

  // Sync to Prisma SiteSettings when configured for persistent Vercel/cloud storage
  const useDb = !options?.skipDatabase && !options?.storageDir && Boolean(process.env.DATABASE_URL);
  if (useDb) {
    try {
      await prisma.siteSettings.upsert({
        where: { key: STORE_SETTINGS_KEY },
        update: { value: serialized },
        create: { key: STORE_SETTINGS_KEY, value: serialized },
      });
    } catch {
      // Local atomic store already succeeded
    }
  }
}

async function fetchLiveDatabaseDocuments(options?: KnowledgeStoreOptions): Promise<KnowledgeDocument[]> {
  if (options?.skipDatabase || !process.env.DATABASE_URL) {
    return [];
  }

  const nowIso = new Date().toISOString();
  const docs: KnowledgeDocument[] = [];

  try {
    const [services, products, caseStudies, leadership, members, technologies, settings] =
      await Promise.all([
        prisma.service.findMany({ where: { published: true }, take: 25 }).catch(() => []),
        prisma.product.findMany({ where: { published: true }, take: 25 }).catch(() => []),
        prisma.caseStudy.findMany({ where: { published: true }, take: 25 }).catch(() => []),
        prisma.leadership.findMany({ where: { isActive: true }, take: 20 }).catch(() => []),
        prisma.teamMember.findMany({ where: { published: true }, take: 25 }).catch(() => []),
        prisma.technology.findMany({ where: { published: true }, take: 35 }).catch(() => []),
        prisma.siteSettings.findMany().catch(() => []),
      ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (s?.key && s?.value && s.key !== STORE_SETTINGS_KEY) settingsMap[s.key] = s.value;
    }

    if (settingsMap.company_description || settingsMap.company_email) {
      docs.push({
        id: 'db-company-settings',
        title: `${settingsMap.company_name || 'Quantum AI'} — Live Website Settings & Contact`,
        category: 'contact',
        source: 'prisma:SiteSettings',
        path: '/contact',
        url: 'https://quantumaitech.org/contact',
        verificationStatus: 'verified',
        lastUpdated: nowIso,
        origin: 'database',
        tags: ['contact', 'email', 'location', 'settings'],
        content: `Company: ${settingsMap.company_name || DEFAULT_SETTINGS.company_name}
Tagline: ${settingsMap.company_tagline || DEFAULT_SETTINGS.company_tagline}
Description: ${settingsMap.company_description || DEFAULT_SETTINGS.company_description}
Email: ${settingsMap.company_email || DEFAULT_SETTINGS.company_email}
Location: ${settingsMap.company_location || DEFAULT_SETTINGS.company_location}`,
      });
    }

    for (const svc of services) {
      docs.push({
        id: `db-svc-${svc.id}`,
        title: `Service — ${svc.name}`,
        category: 'services',
        source: 'prisma:Service',
        path: '/services',
        url: 'https://quantumaitech.org/services',
        verificationStatus: 'verified',
        lastUpdated: svc.updatedAt?.toISOString?.() || nowIso,
        origin: 'database',
        tags: ['service', svc.category || 'engineering', svc.name.toLowerCase()],
        content: `${svc.description || ''}${svc.category ? ` (Category: ${svc.category})` : ''}`.trim(),
      });
    }

    for (const prod of products) {
      docs.push({
        id: `db-prod-${prod.id}`,
        title: `Product — ${prod.name}`,
        category: 'projects',
        source: 'prisma:Product',
        path: prod.slug ? `/products/${prod.slug}` : '/products',
        url: prod.slug
          ? `https://quantumaitech.org/products/${prod.slug}`
          : 'https://quantumaitech.org/products',
        verificationStatus: 'verified',
        lastUpdated: prod.updatedAt?.toISOString?.() || nowIso,
        origin: 'database',
        tags: ['product', prod.category.toLowerCase(), prod.name.toLowerCase()],
        content: `${prod.description || ''} (${prod.category} · Status: ${prod.status}${prod.technologies ? ` · Tech: ${prod.technologies}` : ''})`.trim(),
      });
    }

    for (const cs of caseStudies) {
      const isCopilot = cs.slug === 'mechanical-engineering-design-copilot';
      docs.push({
        id: `db-cs-${cs.id}`,
        title: `Project — ${cs.title}`,
        category: isCopilot ? 'mechanical_copilot' : 'projects',
        source: 'prisma:CaseStudy',
        path: cs.slug ? `/work/${cs.slug}` : '/work',
        url: cs.slug ? `https://quantumaitech.org/work/${cs.slug}` : 'https://quantumaitech.org/work',
        verificationStatus: 'verified',
        lastUpdated: cs.updatedAt?.toISOString?.() || nowIso,
        origin: 'database',
        tags: ['project', 'case study', cs.industry?.toLowerCase() || 'engineering'],
        content: `Title: ${cs.title}
Origin/Client: ${cs.client} | Industry: ${cs.industry} | Status: ${cs.status}.
Problem: ${cs.problem}
Solution: ${cs.solution}
Technologies: ${cs.technologies}`,
      });
    }

    for (const leader of leadership) {
      const roleTitle = leader.customRole || leader.position;
      docs.push({
        id: `db-leader-${leader.id}`,
        title: `${leader.name} — ${roleTitle}`,
        category: 'team',
        source: 'prisma:Leadership',
        path: `/leadership/${leader.slug}`,
        url: `https://quantumaitech.org/leadership/${leader.slug}`,
        verificationStatus: 'verified',
        lastUpdated: leader.updatedAt?.toISOString?.() || nowIso,
        origin: 'database',
        tags: ['leadership', 'team', leader.name.toLowerCase(), roleTitle.toLowerCase()],
        content: `${leader.name} (${leader.publicId || ''}) — ${roleTitle}${leader.location ? ` · Location: ${leader.location}` : ''}.
${leader.fullBio || leader.shortBio}`.trim(),
      });
    }

    for (const member of members) {
      docs.push({
        id: `db-team-${member.id}`,
        title: `${member.name} — ${member.role}`,
        category: 'team',
        source: 'prisma:TeamMember',
        path: '/about',
        url: 'https://quantumaitech.org/about',
        verificationStatus: 'verified',
        lastUpdated: member.updatedAt?.toISOString?.() || nowIso,
        origin: 'database',
        tags: ['team', member.name.toLowerCase()],
        content: member.bio || `${member.name} (${member.role}) at Quantum AI.`,
      });
    }

    if (technologies.length > 0) {
      docs.push({
        id: 'db-technologies',
        title: 'Quantum AI Technology Stack (Live Catalog)',
        category: 'software_development',
        source: 'prisma:Technology',
        path: '/technology',
        url: 'https://quantumaitech.org/technology',
        verificationStatus: 'verified',
        lastUpdated: nowIso,
        origin: 'database',
        tags: ['technology stack', 'architecture', 'tools'],
        content: technologies
          .map((t) => `${t.name} [${t.category}]: ${t.shortDescription || ''}`)
          .join('\n'),
      });
    }
  } catch {
    // DB offline fallback handled cleanly
  }

  return docs;
}

function applyPatchToDoc(doc: KnowledgeDocument, patch?: KnowledgeUpdatePatch): KnowledgeDocument {
  if (!patch) return doc;
  return {
    ...doc,
    title: typeof patch.title === 'string' ? patch.title : doc.title,
    category: patch.category && isValidCategory(patch.category) ? patch.category : doc.category,
    source: typeof patch.source === 'string' ? patch.source : doc.source,
    content: typeof patch.content === 'string' ? patch.content : doc.content,
    verificationStatus:
      patch.verificationStatus && isValidVerificationStatus(patch.verificationStatus)
        ? patch.verificationStatus
        : doc.verificationStatus,
    lastUpdated: typeof patch.lastUpdated === 'string' ? patch.lastUpdated : doc.lastUpdated,
    tags: Array.isArray(patch.tags) ? patch.tags : doc.tags,
    path: typeof patch.path === 'string' ? patch.path : doc.path,
    url: typeof patch.url === 'string' ? patch.url : doc.url,
  };
}

async function rebuildState(options?: KnowledgeStoreOptions): Promise<CachedIndexState> {
  const key = getCacheKey(options);
  const existing = indexCache.get(key);
  const [overlay, dbDocs] = await Promise.all([
    readOverlay(options),
    fetchLiveDatabaseDocuments(options),
  ]);

  const deletedSet = new Set(overlay.deletedIds || []);
  const customMap = new Map<string, KnowledgeDocument>();
  for (const c of overlay.customDocs || []) {
    if (c && c.id && !deletedSet.has(c.id)) {
      customMap.set(c.id, { ...c, origin: 'custom' });
    }
  }

  const mergedDocs: KnowledgeDocument[] = [];
  const seenIds = new Set<string>();

  // 1. Custom docs first (admin ingested)
  for (const doc of customMap.values()) {
    seenIds.add(doc.id);
    mergedDocs.push(applyPatchToDoc(doc, overlay.overrides[doc.id]));
  }

  // 2. Live DB docs (when present & not deleted)
  for (const dbDoc of dbDocs) {
    if (deletedSet.has(dbDoc.id) || seenIds.has(dbDoc.id)) continue;
    seenIds.add(dbDoc.id);
    mergedDocs.push(applyPatchToDoc(dbDoc, overlay.overrides[dbDoc.id]));
  }

  // 3. Verified baseline docs
  for (const baseDoc of DEFAULT_KNOWLEDGE_DOCUMENTS) {
    if (deletedSet.has(baseDoc.id) || seenIds.has(baseDoc.id)) continue;
    seenIds.add(baseDoc.id);
    mergedDocs.push(applyPatchToDoc(baseDoc, overlay.overrides[baseDoc.id]));
  }

  const index = existing?.index || new KnowledgeSearchIndex();
  index.build(mergedDocs);

  const state: CachedIndexState = {
    index,
    docs: mergedDocs,
    dbSyncedAt: Date.now(),
    dirty: false,
  };
  indexCache.set(key, state);
  return state;
}

async function ensureIndexState(options?: KnowledgeStoreOptions): Promise<CachedIndexState> {
  const key = getCacheKey(options);
  const existing = indexCache.get(key);
  const isStale =
    !existing ||
    existing.dirty ||
    (!options?.skipDatabase && Date.now() - existing.dbSyncedAt > DB_REFRESH_TTL_MS);

  if (isStale) {
    return rebuildState(options);
  }
  return existing;
}

export async function reindexKnowledgeBase(
  options?: KnowledgeStoreOptions
): Promise<KnowledgeIndexStats> {
  const state = await rebuildState(options);
  return state.index.getStats();
}

export async function getKnowledgeIndexStats(
  options?: KnowledgeStoreOptions
): Promise<KnowledgeIndexStats> {
  const state = await ensureIndexState(options);
  return state.index.getStats();
}

export async function listKnowledgeDocuments(
  filter?: {
    category?: KnowledgeCategory | 'all';
    includeUnverified?: boolean;
  },
  options?: KnowledgeStoreOptions
): Promise<KnowledgeDocument[]> {
  const state = await ensureIndexState(options);
  const includeUnverified = filter?.includeUnverified === true;
  const category = filter?.category && filter.category !== 'all' ? filter.category : null;

  return state.docs.filter((d) => {
    if (!includeUnverified && d.verificationStatus !== 'verified') return false;
    if (category && d.category !== category) return false;
    return true;
  });
}

export async function getKnowledgeDocumentById(
  id: string,
  options?: KnowledgeStoreOptions
): Promise<KnowledgeDocument | null> {
  const state = await ensureIndexState(options);
  return state.docs.find((d) => d.id === id) || null;
}

export async function searchKnowledgeBase(
  query: string,
  searchOpts?: {
    category?: KnowledgeCategory | 'all';
    limit?: number;
    includeUnverified?: boolean;
    minScore?: number;
  },
  storeOpts?: KnowledgeStoreOptions
): Promise<{
  hits: KnowledgeSearchHit[];
  stats: KnowledgeIndexStats;
}> {
  const state = await ensureIndexState(storeOpts);
  const hits = state.index.search(query, searchOpts);
  return {
    hits,
    stats: state.index.getStats(),
  };
}

export async function ingestKnowledgeDocument(
  input: KnowledgeIngestInput,
  storeOpts?: KnowledgeStoreOptions
): Promise<{ document: KnowledgeDocument; stats: KnowledgeIndexStats }> {
  return enqueueMutation(async () => {
    if (!input || typeof input.title !== 'string' || !input.title.trim()) {
      throw new Error('Knowledge document "title" is required.');
    }
    if (!input.category || !isValidCategory(input.category)) {
      throw new Error(`Invalid knowledge category "${input?.category}".`);
    }
    if (typeof input.source !== 'string' || !input.source.trim()) {
      throw new Error('Knowledge document "source" is required.');
    }
    if (typeof input.content !== 'string' || input.content.trim().length < 10) {
      throw new Error('Knowledge document "content" must be at least 10 characters.');
    }

    const overlay = await readOverlay(storeOpts);
    const id = input.id
      ? sanitizeId(input.id)
      : `custom-${sanitizeId(input.title)}-${crypto.randomBytes(3).toString('hex')}`;

    const verificationStatus: KnowledgeVerificationStatus =
      input.verificationStatus && isValidVerificationStatus(input.verificationStatus)
        ? input.verificationStatus
        : 'verified';

    const doc: KnowledgeDocument = {
      id,
      title: input.title.trim(),
      category: input.category,
      source: input.source.trim(),
      content: input.content.trim(),
      verificationStatus,
      lastUpdated: input.lastUpdated || new Date().toISOString(),
      tags: Array.isArray(input.tags)
        ? input.tags.map((t) => String(t).trim()).filter(Boolean)
        : undefined,
      path: input.path?.trim() || undefined,
      url: input.url?.trim() || undefined,
      origin: 'custom',
    };

    // Un-tombstone if previously deleted, and replace any custom doc with same id
    overlay.deletedIds = (overlay.deletedIds || []).filter((deletedId) => deletedId !== id);
    const existingIdx = overlay.customDocs.findIndex((d) => d.id === id);
    if (existingIdx >= 0) {
      overlay.customDocs[existingIdx] = doc;
    } else {
      overlay.customDocs.unshift(doc);
    }

    await writeOverlay(overlay, storeOpts);
    const stats = await reindexKnowledgeBase(storeOpts);
    return { document: doc, stats };
  });
}

export async function updateKnowledgeDocument(
  id: string,
  patch: KnowledgeUpdatePatch,
  storeOpts?: KnowledgeStoreOptions
): Promise<{ document: KnowledgeDocument; stats: KnowledgeIndexStats }> {
  return enqueueMutation(async () => {
    const state = await ensureIndexState(storeOpts);
    const existing = state.docs.find((d) => d.id === id);
    if (!existing) {
      throw new Error(`Knowledge document "${id}" not found.`);
    }

    if (patch.category !== undefined && !isValidCategory(patch.category)) {
      throw new Error(`Invalid knowledge category "${patch.category}".`);
    }
    if (
      patch.verificationStatus !== undefined &&
      !isValidVerificationStatus(patch.verificationStatus)
    ) {
      throw new Error(`Invalid verificationStatus "${patch.verificationStatus}".`);
    }
    if (patch.title !== undefined && !patch.title.trim()) {
      throw new Error('Document title cannot be empty.');
    }
    if (patch.content !== undefined && patch.content.trim().length < 5) {
      throw new Error('Document content cannot be shorter than 5 characters.');
    }

    const overlay = await readOverlay(storeOpts);
    const nextPatch: KnowledgeUpdatePatch = {
      ...(overlay.overrides[id] || {}),
      ...patch,
      lastUpdated: patch.lastUpdated || new Date().toISOString(),
    };

    const customIdx = overlay.customDocs.findIndex((d) => d.id === id);
    if (customIdx >= 0) {
      overlay.customDocs[customIdx] = applyPatchToDoc(overlay.customDocs[customIdx], nextPatch);
      delete overlay.overrides[id];
    } else {
      overlay.overrides[id] = nextPatch;
    }

    await writeOverlay(overlay, storeOpts);
    const stats = await reindexKnowledgeBase(storeOpts);
    const updated = await getKnowledgeDocumentById(id, storeOpts);
    return {
      document: updated || applyPatchToDoc(existing, nextPatch),
      stats,
    };
  });
}

export async function removeKnowledgeDocument(
  id: string,
  storeOpts?: KnowledgeStoreOptions
): Promise<{ removedId: string; stats: KnowledgeIndexStats }> {
  return enqueueMutation(async () => {
    const state = await ensureIndexState(storeOpts);
    const existing = state.docs.find((d) => d.id === id);
    if (!existing) {
      throw new Error(`Knowledge document "${id}" not found.`);
    }

    const overlay = await readOverlay(storeOpts);
    overlay.customDocs = overlay.customDocs.filter((d) => d.id !== id);
    delete overlay.overrides[id];
    if (!overlay.deletedIds.includes(id)) {
      overlay.deletedIds.push(id);
    }

    await writeOverlay(overlay, storeOpts);
    const stats = await reindexKnowledgeBase(storeOpts);
    return { removedId: id, stats };
  });
}
