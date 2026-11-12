import crypto from 'crypto';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import { BUILT_IN_MODELS } from './default-models';
import {
  AIProvider,
  BotUsageLimitsConfig,
  ModelCapability,
  ModelDefinition,
  OpenWeightBackend,
  SafeProviderConfig,
} from './types';

const DEFAULT_ADMIN_DIR = path.join(process.cwd(), '.private_storage', 'bot_admin');
const CONFIG_FILENAME = 'admin_config.json';

export interface AdminConfigStoreOptions {
  storageDir?: string;
  skipDatabase?: boolean;
}

export class AdminConfigError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'AdminConfigError';
  }
}

export interface StoredProviderState {
  provider: AIProvider;
  enabled: boolean;
  encryptedApiKey?: string | null;
  maskedKeyHint?: string | null;
  baseUrl?: string | null;
  openweightBackend?: OpenWeightBackend | null;
  monthlyBudgetUsd?: number | null;
  alertThresholdPct: number;
  lastCheckedAt?: string | null;
  lastStatusOk?: boolean | null;
  lastLatencyMs?: number | null;
  lastError?: string | null;
  updatedAt?: string;
}

export interface PersistedModelOverride {
  id: string;
  name: string;
  provider: AIProvider;
  modelIdentifier: string;
  description: string;
  capabilities: ModelCapability[];
  contextWindow: number;
  maxOutputTokens: number;
  pricing: {
    inputPerMillion: number;
    outputPerMillion: number;
  };
  family?: string;
  recommendedFor?: string;
  enabled: boolean;
  isDefault: boolean;
  isCustom: boolean;
}

export interface AdminConfigSnapshot {
  providers: Record<AIProvider, StoredProviderState>;
  models: Record<string, PersistedModelOverride>;
  limits: BotUsageLimitsConfig;
  defaultModelId: string;
  loadedAt: number;
}

export const ALL_PROVIDERS: Array<{ id: AIProvider; name: string }> = [
  { id: 'gemini', name: 'Google Gemini' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'anthropic', name: 'Anthropic Claude' },
  { id: 'openweight', name: 'Open-Weight (Groq / OpenRouter / Together / Ollama)' },
];

export const ALL_CAPABILITIES: ModelCapability[] = [
  'vision',
  'tools',
  'streaming',
  'json',
  'code_execution',
  'long_context',
];

export const DEFAULT_USAGE_LIMITS: BotUsageLimitsConfig = {
  anonMessagesPerHour: 15,
  anonMessagesPerDay: 40,
  authMessagesPerHour: 60,
  authMessagesPerDay: 250,
  perUserRequestsPerMinute: 12,
  maxMessageChars: 16000,
  maxMessagesPerRequest: 60,
  maxAttachmentsPerMessage: 5,
  maxDocImageBytes: 15 * 1024 * 1024, // 15 MB
  maxTextCodeBytes: 2 * 1024 * 1024, // 2 MB
  dailySpendingAlertUsd: 10.0,
  monthlySpendingAlertUsd: 100.0,
  enforceSpendingHardStop: false,
};

const VALID_PROVIDER_SET = new Set<AIProvider>(['gemini', 'openai', 'anthropic', 'openweight']);
const VALID_CAPABILITY_SET = new Set<ModelCapability>(ALL_CAPABILITIES);
const VALID_OPENWEIGHT_BACKENDS = new Set<OpenWeightBackend>([
  'groq',
  'openrouter',
  'together',
  'ollama',
]);

// Global runtime cache for fast synchronous access inside adapters & model resolver
const globalCache = globalThis as unknown as {
  __qbAdminConfigSnapshot?: AdminConfigSnapshot;
};

let configWriteChain = Promise.resolve();
function enqueueConfigWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = configWriteChain.then(fn, fn);
  configWriteChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function shouldUseDatabase(options?: AdminConfigStoreOptions): boolean {
  return !options?.skipDatabase && !options?.storageDir && Boolean(process.env.DATABASE_URL);
}

function getLocalConfigFile(options?: AdminConfigStoreOptions): string {
  return path.join(options?.storageDir || DEFAULT_ADMIN_DIR, CONFIG_FILENAME);
}

// ─── AES-256-GCM Secret Encryption (API keys never returned plaintext after save) ──

function getEncryptionKey(): Buffer {
  const rawSecret =
    process.env.BOT_CONFIG_ENCRYPTION_KEY ||
    process.env.BOT_FILE_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'quantumbot-local-dev-admin-encryption-key-v1';
  return crypto.createHash('sha256').update(rawSecret).digest();
}

export function encryptProviderSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64url')}:${tag.toString('base64url')}:${encrypted.toString('base64url')}`;
}

export function decryptProviderSecret(cipherPayload: string | null | undefined): string | null {
  if (!cipherPayload || typeof cipherPayload !== 'string') return null;
  const parts = cipherPayload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  try {
    const iv = Buffer.from(parts[1], 'base64url');
    const tag = Buffer.from(parts[2], 'base64url');
    const encrypted = Buffer.from(parts[3], 'base64url');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function maskSecretHint(plainKey: string): string {
  const clean = (plainKey || '').trim();
  if (!clean) return '••••';
  if (clean.length <= 6) return '••••••';
  return `••••••••${clean.slice(-4)}`;
}

// ─── Snapshot Construction & Persistence ─────────────────────────────────────

function createDefaultProvidersMap(): Record<AIProvider, StoredProviderState> {
  return {
    gemini: { provider: 'gemini', enabled: true, alertThresholdPct: 80 },
    openai: { provider: 'openai', enabled: true, alertThresholdPct: 80 },
    anthropic: { provider: 'anthropic', enabled: true, alertThresholdPct: 80 },
    openweight: { provider: 'openweight', enabled: true, alertThresholdPct: 80 },
  };
}

function buildEmptySnapshot(): AdminConfigSnapshot {
  const defaultBuiltIn = BUILT_IN_MODELS.find((m) => m.isDefault) || BUILT_IN_MODELS[0];
  return {
    providers: createDefaultProvidersMap(),
    models: {},
    limits: { ...DEFAULT_USAGE_LIMITS },
    defaultModelId: defaultBuiltIn.id,
    loadedAt: Date.now(),
  };
}

function normalizeSnapshot(raw: any): AdminConfigSnapshot {
  const base = buildEmptySnapshot();
  if (!raw || typeof raw !== 'object') return base;

  if (raw.providers && typeof raw.providers === 'object') {
    for (const p of VALID_PROVIDER_SET) {
      const src = raw.providers[p];
      if (src && typeof src === 'object') {
        base.providers[p] = {
          provider: p,
          enabled: src.enabled !== false,
          encryptedApiKey: src.encryptedApiKey ?? null,
          maskedKeyHint: src.maskedKeyHint ?? null,
          baseUrl: src.baseUrl ?? null,
          openweightBackend: VALID_OPENWEIGHT_BACKENDS.has(src.openweightBackend)
            ? src.openweightBackend
            : null,
          monthlyBudgetUsd:
            typeof src.monthlyBudgetUsd === 'number' && Number.isFinite(src.monthlyBudgetUsd)
              ? src.monthlyBudgetUsd
              : null,
          alertThresholdPct:
            typeof src.alertThresholdPct === 'number'
              ? Math.min(100, Math.max(10, Math.round(src.alertThresholdPct)))
              : 80,
          lastCheckedAt: src.lastCheckedAt ?? null,
          lastStatusOk: typeof src.lastStatusOk === 'boolean' ? src.lastStatusOk : null,
          lastLatencyMs: typeof src.lastLatencyMs === 'number' ? src.lastLatencyMs : null,
          lastError: src.lastError ?? null,
          updatedAt: src.updatedAt,
        };
      }
    }
  }

  if (raw.models && typeof raw.models === 'object') {
    for (const [id, m] of Object.entries<any>(raw.models)) {
      if (!m || typeof m !== 'object') continue;
      if (!VALID_PROVIDER_SET.has(m.provider)) continue;
      base.models[id] = {
        id,
        name: String(m.name || id),
        provider: m.provider,
        modelIdentifier: String(m.modelIdentifier || id),
        description: String(m.description || ''),
        capabilities: Array.isArray(m.capabilities)
          ? m.capabilities.filter((c: any) => VALID_CAPABILITY_SET.has(c))
          : ['streaming'],
        contextWindow: Math.max(1024, Number(m.contextWindow || 32768)),
        maxOutputTokens: Math.max(256, Number(m.maxOutputTokens || 4096)),
        pricing: {
          inputPerMillion: Math.max(0, Number(m.pricing?.inputPerMillion ?? 0)),
          outputPerMillion: Math.max(0, Number(m.pricing?.outputPerMillion ?? 0)),
        },
        family: m.family ? String(m.family) : undefined,
        recommendedFor: m.recommendedFor ? String(m.recommendedFor) : undefined,
        enabled: m.enabled !== false,
        isDefault: Boolean(m.isDefault),
        isCustom: Boolean(m.isCustom),
      };
    }
  }

  if (raw.limits && typeof raw.limits === 'object') {
    base.limits = sanitizeUsageLimits({ ...DEFAULT_USAGE_LIMITS, ...raw.limits });
  }

  if (typeof raw.defaultModelId === 'string' && raw.defaultModelId.trim()) {
    base.defaultModelId = raw.defaultModelId.trim();
  }

  base.loadedAt = Date.now();
  return base;
}

function readLocalSnapshotSync(options?: AdminConfigStoreOptions): AdminConfigSnapshot | null {
  try {
    const file = getLocalConfigFile(options);
    if (!fs.existsSync(file)) return null;
    const raw = fs.readFileSync(file, 'utf8');
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeLocalSnapshot(
  snapshot: AdminConfigSnapshot,
  options?: AdminConfigStoreOptions
): Promise<void> {
  const filePath = getLocalConfigFile(options);
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  await fsPromises.writeFile(tmpPath, JSON.stringify(snapshot, null, 2), 'utf8');
  await fsPromises.rename(tmpPath, filePath);
}

export async function ensureAdminConfigLoaded(
  options?: AdminConfigStoreOptions
): Promise<AdminConfigSnapshot> {
  // Custom test directory always bypasses global cache so isolated tests never collide
  if (options?.storageDir || options?.skipDatabase) {
    const local = readLocalSnapshotSync(options);
    return local || buildEmptySnapshot();
  }

  if (globalCache.__qbAdminConfigSnapshot && Date.now() - globalCache.__qbAdminConfigSnapshot.loadedAt < 30_000) {
    return globalCache.__qbAdminConfigSnapshot;
  }

  if (shouldUseDatabase(options)) {
    try {
      const [dbProviders, dbModels, dbLimits] = await Promise.all([
        prisma.botProviderConfig.findMany(),
        prisma.botModelConfig.findMany(),
        prisma.botUsageLimits.findUnique({ where: { id: 'default' } }),
      ]);

      const snap = buildEmptySnapshot();
      for (const row of dbProviders) {
        if (!VALID_PROVIDER_SET.has(row.provider as AIProvider)) continue;
        const pid = row.provider as AIProvider;
        snap.providers[pid] = {
          provider: pid,
          enabled: row.enabled,
          encryptedApiKey: row.encryptedApiKey,
          maskedKeyHint: row.maskedKeyHint,
          baseUrl: row.baseUrl,
          openweightBackend: VALID_OPENWEIGHT_BACKENDS.has(row.openweightBackend as OpenWeightBackend)
            ? (row.openweightBackend as OpenWeightBackend)
            : null,
          monthlyBudgetUsd: row.monthlyBudgetUsd,
          alertThresholdPct: row.alertThresholdPct,
          lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
          lastStatusOk: row.lastStatusOk,
          lastLatencyMs: row.lastLatencyMs,
          lastError: row.lastError,
          updatedAt: row.updatedAt.toISOString(),
        };
      }

      for (const row of dbModels) {
        if (!VALID_PROVIDER_SET.has(row.provider as AIProvider)) continue;
        let caps: ModelCapability[] = ['streaming'];
        try {
          const parsed = JSON.parse(row.capabilitiesJson);
          if (Array.isArray(parsed)) {
            caps = parsed.filter((c) => VALID_CAPABILITY_SET.has(c));
          }
        } catch {}
        snap.models[row.id] = {
          id: row.id,
          name: row.name,
          provider: row.provider as AIProvider,
          modelIdentifier: row.modelIdentifier,
          description: row.description,
          capabilities: caps,
          contextWindow: row.contextWindow,
          maxOutputTokens: row.maxOutputTokens,
          pricing: {
            inputPerMillion: row.inputPerMillion,
            outputPerMillion: row.outputPerMillion,
          },
          family: row.family || undefined,
          recommendedFor: row.recommendedFor || undefined,
          enabled: row.enabled,
          isDefault: row.isDefault,
          isCustom: row.isCustom,
        };
        if (row.isDefault) {
          snap.defaultModelId = row.id;
        }
      }

      if (dbLimits) {
        snap.limits = sanitizeUsageLimits({
          anonMessagesPerHour: dbLimits.anonMessagesPerHour,
          anonMessagesPerDay: dbLimits.anonMessagesPerDay,
          authMessagesPerHour: dbLimits.authMessagesPerHour,
          authMessagesPerDay: dbLimits.authMessagesPerDay,
          perUserRequestsPerMinute: dbLimits.perUserRequestsPerMinute,
          maxMessageChars: dbLimits.maxMessageChars,
          maxMessagesPerRequest: dbLimits.maxMessagesPerRequest,
          maxAttachmentsPerMessage: dbLimits.maxAttachmentsPerMessage,
          maxDocImageBytes: dbLimits.maxDocImageBytes,
          maxTextCodeBytes: dbLimits.maxTextCodeBytes,
          dailySpendingAlertUsd: dbLimits.dailySpendingAlertUsd,
          monthlySpendingAlertUsd: dbLimits.monthlySpendingAlertUsd,
          enforceSpendingHardStop: dbLimits.enforceSpendingHardStop,
          updatedAt: dbLimits.updatedAt.toISOString(),
        });
      }

      globalCache.__qbAdminConfigSnapshot = snap;
      return snap;
    } catch {
      // Fallback gracefully to local file if DB isn't migrated yet
    }
  }

  const localSnap = readLocalSnapshotSync(options) || buildEmptySnapshot();
  globalCache.__qbAdminConfigSnapshot = localSnap;
  return localSnap;
}

/**
 * Synchronous reader used by adapters, file validators, and model registry calls.
 */
export function getAdminConfigSnapshot(options?: AdminConfigStoreOptions): AdminConfigSnapshot {
  if (options?.storageDir || options?.skipDatabase) {
    return readLocalSnapshotSync(options) || buildEmptySnapshot();
  }
  if (!globalCache.__qbAdminConfigSnapshot) {
    globalCache.__qbAdminConfigSnapshot = readLocalSnapshotSync() || buildEmptySnapshot();
  }
  return globalCache.__qbAdminConfigSnapshot;
}

export function clearAdminConfigCache(): void {
  globalCache.__qbAdminConfigSnapshot = undefined;
}

// ─── Provider Configuration & Encrypted Key Resolution ───────────────────────

function getEnvApiKeyForProvider(provider: AIProvider): string | null {
  switch (provider) {
    case 'gemini':
      return (
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY ||
        process.env.GOOGLE_AI_API_KEY ||
        null
      );
    case 'openai':
      return process.env.OPENAI_API_KEY || null;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || null;
    case 'openweight':
      return (
        process.env.GROQ_API_KEY ||
        process.env.OPENROUTER_API_KEY ||
        process.env.TOGETHER_API_KEY ||
        (process.env.OLLAMA_BASE_URL ? 'ollama' : null)
      );
  }
}

export function resolveProviderRuntimeConfig(
  provider: AIProvider,
  options?: AdminConfigStoreOptions
): {
  enabled: boolean;
  apiKey: string | null;
  baseUrl: string | null;
  openweightBackend: OpenWeightBackend | null;
  keySource: 'admin' | 'env' | 'none';
} {
  const snap = getAdminConfigSnapshot(options);
  const state = snap.providers[provider] || { provider, enabled: true, alertThresholdPct: 80 };

  if (!state.enabled) {
    return {
      enabled: false,
      apiKey: null,
      baseUrl: state.baseUrl || null,
      openweightBackend: state.openweightBackend || null,
      keySource: 'none',
    };
  }

  const decryptedAdminKey = decryptProviderSecret(state.encryptedApiKey);
  if (decryptedAdminKey && decryptedAdminKey.trim()) {
    return {
      enabled: true,
      apiKey: decryptedAdminKey.trim(),
      baseUrl: state.baseUrl?.trim() || null,
      openweightBackend: state.openweightBackend || null,
      keySource: 'admin',
    };
  }

  if (provider === 'openweight' && state.openweightBackend === 'ollama' && state.baseUrl?.trim()) {
    return {
      enabled: true,
      apiKey: 'ollama',
      baseUrl: state.baseUrl.trim(),
      openweightBackend: 'ollama',
      keySource: 'admin',
    };
  }

  const envKey = getEnvApiKeyForProvider(provider);
  if (envKey && envKey.trim()) {
    return {
      enabled: true,
      apiKey: envKey.trim(),
      baseUrl: state.baseUrl?.trim() || null,
      openweightBackend: state.openweightBackend || null,
      keySource: 'env',
    };
  }

  return {
    enabled: true,
    apiKey: null,
    baseUrl: state.baseUrl?.trim() || null,
    openweightBackend: state.openweightBackend || null,
    keySource: 'none',
  };
}

/**
 * Returns strict SAFE provider configs with API keys permanently masked (never readable after saving).
 */
export async function listSafeProviderConfigs(
  options?: AdminConfigStoreOptions
): Promise<SafeProviderConfig[]> {
  const snap = await ensureAdminConfigLoaded(options);

  return ALL_PROVIDERS.map(({ id, name }) => {
    const state = snap.providers[id];
    const hasOllamaAdminUrl =
      id === 'openweight' && state.openweightBackend === 'ollama' && Boolean(state.baseUrl?.trim());
    const hasAdminKey = Boolean(decryptProviderSecret(state?.encryptedApiKey)) || hasOllamaAdminUrl;
    const envKey = getEnvApiKeyForProvider(id);
    const hasEnvKey = Boolean(envKey && envKey.trim());
    const keySource: 'admin' | 'env' | 'none' = hasAdminKey
      ? 'admin'
      : hasEnvKey
        ? 'env'
        : 'none';
    const isConfigured = state.enabled && (hasAdminKey || hasEnvKey);

    return {
      provider: id,
      name,
      enabled: state.enabled,
      hasAdminKey,
      hasEnvKey,
      isConfigured,
      keySource,
      maskedKeyHint: hasOllamaAdminUrl
        ? 'Local Ollama'
        : hasAdminKey
          ? state.maskedKeyHint || '••••••••'
          : hasEnvKey
            ? `ENV (${maskSecretHint(envKey!)})`
            : null,
      baseUrl: state.baseUrl || null,
      openweightBackend: state.openweightBackend || null,
      monthlyBudgetUsd: state.monthlyBudgetUsd ?? null,
      alertThresholdPct: state.alertThresholdPct ?? 80,
      lastCheckedAt: state.lastCheckedAt ?? null,
      lastStatusOk: state.lastStatusOk ?? null,
      lastLatencyMs: state.lastLatencyMs ?? null,
      lastError: state.lastError ?? null,
    };
  });
}

export async function updateProviderConfig(
  provider: AIProvider,
  patch: {
    enabled?: boolean;
    apiKey?: string; // Plaintext incoming ONLY; immediately encrypted + masked on write
    clearApiKey?: boolean;
    baseUrl?: string | null;
    openweightBackend?: OpenWeightBackend | null;
    monthlyBudgetUsd?: number | null;
    alertThresholdPct?: number;
  },
  options?: AdminConfigStoreOptions
): Promise<SafeProviderConfig> {
  if (!VALID_PROVIDER_SET.has(provider)) {
    throw new AdminConfigError(400, `Unsupported provider "${provider}".`);
  }

  return enqueueConfigWrite(async () => {
    const snap = await ensureAdminConfigLoaded(options);
    const current = snap.providers[provider] || {
      provider,
      enabled: true,
      alertThresholdPct: 80,
    };

    let encryptedApiKey = current.encryptedApiKey ?? null;
    let maskedKeyHint = current.maskedKeyHint ?? null;

    if (patch.clearApiKey) {
      encryptedApiKey = null;
      maskedKeyHint = null;
    } else if (typeof patch.apiKey === 'string' && patch.apiKey.trim().length > 0) {
      const cleanKey = patch.apiKey.trim();
      if (cleanKey.length < 6) {
        throw new AdminConfigError(400, 'API key appears too short to be valid.');
      }
      encryptedApiKey = encryptProviderSecret(cleanKey);
      maskedKeyHint = maskSecretHint(cleanKey);
    }

    let cleanBaseUrl = current.baseUrl ?? null;
    if (patch.baseUrl !== undefined) {
      const rawUrl = patch.baseUrl ? patch.baseUrl.trim() : '';
      if (!rawUrl) {
        cleanBaseUrl = null;
      } else {
        if (!/^https?:\/\//i.test(rawUrl)) {
          throw new AdminConfigError(400, 'Provider Base URL must start with http:// or https://.');
        }
        cleanBaseUrl = rawUrl.replace(/\/+$/, '');
      }
    }

    let cleanBackend = current.openweightBackend ?? null;
    if (patch.openweightBackend !== undefined) {
      cleanBackend =
        patch.openweightBackend && VALID_OPENWEIGHT_BACKENDS.has(patch.openweightBackend)
          ? patch.openweightBackend
          : null;
    }

    let cleanBudget = current.monthlyBudgetUsd ?? null;
    if (patch.monthlyBudgetUsd !== undefined) {
      cleanBudget =
        typeof patch.monthlyBudgetUsd === 'number' && Number.isFinite(patch.monthlyBudgetUsd)
          ? Math.max(0, Number(patch.monthlyBudgetUsd.toFixed(2)))
          : null;
    }

    const updatedState: StoredProviderState = {
      ...current,
      provider,
      enabled: patch.enabled !== undefined ? Boolean(patch.enabled) : current.enabled,
      encryptedApiKey,
      maskedKeyHint,
      baseUrl: cleanBaseUrl,
      openweightBackend: cleanBackend,
      monthlyBudgetUsd: cleanBudget,
      alertThresholdPct:
        patch.alertThresholdPct !== undefined
          ? Math.min(100, Math.max(10, Math.round(patch.alertThresholdPct)))
          : current.alertThresholdPct,
      updatedAt: new Date().toISOString(),
    };

    snap.providers[provider] = updatedState;
    snap.loadedAt = Date.now();

    if (shouldUseDatabase(options)) {
      await prisma.botProviderConfig.upsert({
        where: { provider },
        update: {
          enabled: updatedState.enabled,
          encryptedApiKey: updatedState.encryptedApiKey,
          maskedKeyHint: updatedState.maskedKeyHint,
          baseUrl: updatedState.baseUrl,
          openweightBackend: updatedState.openweightBackend,
          monthlyBudgetUsd: updatedState.monthlyBudgetUsd,
          alertThresholdPct: updatedState.alertThresholdPct,
        },
        create: {
          provider,
          enabled: updatedState.enabled,
          encryptedApiKey: updatedState.encryptedApiKey,
          maskedKeyHint: updatedState.maskedKeyHint,
          baseUrl: updatedState.baseUrl,
          openweightBackend: updatedState.openweightBackend,
          monthlyBudgetUsd: updatedState.monthlyBudgetUsd,
          alertThresholdPct: updatedState.alertThresholdPct,
        },
      });
    } else {
      await writeLocalSnapshot(snap, options);
    }

    if (!options?.storageDir && !options?.skipDatabase) {
      globalCache.__qbAdminConfigSnapshot = snap;
    }

    const list = await listSafeProviderConfigs(options);
    return list.find((p) => p.provider === provider)!;
  });
}

export async function recordProviderConnectivityCheck(
  provider: AIProvider,
  result: { success: boolean; latencyMs?: number; error?: string },
  options?: AdminConfigStoreOptions
): Promise<void> {
  if (!VALID_PROVIDER_SET.has(provider)) return;
  await enqueueConfigWrite(async () => {
    const snap = await ensureAdminConfigLoaded(options);
    const nowIso = new Date().toISOString();
    snap.providers[provider] = {
      ...(snap.providers[provider] || { provider, enabled: true, alertThresholdPct: 80 }),
      lastCheckedAt: nowIso,
      lastStatusOk: result.success,
      lastLatencyMs: result.latencyMs ?? null,
      lastError: result.success ? null : result.error || 'Verification failed',
      updatedAt: nowIso,
    };

    if (shouldUseDatabase(options)) {
      await prisma.botProviderConfig
        .upsert({
          where: { provider },
          update: {
            lastCheckedAt: new Date(nowIso),
            lastStatusOk: result.success,
            lastLatencyMs: result.latencyMs ?? null,
            lastError: result.success ? null : result.error || 'Verification failed',
          },
          create: {
            provider,
            enabled: snap.providers[provider].enabled,
            lastCheckedAt: new Date(nowIso),
            lastStatusOk: result.success,
            lastLatencyMs: result.latencyMs ?? null,
            lastError: result.success ? null : result.error || 'Verification failed',
          },
        })
        .catch(() => {});
    } else {
      await writeLocalSnapshot(snap, options);
    }

    if (!options?.storageDir && !options?.skipDatabase) {
      globalCache.__qbAdminConfigSnapshot = snap;
    }
  });
}

// ─── Model Catalog Management ────────────────────────────────────────────────

export function getEffectiveModelsFromSnapshot(snap: AdminConfigSnapshot): ModelDefinition[] {
  const mergedMap = new Map<string, ModelDefinition>();

  for (const builtIn of BUILT_IN_MODELS) {
    mergedMap.set(builtIn.id, {
      ...builtIn,
      enabled: builtIn.enabled !== false,
      isCustom: false,
      isDefault: builtIn.id === snap.defaultModelId,
    });
  }

  for (const [id, override] of Object.entries(snap.models)) {
    mergedMap.set(id, {
      id: override.id,
      name: override.name,
      provider: override.provider,
      modelIdentifier: override.modelIdentifier,
      description: override.description,
      capabilities: override.capabilities,
      contextWindow: override.contextWindow,
      maxOutputTokens: override.maxOutputTokens,
      pricing: override.pricing,
      family: override.family,
      recommendedFor: override.recommendedFor,
      enabled: override.enabled !== false,
      isDefault: id === snap.defaultModelId || Boolean(override.isDefault),
      isCustom: Boolean(override.isCustom),
    });
  }

  // Ensure exactly one default if default override exists
  const models = Array.from(mergedMap.values());
  const explicitDefault = models.find((m) => m.id === snap.defaultModelId && m.enabled !== false);
  const chosenDefaultId =
    explicitDefault?.id || models.find((m) => m.isDefault && m.enabled !== false)?.id || BUILT_IN_MODELS[0].id;

  return models.map((m) => ({
    ...m,
    isDefault: m.id === chosenDefaultId,
  }));
}

export async function upsertAdminModelConfig(
  input: {
    id: string;
    name: string;
    provider: AIProvider;
    modelIdentifier: string;
    description?: string;
    capabilities: ModelCapability[];
    contextWindow: number;
    maxOutputTokens: number;
    pricing?: { inputPerMillion: number; outputPerMillion: number };
    family?: string;
    recommendedFor?: string;
    enabled?: boolean;
    isDefault?: boolean;
  },
  options?: AdminConfigStoreOptions
): Promise<ModelDefinition> {
  const cleanId = (input.id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-');
  if (!cleanId || cleanId.length < 2 || cleanId.length > 64) {
    throw new AdminConfigError(400, 'Model ID must be 2–64 valid slug characters.');
  }
  if (!VALID_PROVIDER_SET.has(input.provider)) {
    throw new AdminConfigError(400, `Unsupported AI provider "${input.provider}".`);
  }
  if (!input.name || input.name.trim().length < 2) {
    throw new AdminConfigError(400, 'Model display name is required.');
  }
  if (!input.modelIdentifier || input.modelIdentifier.trim().length < 2) {
    throw new AdminConfigError(400, 'Provider model identifier is required.');
  }

  const capabilities = Array.isArray(input.capabilities)
    ? input.capabilities.filter((c) => VALID_CAPABILITY_SET.has(c))
    : ['streaming' as ModelCapability];
  if (capabilities.length === 0) {
    capabilities.push('streaming');
  }

  const contextWindow = Math.min(4_000_000, Math.max(1024, Math.round(Number(input.contextWindow || 32768))));
  const maxOutputTokens = Math.min(
    200_000,
    Math.max(256, Math.round(Number(input.maxOutputTokens || 4096)))
  );
  const inputPerMillion = Math.max(0, Number(input.pricing?.inputPerMillion ?? 0));
  const outputPerMillion = Math.max(0, Number(input.pricing?.outputPerMillion ?? 0));
  const isBuiltIn = BUILT_IN_MODELS.some((m) => m.id === cleanId);

  return enqueueConfigWrite(async () => {
    const snap = await ensureAdminConfigLoaded(options);
    const willBeDefault = Boolean(input.isDefault) || snap.defaultModelId === cleanId;

    if (willBeDefault && input.enabled === false) {
      throw new AdminConfigError(400, 'Cannot set a disabled model as the system default.');
    }

    if (willBeDefault) {
      for (const m of Object.values(snap.models)) {
        m.isDefault = false;
      }
      snap.defaultModelId = cleanId;
    }

    const record: PersistedModelOverride = {
      id: cleanId,
      name: input.name.trim().slice(0, 80),
      provider: input.provider,
      modelIdentifier: input.modelIdentifier.trim().slice(0, 120),
      description: (input.description || '').trim().slice(0, 400) || `${input.name.trim()} model`,
      capabilities,
      contextWindow,
      maxOutputTokens,
      pricing: { inputPerMillion, outputPerMillion },
      family: input.family?.trim().slice(0, 60) || undefined,
      recommendedFor: input.recommendedFor?.trim().slice(0, 120) || undefined,
      enabled: input.enabled !== false,
      isDefault: willBeDefault,
      isCustom: !isBuiltIn,
    };

    snap.models[cleanId] = record;
    snap.loadedAt = Date.now();

    if (shouldUseDatabase(options)) {
      if (willBeDefault) {
        await prisma.botModelConfig.updateMany({ data: { isDefault: false } }).catch(() => {});
      }
      await prisma.botModelConfig.upsert({
        where: { id: cleanId },
        update: {
          name: record.name,
          provider: record.provider,
          modelIdentifier: record.modelIdentifier,
          description: record.description,
          capabilitiesJson: JSON.stringify(record.capabilities),
          contextWindow: record.contextWindow,
          maxOutputTokens: record.maxOutputTokens,
          inputPerMillion: record.pricing.inputPerMillion,
          outputPerMillion: record.pricing.outputPerMillion,
          family: record.family ?? null,
          recommendedFor: record.recommendedFor ?? null,
          enabled: record.enabled,
          isDefault: record.isDefault,
          isCustom: record.isCustom,
        },
        create: {
          id: cleanId,
          name: record.name,
          provider: record.provider,
          modelIdentifier: record.modelIdentifier,
          description: record.description,
          capabilitiesJson: JSON.stringify(record.capabilities),
          contextWindow: record.contextWindow,
          maxOutputTokens: record.maxOutputTokens,
          inputPerMillion: record.pricing.inputPerMillion,
          outputPerMillion: record.pricing.outputPerMillion,
          family: record.family ?? null,
          recommendedFor: record.recommendedFor ?? null,
          enabled: record.enabled,
          isDefault: record.isDefault,
          isCustom: record.isCustom,
        },
      });
    } else {
      await writeLocalSnapshot(snap, options);
    }

    if (!options?.storageDir && !options?.skipDatabase) {
      globalCache.__qbAdminConfigSnapshot = snap;
    }

    return getEffectiveModelsFromSnapshot(snap).find((m) => m.id === cleanId)!;
  });
}

export async function setModelEnabledStatus(
  id: string,
  enabled: boolean,
  options?: AdminConfigStoreOptions
): Promise<ModelDefinition> {
  const snap = await ensureAdminConfigLoaded(options);
  const current = getEffectiveModelsFromSnapshot(snap).find((m) => m.id === id);
  if (!current) {
    throw new AdminConfigError(404, `Model "${id}" not found.`);
  }
  if (!enabled && current.isDefault) {
    throw new AdminConfigError(
      400,
      'Set another model as default before disabling the current default model.'
    );
  }
  return upsertAdminModelConfig(
    {
      ...current,
      enabled,
      isDefault: current.isDefault,
    },
    options
  );
}

export async function setDefaultAdminModel(
  id: string,
  options?: AdminConfigStoreOptions
): Promise<ModelDefinition> {
  const snap = await ensureAdminConfigLoaded(options);
  const current = getEffectiveModelsFromSnapshot(snap).find((m) => m.id === id);
  if (!current) {
    throw new AdminConfigError(404, `Model "${id}" not found.`);
  }
  if (current.enabled === false) {
    throw new AdminConfigError(400, 'Enable the model before making it the system default.');
  }
  return upsertAdminModelConfig(
    {
      ...current,
      enabled: true,
      isDefault: true,
    },
    options
  );
}

export async function deleteCustomAdminModel(
  id: string,
  options?: AdminConfigStoreOptions
): Promise<void> {
  if (BUILT_IN_MODELS.some((m) => m.id === id)) {
    throw new AdminConfigError(
      400,
      'Built-in catalog models cannot be permanently deleted; disable them instead.'
    );
  }

  await enqueueConfigWrite(async () => {
    const snap = await ensureAdminConfigLoaded(options);
    if (!snap.models[id]) {
      throw new AdminConfigError(404, `Custom model "${id}" not found.`);
    }
    if (snap.defaultModelId === id) {
      snap.defaultModelId = BUILT_IN_MODELS[0].id;
    }
    delete snap.models[id];
    snap.loadedAt = Date.now();

    if (shouldUseDatabase(options)) {
      await prisma.botModelConfig.delete({ where: { id } }).catch(() => {});
    } else {
      await writeLocalSnapshot(snap, options);
    }

    if (!options?.storageDir && !options?.skipDatabase) {
      globalCache.__qbAdminConfigSnapshot = snap;
    }
  });
}

// ─── Usage Limits Configuration ──────────────────────────────────────────────

export function sanitizeUsageLimits(raw: Partial<BotUsageLimitsConfig>): BotUsageLimitsConfig {
  const clampInt = (val: any, fallback: number, min: number, max: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, Math.round(n)));
  };
  const clampFloat = (val: any, fallback: number, min: number, max: number) => {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Number(Math.min(max, Math.max(min, n)).toFixed(2));
  };

  return {
    anonMessagesPerHour: clampInt(raw.anonMessagesPerHour, DEFAULT_USAGE_LIMITS.anonMessagesPerHour, 1, 10000),
    anonMessagesPerDay: clampInt(raw.anonMessagesPerDay, DEFAULT_USAGE_LIMITS.anonMessagesPerDay, 1, 50000),
    authMessagesPerHour: clampInt(raw.authMessagesPerHour, DEFAULT_USAGE_LIMITS.authMessagesPerHour, 1, 20000),
    authMessagesPerDay: clampInt(raw.authMessagesPerDay, DEFAULT_USAGE_LIMITS.authMessagesPerDay, 1, 100000),
    perUserRequestsPerMinute: clampInt(
      raw.perUserRequestsPerMinute,
      DEFAULT_USAGE_LIMITS.perUserRequestsPerMinute,
      1,
      1000
    ),
    maxMessageChars: clampInt(raw.maxMessageChars, DEFAULT_USAGE_LIMITS.maxMessageChars, 200, 200000),
    maxMessagesPerRequest: clampInt(
      raw.maxMessagesPerRequest,
      DEFAULT_USAGE_LIMITS.maxMessagesPerRequest,
      2,
      500
    ),
    maxAttachmentsPerMessage: clampInt(
      raw.maxAttachmentsPerMessage,
      DEFAULT_USAGE_LIMITS.maxAttachmentsPerMessage,
      0,
      25
    ),
    maxDocImageBytes: clampInt(
      raw.maxDocImageBytes,
      DEFAULT_USAGE_LIMITS.maxDocImageBytes,
      256 * 1024,
      50 * 1024 * 1024
    ),
    maxTextCodeBytes: clampInt(
      raw.maxTextCodeBytes,
      DEFAULT_USAGE_LIMITS.maxTextCodeBytes,
      64 * 1024,
      20 * 1024 * 1024
    ),
    dailySpendingAlertUsd: clampFloat(
      raw.dailySpendingAlertUsd,
      DEFAULT_USAGE_LIMITS.dailySpendingAlertUsd,
      0.01,
      100000
    ),
    monthlySpendingAlertUsd: clampFloat(
      raw.monthlySpendingAlertUsd,
      DEFAULT_USAGE_LIMITS.monthlySpendingAlertUsd,
      0.01,
      1000000
    ),
    enforceSpendingHardStop: Boolean(raw.enforceSpendingHardStop),
    updatedAt: raw.updatedAt,
  };
}

export function getEffectiveUsageLimits(options?: AdminConfigStoreOptions): BotUsageLimitsConfig {
  return getAdminConfigSnapshot(options).limits;
}

export async function updateUsageLimitsConfig(
  patch: Partial<BotUsageLimitsConfig>,
  options?: AdminConfigStoreOptions
): Promise<BotUsageLimitsConfig> {
  return enqueueConfigWrite(async () => {
    const snap = await ensureAdminConfigLoaded(options);
    const merged = sanitizeUsageLimits({
      ...snap.limits,
      ...patch,
      updatedAt: new Date().toISOString(),
    });
    snap.limits = merged;
    snap.loadedAt = Date.now();

    if (shouldUseDatabase(options)) {
      await prisma.botUsageLimits.upsert({
        where: { id: 'default' },
        update: {
          anonMessagesPerHour: merged.anonMessagesPerHour,
          anonMessagesPerDay: merged.anonMessagesPerDay,
          authMessagesPerHour: merged.authMessagesPerHour,
          authMessagesPerDay: merged.authMessagesPerDay,
          perUserRequestsPerMinute: merged.perUserRequestsPerMinute,
          maxMessageChars: merged.maxMessageChars,
          maxMessagesPerRequest: merged.maxMessagesPerRequest,
          maxAttachmentsPerMessage: merged.maxAttachmentsPerMessage,
          maxDocImageBytes: merged.maxDocImageBytes,
          maxTextCodeBytes: merged.maxTextCodeBytes,
          dailySpendingAlertUsd: merged.dailySpendingAlertUsd,
          monthlySpendingAlertUsd: merged.monthlySpendingAlertUsd,
          enforceSpendingHardStop: merged.enforceSpendingHardStop,
        },
        create: {
          id: 'default',
          anonMessagesPerHour: merged.anonMessagesPerHour,
          anonMessagesPerDay: merged.anonMessagesPerDay,
          authMessagesPerHour: merged.authMessagesPerHour,
          authMessagesPerDay: merged.authMessagesPerDay,
          perUserRequestsPerMinute: merged.perUserRequestsPerMinute,
          maxMessageChars: merged.maxMessageChars,
          maxMessagesPerRequest: merged.maxMessagesPerRequest,
          maxAttachmentsPerMessage: merged.maxAttachmentsPerMessage,
          maxDocImageBytes: merged.maxDocImageBytes,
          maxTextCodeBytes: merged.maxTextCodeBytes,
          dailySpendingAlertUsd: merged.dailySpendingAlertUsd,
          monthlySpendingAlertUsd: merged.monthlySpendingAlertUsd,
          enforceSpendingHardStop: merged.enforceSpendingHardStop,
        },
      });
    } else {
      await writeLocalSnapshot(snap, options);
    }

    if (!options?.storageDir && !options?.skipDatabase) {
      globalCache.__qbAdminConfigSnapshot = snap;
    }

    return merged;
  });
}
