import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import prisma from '@/lib/db';
import {
  ALL_PROVIDERS,
  AdminConfigStoreOptions,
  ensureAdminConfigLoaded,
  getEffectiveModelsFromSnapshot,
  listSafeProviderConfigs,
} from './admin-config';
import { BotAuthStoreOptions, listBotUsersForGovernance } from './auth';
import {
  ConversationStoreOptions,
  getConversationAggregateCounts,
} from './conversation-store';
import {
  isBotDatabaseInCooldown,
  markBotDatabaseUnavailable,
  resolveWritableStorageDirSync,
} from './storage-dir';
import {
  AIProvider,
  AdminBotUserSummary,
  AuthActor,
  BotAdminAnalytics,
  BotMessage,
  BotUsageEventRecord,
  BotUsageEventType,
  BotUsageLimitsConfig,
  DailyAnalyticsPoint,
  ModelDefinition,
  ModelUsageSummary,
  ProviderUsageSummary,
  SpendingAlertItem,
  TokenUsage,
} from './types';

export interface UsageTrackerOptions {
  storageDir?: string;
  skipDatabase?: boolean;
}

let eventWriteChain = Promise.resolve();
function enqueueEventWrite<T>(fn: () => Promise<T>): Promise<T> {
  const next = eventWriteChain.then(fn, fn);
  eventWriteChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

function shouldUseDatabase(options?: UsageTrackerOptions): boolean {
  return (
    !options?.skipDatabase &&
    !options?.storageDir &&
    Boolean(process.env.DATABASE_URL) &&
    !isBotDatabaseInCooldown()
  );
}

function getEventsFilePath(options?: UsageTrackerOptions): string {
  const dir = options?.storageDir || resolveWritableStorageDirSync('bot_admin');
  return path.join(dir, 'usage_events.jsonl');
}

function toConfigOpts(options?: UsageTrackerOptions): AdminConfigStoreOptions | undefined {
  if (!options) return undefined;
  return {
    storageDir: options.storageDir,
    skipDatabase: options.skipDatabase,
  };
}

function toAuthOpts(options?: UsageTrackerOptions): BotAuthStoreOptions | undefined {
  if (!options) return undefined;
  return {
    storageDir: options.storageDir ? path.join(options.storageDir, 'users') : undefined,
    skipDatabase: options.skipDatabase,
  };
}

function toConvOpts(options?: UsageTrackerOptions): ConversationStoreOptions | undefined {
  if (!options) return undefined;
  return {
    storageDir: options.storageDir ? path.join(options.storageDir, 'conversations') : undefined,
    skipDatabase: options.skipDatabase,
  };
}

export function hashActorId(ownerId: string): string {
  const salt =
    process.env.BOT_FILE_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'quantumbot-telemetry-salt-v1';
  return crypto
    .createHmac('sha256', salt)
    .update(ownerId || 'anonymous')
    .digest('hex')
    .slice(0, 24);
}

export function estimateModelCostUsd(
  model: Pick<ModelDefinition, 'pricing'>,
  usage?: TokenUsage | null
): number {
  if (!usage) return 0;
  const prompt = Math.max(0, Number(usage.promptTokens || 0));
  const completion = Math.max(0, Number(usage.completionTokens || 0));
  if (prompt === 0 && completion === 0) return 0;

  const inputCost = (prompt / 1_000_000) * Math.max(0, model.pricing?.inputPerMillion || 0);
  const outputCost = (completion / 1_000_000) * Math.max(0, model.pricing?.outputPerMillion || 0);
  return Number((inputCost + outputCost).toFixed(6));
}

export interface RecordUsageEventInput {
  eventType: BotUsageEventType;
  ownerId: string;
  botUserId?: string | null;
  authType: 'anonymous' | 'bot_account' | 'admin_session';
  conversationId?: string | null;
  modelId?: string | null;
  provider?: string | null;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: number;
  latencyMs?: number | null;
  statusCode?: number | null;
  errorMessage?: string | null;
  createdAt?: string;
}

export async function recordBotUsageEvent(
  input: RecordUsageEventInput,
  options?: UsageTrackerOptions
): Promise<BotUsageEventRecord> {
  const createdAt = input.createdAt || new Date().toISOString();
  const promptTokens = Math.max(0, Math.round(Number(input.promptTokens || 0)));
  const completionTokens = Math.max(0, Math.round(Number(input.completionTokens || 0)));
  const totalTokens = Math.max(
    promptTokens + completionTokens,
    Math.round(Number(input.totalTokens || 0))
  );
  const estimatedCostUsd = Math.max(0, Number((input.estimatedCostUsd || 0).toFixed(6)));
  const cleanError = input.errorMessage ? String(input.errorMessage).slice(0, 320) : null;
  const actorHash = hashActorId(input.ownerId);

  if (shouldUseDatabase(options)) {
    try {
      const created = await prisma.botUsageEvent.create({
        data: {
          createdAt: new Date(createdAt),
          eventType: input.eventType,
          actorHash,
          botUserId: input.botUserId ?? null,
          authType: input.authType,
          conversationId: input.conversationId ?? null,
          modelId: input.modelId ?? null,
          provider: input.provider ?? null,
          promptTokens,
          completionTokens,
          totalTokens,
          estimatedCostUsd,
          latencyMs: input.latencyMs ?? null,
          statusCode: input.statusCode ?? null,
          errorMessage: cleanError,
        },
      });
      return {
        id: created.id,
        createdAt: created.createdAt.toISOString(),
        eventType: created.eventType as BotUsageEventType,
        actorHash: created.actorHash,
        botUserId: created.botUserId,
        authType: created.authType as AuthActor['authType'],
        conversationId: created.conversationId,
        modelId: created.modelId,
        provider: created.provider,
        promptTokens: created.promptTokens,
        completionTokens: created.completionTokens,
        totalTokens: created.totalTokens,
        estimatedCostUsd: created.estimatedCostUsd,
        latencyMs: created.latencyMs,
        statusCode: created.statusCode,
        errorMessage: created.errorMessage,
      };
    } catch {
      markBotDatabaseUnavailable();
      // Fall back to local log on transient DB errors so requests aren't broken
    }
  }

  const record: BotUsageEventRecord = {
    id: `qbe_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
    createdAt,
    eventType: input.eventType,
    actorHash,
    botUserId: input.botUserId ?? null,
    authType: input.authType,
    conversationId: input.conversationId ?? null,
    modelId: input.modelId ?? null,
    provider: input.provider ?? null,
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd,
    latencyMs: input.latencyMs ?? null,
    statusCode: input.statusCode ?? null,
    errorMessage: cleanError,
  };

  await enqueueEventWrite(async () => {
    try {
      const filePath = getEventsFilePath(options);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, `${JSON.stringify(record)}\n`, 'utf8');
    } catch {
      // Telemetry write must never break core chat/file flows
    }
  });

  return record;
}

export async function readUsageEventsSince(
  sinceDate: Date,
  options?: UsageTrackerOptions
): Promise<BotUsageEventRecord[]> {
  if (shouldUseDatabase(options)) {
    try {
      const rows = await prisma.botUsageEvent.findMany({
        where: { createdAt: { gte: sinceDate } },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt.toISOString(),
        eventType: r.eventType as BotUsageEventType,
        actorHash: r.actorHash,
        botUserId: r.botUserId,
        authType: r.authType as AuthActor['authType'],
        conversationId: r.conversationId,
        modelId: r.modelId,
        provider: r.provider,
        promptTokens: r.promptTokens,
        completionTokens: r.completionTokens,
        totalTokens: r.totalTokens,
        estimatedCostUsd: r.estimatedCostUsd,
        latencyMs: r.latencyMs,
        statusCode: r.statusCode,
        errorMessage: r.errorMessage,
      }));
    } catch {
      markBotDatabaseUnavailable();
      // Fallback below
    }
  }

  const filePath = getEventsFilePath(options);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const cutoffMs = sinceDate.getTime();
    const lines = raw.split('\n');
    const results: BotUsageEventRecord[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const parsed = JSON.parse(trimmed) as BotUsageEventRecord;
        const ts = new Date(parsed.createdAt).getTime();
        if (Number.isFinite(ts) && ts >= cutoffMs) {
          results.push(parsed);
        }
      } catch {
        // Ignore corrupt single line
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

// ─── Server-Side Enforcement of Limits, Quotas & Spending Controls ───────────

export interface UsageLimitCheckResult {
  allowed: boolean;
  statusCode?: number;
  reason?: string;
  retryAfterSeconds?: number;
}

export async function checkChatUsageLimits(params: {
  actor: AuthActor;
  messages: BotMessage[];
  model: ModelDefinition;
  limits?: BotUsageLimitsConfig;
  conversationId?: string;
  options?: UsageTrackerOptions;
}): Promise<UsageLimitCheckResult> {
  const { actor, messages, model, conversationId, options } = params;
  const cfgOpts = toConfigOpts(options);
  const snap = await ensureAdminConfigLoaded(cfgOpts);
  const limits = params.limits || snap.limits;

  const botUserId = actor.authType === 'bot_account' && actor.user ? actor.user.id : null;
  const actorHash = hashActorId(actor.ownerId);

  const logBlock = async (
    eventType: BotUsageEventType,
    statusCode: number,
    reason: string
  ): Promise<UsageLimitCheckResult> => {
    await recordBotUsageEvent(
      {
        eventType,
        ownerId: actor.ownerId || 'anonymous',
        botUserId,
        authType: actor.authType,
        conversationId,
        modelId: model.id,
        provider: model.provider,
        statusCode,
        errorMessage: reason,
      },
      options
    ).catch(() => {});
    return {
      allowed: false,
      statusCode,
      reason,
      retryAfterSeconds: statusCode === 429 ? 60 : undefined,
    };
  };

  // 1. Account Suspension Enforcement
  if (actor.user?.status === 'SUSPENDED') {
    return logBlock(
      'limit_exceeded',
      403,
      actor.user.suspendedReason ||
        'Your QuantumBot account has been suspended by an administrator.'
    );
  }

  // 2. Request Size Limits (message count, latest prompt length, attachment count)
  if (messages.length > limits.maxMessagesPerRequest) {
    return logBlock(
      'limit_exceeded',
      413,
      `Conversation payload exceeds the server limit of ${limits.maxMessagesPerRequest} messages per request. Please start a new chat.`
    );
  }

  const latestUserMsg =
    [...messages].reverse().find((m) => m.role === 'user') || messages[messages.length - 1];
  const promptChars = (latestUserMsg?.content || '').length;
  if (promptChars > limits.maxMessageChars) {
    return logBlock(
      'limit_exceeded',
      413,
      `Message length (${promptChars.toLocaleString()} chars) exceeds the configured limit of ${limits.maxMessageChars.toLocaleString()} characters.`
    );
  }

  const attachmentCount = latestUserMsg?.attachments?.length || 0;
  if (attachmentCount > limits.maxAttachmentsPerMessage) {
    return logBlock(
      'limit_exceeded',
      400,
      `Too many attachments (${attachmentCount}). Maximum allowed per message is ${limits.maxAttachmentsPerMessage}.`
    );
  }

  // 3. Time-window Quota, RPM Rate-Limit & Spending Cap Checks
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  const eventsThisMonth = await readUsageEventsSince(startOfMonth, options);

  // Filter actor's real chat attempts (`chat_success` + `chat_error` or active calls)
  const actorChatEventsDay = eventsThisMonth.filter(
    (e) =>
      e.actorHash === actorHash &&
      e.eventType === 'chat_success' &&
      new Date(e.createdAt).getTime() >= startOfDay.getTime()
  );
  const actorChatEventsHour = actorChatEventsDay.filter(
    (e) => new Date(e.createdAt).getTime() >= oneHourAgo.getTime()
  );
  const actorRequestsLastMinute = eventsThisMonth.filter(
    (e) =>
      e.actorHash === actorHash &&
      (e.eventType === 'chat_success' || e.eventType === 'chat_error') &&
      new Date(e.createdAt).getTime() >= oneMinuteAgo.getTime()
  );

  const isLimitedAccount = actor.user?.status === 'LIMITED';
  const effectiveRpm = isLimitedAccount
    ? Math.max(1, Math.floor(limits.perUserRequestsPerMinute / 2))
    : limits.perUserRequestsPerMinute;

  if (actorRequestsLastMinute.length >= effectiveRpm) {
    return logBlock(
      'rate_limit',
      429,
      `Per-user rate limit reached (${effectiveRpm} requests/minute). Please wait a moment before sending another message.`
    );
  }

  const baseHourLimit = actor.isAuthenticated ? limits.authMessagesPerHour : limits.anonMessagesPerHour;
  const baseDayLimit = actor.isAuthenticated ? limits.authMessagesPerDay : limits.anonMessagesPerDay;

  const effectiveHourLimit = isLimitedAccount
    ? Math.max(1, Math.floor(baseHourLimit / 2))
    : baseHourLimit;

  const userOverride = actor.user?.dailyMessageLimitOverride;
  const effectiveDayLimit =
    typeof userOverride === 'number' && Number.isFinite(userOverride)
      ? Math.max(0, userOverride)
      : isLimitedAccount
        ? Math.max(1, Math.floor(baseDayLimit / 2))
        : baseDayLimit;

  if (actorChatEventsDay.length >= effectiveDayLimit) {
    return logBlock(
      'limit_exceeded',
      429,
      actor.isAuthenticated
        ? `Daily message quota reached (${effectiveDayLimit} messages/day).`
        : `Guest daily limit reached (${effectiveDayLimit} messages/day). Sign in or create a free account for higher limits.`
    );
  }

  if (actorChatEventsHour.length >= effectiveHourLimit) {
    return logBlock(
      'rate_limit',
      429,
      actor.isAuthenticated
        ? `Hourly message quota reached (${effectiveHourLimit} messages/hour).`
        : `Guest hourly limit reached (${effectiveHourLimit} messages/hour). Sign in for higher limits.`
    );
  }

  // 4. Optional Spending Hard Stop Enforcement
  if (limits.enforceSpendingHardStop) {
    let daySpendUsd = 0;
    let monthSpendUsd = 0;
    let providerMonthSpendUsd = 0;

    for (const ev of eventsThisMonth) {
      if (ev.estimatedCostUsd <= 0) continue;
      monthSpendUsd += ev.estimatedCostUsd;
      if (new Date(ev.createdAt).getTime() >= startOfDay.getTime()) {
        daySpendUsd += ev.estimatedCostUsd;
      }
      if (ev.provider === model.provider) {
        providerMonthSpendUsd += ev.estimatedCostUsd;
      }
    }

    if (daySpendUsd >= limits.dailySpendingAlertUsd) {
      return logBlock(
        'spending_alert',
        429,
        `Service paused: daily operating spending ceiling (\$${limits.dailySpendingAlertUsd.toFixed(2)}) reached.`
      );
    }

    if (monthSpendUsd >= limits.monthlySpendingAlertUsd) {
      return logBlock(
        'spending_alert',
        429,
        `Service paused: monthly operating spending ceiling (\$${limits.monthlySpendingAlertUsd.toFixed(2)}) reached.`
      );
    }

    const providerState = snap.providers[model.provider];
    if (
      typeof providerState?.monthlyBudgetUsd === 'number' &&
      providerState.monthlyBudgetUsd > 0 &&
      providerMonthSpendUsd >= providerState.monthlyBudgetUsd
    ) {
      return logBlock(
        'spending_alert',
        429,
        `Provider "${model.provider}" paused: monthly provider budget (\$${providerState.monthlyBudgetUsd.toFixed(2)}) reached.`
      );
    }
  }

  return { allowed: true };
}

// ─── Real Analytics Aggregator (Zero Fabricated Metrics) ─────────────────────

function formatUtcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getBotAdminAnalytics(
  windowDays = 14,
  options?: UsageTrackerOptions
): Promise<BotAdminAnalytics> {
  const safeWindowDays = Math.min(90, Math.max(1, Math.round(windowDays)));
  const cfgOpts = toConfigOpts(options);
  const snap = await ensureAdminConfigLoaded(cfgOpts);
  const modelCatalog = getEffectiveModelsFromSnapshot(snap);
  const modelMap = new Map(modelCatalog.map((m) => [m.id, m]));

  const now = new Date();
  const todayKey = formatUtcDay(now);
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const startOfWindow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (safeWindowDays - 1))
  );
  const earliestNeeded = startOfMonth < startOfWindow ? startOfMonth : startOfWindow;

  const [events, convCounts, users, safeProviders] = await Promise.all([
    readUsageEventsSince(earliestNeeded, options),
    getConversationAggregateCounts(toConvOpts(options)),
    listBotUsersForGovernance(toAuthOpts(options)),
    listSafeProviderConfigs(cfgOpts),
  ]);

  const dauTodaySet = new Set<string>();
  let messagesToday = 0;
  let messagesInWindow = 0;
  let totalTokensToday = 0;
  let totalTokensInWindow = 0;
  let estimatedCostTodayUsd = 0;
  let estimatedCostMonthUsd = 0;
  let estimatedCostWindowUsd = 0;
  let latencySumMs = 0;
  let latencyCount = 0;
  let failedRequestsInWindow = 0;
  let rateLimitEventsInWindow = 0;

  const dayBuckets = new Map<
    string,
    {
      messages: number;
      actorSet: Set<string>;
      tokens: number;
      estimatedCostUsd: number;
      errors: number;
      rateLimits: number;
    }
  >();

  for (let i = safeWindowDays - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    dayBuckets.set(formatUtcDay(d), {
      messages: 0,
      actorSet: new Set(),
      tokens: 0,
      estimatedCostUsd: 0,
      errors: 0,
      rateLimits: 0,
    });
  }

  const modelStats = new Map<
    string,
    {
      requests: number;
      errors: number;
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
      estimatedCostUsd: number;
      latencySum: number;
      latencyCount: number;
      provider: string;
    }
  >();

  const providerMonthStats = new Map<
    AIProvider,
    { requests: number; errors: number; totalTokens: number; monthCostUsd: number; windowCostUsd: number }
  >();
  for (const p of ALL_PROVIDERS) {
    providerMonthStats.set(p.id, {
      requests: 0,
      errors: 0,
      totalTokens: 0,
      monthCostUsd: 0,
      windowCostUsd: 0,
    });
  }

  for (const ev of events) {
    const evDate = new Date(ev.createdAt);
    const inMonth = evDate >= startOfMonth;
    const inWindow = evDate >= startOfWindow;
    const evDay = formatUtcDay(evDate);
    const isToday = evDay === todayKey;

    if (inMonth && ev.eventType === 'chat_success') {
      estimatedCostMonthUsd += ev.estimatedCostUsd || 0;
    }

    if (inMonth && ev.provider && providerMonthStats.has(ev.provider as AIProvider)) {
      const pStat = providerMonthStats.get(ev.provider as AIProvider)!;
      if (ev.eventType === 'chat_success') {
        pStat.monthCostUsd += ev.estimatedCostUsd || 0;
      }
    }

    if (!inWindow) continue;

    if (isToday && (ev.eventType === 'chat_success' || ev.eventType === 'chat_error' || ev.eventType === 'file_upload')) {
      dauTodaySet.add(ev.actorHash);
    }

    const bucket = dayBuckets.get(evDay);
    if (bucket) {
      if (ev.eventType === 'chat_success' || ev.eventType === 'chat_error' || ev.eventType === 'file_upload') {
        bucket.actorSet.add(ev.actorHash);
      }
      if (ev.eventType === 'chat_success') {
        bucket.messages++;
        bucket.tokens += ev.totalTokens || 0;
        bucket.estimatedCostUsd += ev.estimatedCostUsd || 0;
      } else if (ev.eventType === 'chat_error') {
        bucket.errors++;
      } else if (ev.eventType === 'rate_limit' || ev.eventType === 'limit_exceeded') {
        bucket.rateLimits++;
      }
    }

    if (ev.eventType === 'chat_success') {
      messagesInWindow++;
      totalTokensInWindow += ev.totalTokens || 0;
      estimatedCostWindowUsd += ev.estimatedCostUsd || 0;
      if (typeof ev.latencyMs === 'number' && ev.latencyMs >= 0) {
        latencySumMs += ev.latencyMs;
        latencyCount++;
      }
      if (isToday) {
        messagesToday++;
        totalTokensToday += ev.totalTokens || 0;
        estimatedCostTodayUsd += ev.estimatedCostUsd || 0;
      }
    } else if (ev.eventType === 'chat_error') {
      failedRequestsInWindow++;
    } else if (ev.eventType === 'rate_limit' || ev.eventType === 'limit_exceeded') {
      rateLimitEventsInWindow++;
    }

    // Aggregate per-model
    if (ev.modelId && (ev.eventType === 'chat_success' || ev.eventType === 'chat_error')) {
      const current = modelStats.get(ev.modelId) || {
        requests: 0,
        errors: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        latencySum: 0,
        latencyCount: 0,
        provider: ev.provider || modelMap.get(ev.modelId)?.provider || 'unknown',
      };
      if (ev.eventType === 'chat_success') {
        current.requests++;
        current.promptTokens += ev.promptTokens || 0;
        current.completionTokens += ev.completionTokens || 0;
        current.totalTokens += ev.totalTokens || 0;
        current.estimatedCostUsd += ev.estimatedCostUsd || 0;
        if (typeof ev.latencyMs === 'number') {
          current.latencySum += ev.latencyMs;
          current.latencyCount++;
        }
      } else {
        current.errors++;
      }
      modelStats.set(ev.modelId, current);
    }

    // Aggregate per-provider in window
    if (ev.provider && providerMonthStats.has(ev.provider as AIProvider)) {
      const pStat = providerMonthStats.get(ev.provider as AIProvider)!;
      if (ev.eventType === 'chat_success') {
        pStat.requests++;
        pStat.totalTokens += ev.totalTokens || 0;
        pStat.windowCostUsd += ev.estimatedCostUsd || 0;
      } else if (ev.eventType === 'chat_error') {
        pStat.errors++;
      }
    }
  }

  const dailySeries: DailyAnalyticsPoint[] = Array.from(dayBuckets.entries()).map(
    ([date, b]) => ({
      date,
      messages: b.messages,
      activeUsers: b.actorSet.size,
      tokens: b.tokens,
      estimatedCostUsd: Number(b.estimatedCostUsd.toFixed(6)),
      errors: b.errors,
      rateLimits: b.rateLimits,
    })
  );

  const mostUsedModels: ModelUsageSummary[] = Array.from(modelStats.entries())
    .map(([modelId, stat]) => ({
      modelId,
      modelName: modelMap.get(modelId)?.name || modelId,
      provider: stat.provider,
      requests: stat.requests,
      errors: stat.errors,
      promptTokens: stat.promptTokens,
      completionTokens: stat.completionTokens,
      totalTokens: stat.totalTokens,
      estimatedCostUsd: Number(stat.estimatedCostUsd.toFixed(6)),
      avgLatencyMs:
        stat.latencyCount > 0 ? Math.round(stat.latencySum / stat.latencyCount) : null,
    }))
    .sort((a, b) => b.requests - a.requests || b.errors - a.errors);

  const spendingAlerts: SpendingAlertItem[] = [];

  if (estimatedCostTodayUsd >= snap.limits.dailySpendingAlertUsd * 0.8) {
    const exceeded = estimatedCostTodayUsd >= snap.limits.dailySpendingAlertUsd;
    spendingAlerts.push({
      scope: 'daily',
      severity: exceeded ? 'critical' : 'warning',
      currentUsd: Number(estimatedCostTodayUsd.toFixed(4)),
      thresholdUsd: snap.limits.dailySpendingAlertUsd,
      message: exceeded
        ? `Daily spending (\$${estimatedCostTodayUsd.toFixed(4)}) exceeded alert threshold of \$${snap.limits.dailySpendingAlertUsd.toFixed(2)}.`
        : `Daily spending (\$${estimatedCostTodayUsd.toFixed(4)}) reached >=80% of daily threshold (\$${snap.limits.dailySpendingAlertUsd.toFixed(2)}).`,
    });
  }

  if (estimatedCostMonthUsd >= snap.limits.monthlySpendingAlertUsd * 0.8) {
    const exceeded = estimatedCostMonthUsd >= snap.limits.monthlySpendingAlertUsd;
    spendingAlerts.push({
      scope: 'monthly',
      severity: exceeded ? 'critical' : 'warning',
      currentUsd: Number(estimatedCostMonthUsd.toFixed(4)),
      thresholdUsd: snap.limits.monthlySpendingAlertUsd,
      message: exceeded
        ? `Monthly spending (\$${estimatedCostMonthUsd.toFixed(4)}) exceeded alert threshold of \$${snap.limits.monthlySpendingAlertUsd.toFixed(2)}.`
        : `Monthly spending (\$${estimatedCostMonthUsd.toFixed(4)}) reached >=80% of monthly threshold (\$${snap.limits.monthlySpendingAlertUsd.toFixed(2)}).`,
    });
  }

  const providerUsage: ProviderUsageSummary[] = ALL_PROVIDERS.map(({ id }) => {
    const stat = providerMonthStats.get(id)!;
    const pCfg = safeProviders.find((p) => p.provider === id);
    const budget = pCfg?.monthlyBudgetUsd ?? null;
    const pct = pCfg?.alertThresholdPct ?? 80;
    const alertTriggered =
      typeof budget === 'number' && budget > 0 && stat.monthCostUsd >= budget * (pct / 100);

    if (alertTriggered && typeof budget === 'number') {
      const exceeded = stat.monthCostUsd >= budget;
      spendingAlerts.push({
        scope: 'provider',
        severity: exceeded ? 'critical' : 'warning',
        provider: id,
        currentUsd: Number(stat.monthCostUsd.toFixed(4)),
        thresholdUsd: budget,
        message: exceeded
          ? `Provider "${pCfg?.name || id}" reached monthly budget (\$${stat.monthCostUsd.toFixed(4)} / \$${budget.toFixed(2)}).`
          : `Provider "${pCfg?.name || id}" reached ${pct}% of monthly budget (\$${stat.monthCostUsd.toFixed(4)} / \$${budget.toFixed(2)}).`,
      });
    }

    return {
      provider: id,
      requests: stat.requests,
      errors: stat.errors,
      totalTokens: stat.totalTokens,
      estimatedCostUsd: Number(stat.windowCostUsd.toFixed(6)),
      monthlyBudgetUsd: budget,
      alertTriggered,
    };
  });

  const recentErrors = events
    .filter(
      (e) =>
        e.eventType === 'chat_error' ||
        e.eventType === 'rate_limit' ||
        e.eventType === 'limit_exceeded' ||
        e.eventType === 'file_rejected' ||
        e.eventType === 'spending_alert'
    )
    .slice(0, 30);

  return {
    windowDays: safeWindowDays,
    dailyActiveUsersToday: dauTodaySet.size,
    totalConversations: convCounts.totalConversations,
    registeredUsersCount: users.length,
    suspendedUsersCount: users.filter((u) => u.status === 'SUSPENDED').length,
    messagesToday,
    messagesInWindow,
    totalTokensToday,
    totalTokensInWindow,
    estimatedCostTodayUsd: Number(estimatedCostTodayUsd.toFixed(6)),
    estimatedCostMonthUsd: Number(estimatedCostMonthUsd.toFixed(6)),
    estimatedCostWindowUsd: Number(estimatedCostWindowUsd.toFixed(6)),
    averageResponseTimeMs: latencyCount > 0 ? Math.round(latencySumMs / latencyCount) : null,
    failedRequestsInWindow,
    rateLimitEventsInWindow,
    dailySeries,
    mostUsedModels,
    providerUsage,
    spendingAlerts,
    recentErrors,
  };
}

/**
 * Lists registered QuantumBot users with STRICTLY aggregate usage counts.
 * Private conversation transcripts and prompt contents are NEVER returned.
 */
export async function listAdminUsersWithUsage(
  searchQuery?: string,
  options?: UsageTrackerOptions
): Promise<AdminBotUserSummary[]> {
  const now = new Date();
  const todayKey = formatUtcDay(now);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [users, convCounts, events] = await Promise.all([
    listBotUsersForGovernance(toAuthOpts(options)),
    getConversationAggregateCounts(toConvOpts(options)),
    readUsageEventsSince(thirtyDaysAgo, options),
  ]);

  const userMetrics = new Map<
    string,
    {
      messagesToday: number;
      messagesTotal: number;
      tokensTotal: number;
      estimatedCostUsd: number;
      lastActiveAt: string | null;
    }
  >();

  for (const ev of events) {
    if (!ev.botUserId) continue;
    const stat = userMetrics.get(ev.botUserId) || {
      messagesToday: 0,
      messagesTotal: 0,
      tokensTotal: 0,
      estimatedCostUsd: 0,
      lastActiveAt: null,
    };

    if (ev.eventType === 'chat_success') {
      stat.messagesTotal++;
      stat.tokensTotal += ev.totalTokens || 0;
      stat.estimatedCostUsd += ev.estimatedCostUsd || 0;
      if (formatUtcDay(new Date(ev.createdAt)) === todayKey) {
        stat.messagesToday++;
      }
    }

    if (!stat.lastActiveAt || new Date(ev.createdAt) > new Date(stat.lastActiveAt)) {
      stat.lastActiveAt = ev.createdAt;
    }

    userMetrics.set(ev.botUserId, stat);
  }

  const q = (searchQuery || '').trim().toLowerCase();

  return users
    .filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
      );
    })
    .map((u) => {
      const m = userMetrics.get(u.id);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        status: u.status,
        dailyMessageLimitOverride: u.dailyMessageLimitOverride,
        suspendedReason: u.suspendedReason,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        conversationCount: convCounts.byBotUserId[u.id] || 0,
        messagesToday: m?.messagesToday || 0,
        messagesTotal: m?.messagesTotal || 0,
        tokensTotal: m?.tokensTotal || 0,
        estimatedCostUsd: Number((m?.estimatedCostUsd || 0).toFixed(6)),
        lastActiveAt: m?.lastActiveAt || null,
      };
    });
}
