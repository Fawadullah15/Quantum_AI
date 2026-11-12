'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAdminToast } from '@/components/admin/AdminToast';
import type {
  AIProvider,
  AdminBotUserSummary,
  BotAdminAnalytics,
  BotUsageLimitsConfig,
  BotUserStatus,
  ModelCapability,
  OpenWeightBackend,
  SafeProviderConfig,
} from '@/lib/bot/types';
import type { VerifiedModelEntry } from '@/lib/bot/models';

type AdminTab = 'analytics' | 'models' | 'limits' | 'users' | 'errors';

interface Props {
  initialProviders: SafeProviderConfig[];
  initialModels: VerifiedModelEntry[];
  initialLimits: BotUsageLimitsConfig;
  initialAnalytics: BotAdminAnalytics;
  initialUsers: AdminBotUserSummary[];
  canWrite: boolean;
}

const CAPABILITY_LABELS: Record<ModelCapability, string> = {
  vision: 'Vision',
  tools: 'Tool Use',
  streaming: 'Streaming',
  json: 'JSON Mode',
  code_execution: 'Code Exec',
  long_context: 'Long Context',
};

const ALL_CAPABILITIES: ModelCapability[] = [
  'vision',
  'tools',
  'streaming',
  'json',
  'code_execution',
  'long_context',
];

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(6, 21, 43, 0.78)',
  border: '1px solid rgba(22, 119, 255, 0.2)',
  borderRadius: 10,
  padding: '1.15rem 1.25rem',
  boxShadow: '0 8px 24px -6px rgba(0, 0, 0, 0.45)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.7rem',
  borderRadius: 6,
  border: '1px solid rgba(56, 189, 248, 0.25)',
  backgroundColor: 'rgba(3, 10, 22, 0.85)',
  color: '#F8FAFC',
  fontSize: '0.82rem',
  boxSizing: 'border-box',
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '0.48rem 0.9rem',
  borderRadius: 6,
  border: '1px solid #1677FF',
  backgroundColor: '#1677FF',
  color: '#FFFFFF',
  fontSize: '0.78rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  padding: '0.45rem 0.8rem',
  borderRadius: 6,
  border: '1px solid rgba(56, 189, 248, 0.3)',
  backgroundColor: 'rgba(56, 189, 248, 0.08)',
  color: '#38BDF8',
  fontSize: '0.76rem',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '0.42rem 0.75rem',
  borderRadius: 6,
  border: '1px solid rgba(239, 68, 68, 0.35)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  color: '#FCA5A5',
  fontSize: '0.74rem',
  fontWeight: 600,
  cursor: 'pointer',
};

function formatCurrency(usd: number): string {
  if (!usd) return '$0.00';
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Never';
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return String(iso);
  }
}

export function QuantumBotAdminClient({
  initialProviders,
  initialModels,
  initialLimits,
  initialAnalytics,
  initialUsers,
  canWrite,
}: Props) {
  const toast = useAdminToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('analytics');
  const [providers, setProviders] = useState<SafeProviderConfig[]>(initialProviders);
  const [models, setModels] = useState<VerifiedModelEntry[]>(initialModels);
  const [limits, setLimits] = useState<BotUsageLimitsConfig>(initialLimits);
  const [analytics, setAnalytics] = useState<BotAdminAnalytics>(initialAnalytics);
  const [users, setUsers] = useState<AdminBotUserSummary[]>(initialUsers);

  const [windowDays, setWindowDays] = useState<number>(initialAnalytics.windowDays || 14);
  const [refreshing, setRefreshing] = useState(false);

  // Provider draft state (keys are write-only; never populated from server)
  const [providerDrafts, setProviderDrafts] = useState<
    Record<
      AIProvider,
      {
        enabled: boolean;
        apiKeyInput: string;
        baseUrl: string;
        openweightBackend: OpenWeightBackend | '';
        monthlyBudgetUsd: string;
        alertThresholdPct: string;
      }
    >
  >(() => {
    const map: any = {};
    for (const p of initialProviders) {
      map[p.provider] = {
        enabled: p.enabled,
        apiKeyInput: '',
        baseUrl: p.baseUrl || '',
        openweightBackend: p.openweightBackend || '',
        monthlyBudgetUsd:
          typeof p.monthlyBudgetUsd === 'number' ? String(p.monthlyBudgetUsd) : '',
        alertThresholdPct: String(p.alertThresholdPct ?? 80),
      };
    }
    return map;
  });
  const [testingProvider, setTestingProvider] = useState<AIProvider | null>(null);
  const [savingProvider, setSavingProvider] = useState<AIProvider | null>(null);

  // Model editor form state
  const [showModelEditor, setShowModelEditor] = useState(false);
  const [modelForm, setModelForm] = useState<{
    id: string;
    name: string;
    provider: AIProvider;
    modelIdentifier: string;
    description: string;
    capabilities: ModelCapability[];
    contextWindow: string;
    maxOutputTokens: string;
    inputPerMillion: string;
    outputPerMillion: string;
    family: string;
    recommendedFor: string;
    enabled: boolean;
    isDefault: boolean;
  }>({
    id: '',
    name: '',
    provider: 'gemini',
    modelIdentifier: '',
    description: '',
    capabilities: ['streaming', 'tools'],
    contextWindow: '128000',
    maxOutputTokens: '8192',
    inputPerMillion: '0.2',
    outputPerMillion: '0.8',
    family: '',
    recommendedFor: '',
    enabled: true,
    isDefault: false,
  });
  const [savingModel, setSavingModel] = useState(false);
  const [savingLimits, setSavingLimits] = useState(false);

  // User search & governance draft
  const [userSearch, setUserSearch] = useState('');
  const [userLimitEdits, setUserLimitEdits] = useState<Record<string, string>>({});
  const [suspendReasonEdits, setSuspendReasonEdits] = useState<Record<string, string>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  const syncProviderDraftsFromSafe = useCallback((list: SafeProviderConfig[]) => {
    setProviderDrafts((prev) => {
      const next = { ...prev };
      for (const p of list) {
        next[p.provider] = {
          enabled: p.enabled,
          apiKeyInput: '',
          baseUrl: p.baseUrl || '',
          openweightBackend: p.openweightBackend || '',
          monthlyBudgetUsd:
            typeof p.monthlyBudgetUsd === 'number' ? String(p.monthlyBudgetUsd) : '',
          alertThresholdPct: String(p.alertThresholdPct ?? 80),
        };
      }
      return next;
    });
  }, []);

  const refreshAnalyticsAndUsers = useCallback(
    async (days = windowDays, query = userSearch) => {
      setRefreshing(true);
      try {
        const [aRes, uRes, cRes] = await Promise.all([
          fetch(`/api/admin/bot/analytics?days=${days}`, { cache: 'no-store' }),
          fetch(`/api/admin/bot/users?q=${encodeURIComponent(query)}`, { cache: 'no-store' }),
          fetch('/api/admin/bot/config', { cache: 'no-store' }),
        ]);

        if (aRes.ok) {
          const aData = await aRes.json();
          if (aData.analytics) setAnalytics(aData.analytics);
        }
        if (uRes.ok) {
          const uData = await uRes.json();
          if (Array.isArray(uData.users)) setUsers(uData.users);
        }
        if (cRes.ok) {
          const cData = await cRes.json();
          if (Array.isArray(cData.providers)) {
            setProviders(cData.providers);
            syncProviderDraftsFromSafe(cData.providers);
          }
          if (Array.isArray(cData.models)) setModels(cData.models);
          if (cData.limits) setLimits(cData.limits);
        }
      } catch {
        toast.error('Failed to refresh dashboard data.');
      } finally {
        setRefreshing(false);
      }
    },
    [windowDays, userSearch, syncProviderDraftsFromSafe, toast]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'users') {
        void (async () => {
          const res = await fetch(
            `/api/admin/bot/users?q=${encodeURIComponent(userSearch)}`,
            { cache: 'no-store' }
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.users)) setUsers(data.users);
          }
        })();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, activeTab]);

  // ─── Provider Handlers ──────────────────────────────────────────────────────

  const handleSaveProvider = async (
    providerId: AIProvider,
    opts?: { clearApiKey?: boolean; overrideEnabled?: boolean }
  ) => {
    if (!canWrite) {
      toast.error('Only SUPER_ADMIN or ADMIN accounts can modify provider configuration.');
      return;
    }
    const draft = providerDrafts[providerId];
    setSavingProvider(providerId);
    try {
      const payload: Record<string, any> = {
        provider: providerId,
        enabled: opts?.overrideEnabled !== undefined ? opts.overrideEnabled : draft.enabled,
        baseUrl: draft.baseUrl.trim() || null,
        openweightBackend:
          providerId === 'openweight' ? draft.openweightBackend || null : undefined,
        monthlyBudgetUsd:
          draft.monthlyBudgetUsd.trim() === '' ? null : Number(draft.monthlyBudgetUsd),
        alertThresholdPct: Number(draft.alertThresholdPct || 80),
      };
      if (opts?.clearApiKey) {
        payload.clearApiKey = true;
      } else if (draft.apiKeyInput.trim()) {
        payload.apiKey = draft.apiKeyInput.trim();
      }

      const res = await fetch('/api/admin/bot/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update provider.');
        return;
      }

      setProviders((prev) =>
        prev.map((p) => (p.provider === providerId ? data.provider : p))
      );
      setProviderDrafts((prev) => ({
        ...prev,
        [providerId]: {
          ...prev[providerId],
          enabled: data.provider.enabled,
          apiKeyInput: '', // Clear key field immediately so plaintext never lingers
        },
      }));
      if (Array.isArray(data.models)) setModels(data.models);
      toast.success(`Saved ${data.provider.name} configuration.`);
    } catch {
      toast.error('Network error updating provider configuration.');
    } finally {
      setSavingProvider(null);
    }
  };

  const handleTestConnectivity = async (providerId: AIProvider) => {
    if (!canWrite) {
      toast.error('Insufficient permissions to run provider connectivity checks.');
      return;
    }
    setTestingProvider(providerId);
    try {
      const res = await fetch('/api/admin/bot/models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();
      if (Array.isArray(data.providers)) setProviders(data.providers);
      if (Array.isArray(data.models)) setModels(data.models);
      if (data.success) {
        toast.success(`${providerId.toUpperCase()} verified (${data.latencyMs}ms).`);
      } else {
        toast.warning(data.error || `${providerId.toUpperCase()} connectivity check failed.`);
      }
    } catch {
      toast.error('Connectivity probe failed.');
    } finally {
      setTestingProvider(null);
    }
  };

  // ─── Model Handlers ─────────────────────────────────────────────────────────

  const openEditModel = (m: VerifiedModelEntry) => {
    setModelForm({
      id: m.id,
      name: m.name,
      provider: m.provider,
      modelIdentifier: m.modelIdentifier,
      description: m.description,
      capabilities: [...m.capabilities],
      contextWindow: String(m.contextWindow),
      maxOutputTokens: String(m.maxOutputTokens),
      inputPerMillion: String(m.pricing.inputPerMillion),
      outputPerMillion: String(m.pricing.outputPerMillion),
      family: m.family || '',
      recommendedFor: m.recommendedFor || '',
      enabled: m.enabled !== false,
      isDefault: Boolean(m.isDefault),
    });
    setShowModelEditor(true);
  };

  const openNewModel = () => {
    setModelForm({
      id: '',
      name: '',
      provider: 'gemini',
      modelIdentifier: '',
      description: '',
      capabilities: ['streaming', 'tools', 'long_context'],
      contextWindow: '128000',
      maxOutputTokens: '8192',
      inputPerMillion: '0.25',
      outputPerMillion: '1.00',
      family: '',
      recommendedFor: '',
      enabled: true,
      isDefault: false,
    });
    setShowModelEditor(true);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSavingModel(true);
    try {
      const res = await fetch('/api/admin/bot/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modelForm.id,
          name: modelForm.name,
          provider: modelForm.provider,
          modelIdentifier: modelForm.modelIdentifier,
          description: modelForm.description,
          capabilities: modelForm.capabilities,
          contextWindow: Number(modelForm.contextWindow),
          maxOutputTokens: Number(modelForm.maxOutputTokens),
          pricing: {
            inputPerMillion: Number(modelForm.inputPerMillion || 0),
            outputPerMillion: Number(modelForm.outputPerMillion || 0),
          },
          family: modelForm.family || undefined,
          recommendedFor: modelForm.recommendedFor || undefined,
          enabled: modelForm.enabled,
          isDefault: modelForm.isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save model configuration.');
        return;
      }
      if (Array.isArray(data.models)) setModels(data.models);
      setShowModelEditor(false);
      toast.success(`Model "${data.model?.name}" saved.`);
    } catch {
      toast.error('Network error saving model configuration.');
    } finally {
      setSavingModel(false);
    }
  };

  const handleToggleModel = async (m: VerifiedModelEntry, patch: { enabled?: boolean; isDefault?: boolean }) => {
    if (!canWrite) return;
    try {
      const res = await fetch('/api/admin/bot/models', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, ...patch }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update model.');
        return;
      }
      if (Array.isArray(data.models)) setModels(data.models);
      toast.success(
        patch.isDefault
          ? `Default model set to ${m.name}.`
          : `${m.name} ${patch.enabled ? 'enabled' : 'disabled'}.`
      );
    } catch {
      toast.error('Failed to update model.');
    }
  };

  const handleDeleteCustomModel = async (m: VerifiedModelEntry) => {
    if (!canWrite || !m.isCustom) return;
    try {
      const res = await fetch(`/api/admin/bot/models?id=${encodeURIComponent(m.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to delete model.');
        return;
      }
      if (Array.isArray(data.models)) setModels(data.models);
      toast.success(`Deleted custom model "${m.name}".`);
    } catch {
      toast.error('Failed to delete custom model.');
    }
  };

  // ─── Usage Limits Handler ───────────────────────────────────────────────────

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSavingLimits(true);
    try {
      const res = await fetch('/api/admin/bot/limits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(limits),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save limits.');
        return;
      }
      setLimits(data.limits);
      toast.success('Server-side usage limits & spending thresholds saved.');
    } catch {
      toast.error('Network error saving usage limits.');
    } finally {
      setSavingLimits(false);
    }
  };

  // ─── User Governance Handler ────────────────────────────────────────────────

  const handleUpdateUser = async (
    userId: string,
    patch: {
      status?: BotUserStatus;
      dailyMessageLimitOverride?: number | null;
      suspendedReason?: string | null;
    }
  ) => {
    if (!canWrite) return;
    setSavingUserId(userId);
    try {
      const res = await fetch(`/api/admin/bot/users/${encodeURIComponent(userId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update user access.');
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                status: data.user.status,
                dailyMessageLimitOverride: data.user.dailyMessageLimitOverride,
                suspendedReason: data.user.suspendedReason,
              }
            : u
        )
      );
      toast.success(`Updated access controls for ${data.user.email}.`);
    } catch {
      toast.error('Failed to update user governance.');
    } finally {
      setSavingUserId(null);
    }
  };

  const maxDailyMessages = Math.max(1, ...analytics.dailySeries.map((d) => d.messages));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', color: '#F8FAFC' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1rem',
          borderBottom: '1px solid rgba(22, 119, 255, 0.16)',
          paddingBottom: '1rem',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '0.68rem',
              letterSpacing: '0.18em',
              color: '#38BDF8',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginBottom: '0.25rem',
            }}
          >
            QUANTUMBOT // GOVERNANCE &amp; TELEMETRY
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0 0 0.3rem 0' }}>
            QuantumBot Administration
          </h1>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94A3B8' }}>
            Manage AI providers, models, real-time analytics, rate limits, spending alerts, and user access without exposing encrypted keys or private transcripts.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <select
            value={windowDays}
            onChange={(e) => {
              const next = Number(e.target.value);
              setWindowDays(next);
              void refreshAnalyticsAndUsers(next, userSearch);
            }}
            aria-label="Analytics window"
            style={{ ...inputStyle, width: 'auto', fontSize: '0.78rem' }}
          >
            <option value={7}>Last 7 Days</option>
            <option value={14}>Last 14 Days</option>
            <option value={30}>Last 30 Days</option>
          </select>
          <button
            type="button"
            onClick={() => void refreshAnalyticsAndUsers()}
            disabled={refreshing}
            style={btnSecondary}
          >
            {refreshing ? 'Refreshing...' : '↻ Refresh Data'}
          </button>
        </div>
      </div>

      {!canWrite && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            backgroundColor: 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            color: '#FDE68A',
            fontSize: '0.82rem',
          }}
        >
          Read-only access (`EDITOR`): you can review metrics and configurations, while changes to keys, models, limits, or user accounts require `ADMIN` or `SUPER_ADMIN`.
        </div>
      )}

      {/* Active Spending Alerts */}
      {analytics.spendingAlerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {analytics.spendingAlerts.map((alert, idx) => (
            <div
              key={`${alert.scope}-${idx}`}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: 8,
                backgroundColor:
                  alert.severity === 'critical'
                    ? 'rgba(239, 68, 68, 0.14)'
                    : 'rgba(245, 158, 11, 0.14)',
                border:
                  alert.severity === 'critical'
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(245, 158, 11, 0.4)',
                color: alert.severity === 'critical' ? '#FCA5A5' : '#FDE68A',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              ⚠️ {alert.message}
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {(
          [
            { id: 'analytics', label: '📊 Analytics & Usage' },
            { id: 'models', label: `🤖 Providers & Models (${models.length})` },
            { id: 'limits', label: '🛡️ Usage Limits & Budgets' },
            { id: 'users', label: `👥 Users (${users.length})` },
            { id: 'errors', label: `🚨 Errors & Rate Limits (${analytics.recentErrors.length})` },
          ] as Array<{ id: AdminTab; label: string }>
        ).map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.55rem 0.95rem',
                borderRadius: 8,
                border: active
                  ? '1px solid #38BDF8'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: active
                  ? 'rgba(56, 189, 248, 0.14)'
                  : 'rgba(6, 21, 43, 0.65)',
                color: active ? '#38BDF8' : '#CBD5E1',
                fontSize: '0.82rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: REAL ANALYTICS & USAGE ─── */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 6 KPI Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.9rem',
            }}
          >
            {[
              {
                label: 'Daily Active Users',
                value: String(analytics.dailyActiveUsersToday),
                sub: `${analytics.registeredUsersCount} registered accounts`,
                accent: '#38BDF8',
              },
              {
                label: 'Total Conversations',
                value: String(analytics.totalConversations),
                sub: 'Persisted sessions across users',
                accent: '#60A5FA',
              },
              {
                label: `Messages (${windowDays}d)`,
                value: String(analytics.messagesInWindow),
                sub: `${analytics.messagesToday} sent today`,
                accent: '#34D399',
              },
              {
                label: 'Avg Response Time',
                value:
                  analytics.averageResponseTimeMs !== null
                    ? `${analytics.averageResponseTimeMs} ms`
                    : 'No data',
                sub: `${analytics.totalTokensInWindow.toLocaleString()} tokens (${windowDays}d)`,
                accent: '#A78BFA',
              },
              {
                label: `Est. Cost (${windowDays}d)`,
                value: formatCurrency(analytics.estimatedCostWindowUsd),
                sub: `${formatCurrency(analytics.estimatedCostTodayUsd)} today · ${formatCurrency(analytics.estimatedCostMonthUsd)} MTD`,
                accent: '#FBBF24',
              },
              {
                label: 'Errors & Rate Limits',
                value: `${analytics.failedRequestsInWindow} / ${analytics.rateLimitEventsInWindow}`,
                sub: 'Failed requests / Throttled events',
                accent:
                  analytics.failedRequestsInWindow > 0 ? '#F87171' : '#94A3B8',
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  ...cardStyle,
                  borderLeft: `3px solid ${kpi.accent}`,
                }}
              >
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    textTransform: 'uppercase',
                    color: '#94A3B8',
                    letterSpacing: '0.06em',
                  }}
                >
                  {kpi.label}
                </div>
                <div style={{ fontSize: '1.65rem', fontWeight: 700, margin: '0.35rem 0 0.2rem' }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#94A3B8' }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Messages Per Day Real Telemetry Bar Chart */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.9rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>
                Messages &amp; Active Users Per Day (Real Recorded Events)
              </h2>
              <span style={{ fontSize: '0.74rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                UTC Daily Breakdown · Zero Estimated Traffic
              </span>
            </div>

            {analytics.messagesInWindow === 0 && analytics.failedRequestsInWindow === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                No QuantumBot requests recorded during the selected {windowDays}-day window yet. Counts will populate automatically as real traffic arrives.
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '0.45rem',
                  height: 150,
                  paddingTop: '1.25rem',
                  overflowX: 'auto',
                }}
              >
                {analytics.dailySeries.map((day) => {
                  const pct = Math.max(
                    day.messages > 0 ? 8 : 2,
                    Math.round((day.messages / maxDailyMessages) * 100)
                  );
                  return (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.messages} msgs, ${day.activeUsers} DAU, ${day.errors} errors, ${formatCurrency(day.estimatedCostUsd)}`}
                      style={{
                        flex: '1 1 28px',
                        minWidth: 28,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <span style={{ fontSize: '0.66rem', color: '#CBD5E1', fontFamily: 'var(--font-mono, monospace)' }}>
                        {day.messages > 0 ? day.messages : ''}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 26,
                          height: `${pct}%`,
                          borderRadius: '4px 4px 2px 2px',
                          background:
                            day.errors > 0
                              ? 'linear-gradient(180deg, #38BDF8 0%, #F87171 100%)'
                              : 'linear-gradient(180deg, #38BDF8 0%, #1677FF 100%)',
                        }}
                      />
                      <span style={{ fontSize: '0.62rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                        {day.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2-Column Model & Provider Usage Tables */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            <div style={cardStyle}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.8rem 0' }}>
                Most-Used Models
              </h2>
              {analytics.mostUsedModels.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.82rem' }}>
                  No model usage recorded in this window.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                    <thead>
                      <tr style={{ color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Model</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Reqs</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Tokens</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Cost</th>
                        <th style={{ padding: '0.45rem 0.35rem' }}>Latency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.mostUsedModels.map((m) => (
                        <tr key={m.modelId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '0.5rem 0.35rem' }}>
                            <div style={{ fontWeight: 600 }}>{m.modelName}</div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>{m.provider}</div>
                          </td>
                          <td style={{ padding: '0.5rem 0.35rem' }}>
                            {m.requests}
                            {m.errors > 0 && (
                              <span style={{ color: '#F87171', marginLeft: 4 }}>({m.errors} err)</span>
                            )}
                          </td>
                          <td style={{ padding: '0.5rem 0.35rem' }}>{m.totalTokens.toLocaleString()}</td>
                          <td style={{ padding: '0.5rem 0.35rem' }}>{formatCurrency(m.estimatedCostUsd)}</td>
                          <td style={{ padding: '0.5rem 0.35rem' }}>
                            {m.avgLatencyMs !== null ? `${m.avgLatencyMs}ms` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.8rem 0' }}>
                Provider Usage &amp; Monthly Budgets
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '0.45rem 0.35rem' }}>Provider</th>
                      <th style={{ padding: '0.45rem 0.35rem' }}>Reqs</th>
                      <th style={{ padding: '0.45rem 0.35rem' }}>Errors</th>
                      <th style={{ padding: '0.45rem 0.35rem' }}>Cost ({windowDays}d)</th>
                      <th style={{ padding: '0.45rem 0.35rem' }}>Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.providerUsage.map((p) => (
                      <tr key={p.provider} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '0.5rem 0.35rem', fontWeight: 600, textTransform: 'capitalize' }}>
                          {p.provider}
                        </td>
                        <td style={{ padding: '0.5rem 0.35rem' }}>{p.requests}</td>
                        <td style={{ padding: '0.5rem 0.35rem', color: p.errors > 0 ? '#F87171' : '#94A3B8' }}>
                          {p.errors}
                        </td>
                        <td style={{ padding: '0.5rem 0.35rem' }}>{formatCurrency(p.estimatedCostUsd)}</td>
                        <td style={{ padding: '0.5rem 0.35rem' }}>
                          {p.monthlyBudgetUsd !== null ? (
                            <span style={{ color: p.alertTriggered ? '#FCA5A5' : '#34D399' }}>
                              ${p.monthlyBudgetUsd.toFixed(2)}/mo
                            </span>
                          ) : (
                            <span style={{ color: '#64748B' }}>No limit</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: PROVIDERS & MODELS ─── */}
      {activeTab === 'models' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Provider Configuration Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1rem',
            }}
          >
            {providers.map((p) => {
              const draft = providerDrafts[p.provider];
              const isBusy = savingProvider === p.provider;
              const isTesting = testingProvider === p.provider;

              return (
                <div key={p.provider} style={cardStyle}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
                        {p.keySource === 'admin'
                          ? `Encrypted Admin Key: ${p.maskedKeyHint || '••••••••'}`
                          : p.keySource === 'env'
                            ? `Server Env Key: ${p.maskedKeyHint || 'Active'}`
                            : 'No API Key Configured'}
                      </div>
                    </div>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.76rem',
                        color: draft?.enabled ? '#34D399' : '#F87171',
                        cursor: canWrite ? 'pointer' : 'not-allowed',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={draft?.enabled ?? p.enabled}
                        disabled={!canWrite}
                        onChange={(e) =>
                          setProviderDrafts((prev) => ({
                            ...prev,
                            [p.provider]: { ...prev[p.provider], enabled: e.target.checked },
                          }))
                        }
                      />
                      {draft?.enabled ? 'Enabled' : 'Disabled'}
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                        Replace / Set API Key (write-only · never readable after saving)
                      </label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={draft?.apiKeyInput || ''}
                        disabled={!canWrite}
                        onChange={(e) =>
                          setProviderDrafts((prev) => ({
                            ...prev,
                            [p.provider]: { ...prev[p.provider], apiKeyInput: e.target.value },
                          }))
                        }
                        placeholder={
                          p.hasAdminKey
                            ? `Saved (${p.maskedKeyHint}) — enter new key to rotate`
                            : 'Paste provider API key...'
                        }
                        style={inputStyle}
                      />
                    </div>

                    {p.provider === 'openweight' && (
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                          Open-Weight Backend
                        </label>
                        <select
                          value={draft?.openweightBackend || ''}
                          disabled={!canWrite}
                          onChange={(e) =>
                            setProviderDrafts((prev) => ({
                              ...prev,
                              [p.provider]: {
                                ...prev[p.provider],
                                openweightBackend: e.target.value as OpenWeightBackend | '',
                              },
                            }))
                          }
                          style={inputStyle}
                        >
                          <option value="">Auto-detect from ENV</option>
                          <option value="groq">Groq</option>
                          <option value="openrouter">OpenRouter</option>
                          <option value="together">Together AI</option>
                          <option value="ollama">Ollama Local</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                        Custom Base URL (optional)
                      </label>
                      <input
                        type="url"
                        value={draft?.baseUrl || ''}
                        disabled={!canWrite}
                        onChange={(e) =>
                          setProviderDrafts((prev) => ({
                            ...prev,
                            [p.provider]: { ...prev[p.provider], baseUrl: e.target.value },
                          }))
                        }
                        placeholder="https://..."
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                          Monthly Budget (USD)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={draft?.monthlyBudgetUsd || ''}
                          disabled={!canWrite}
                          onChange={(e) =>
                            setProviderDrafts((prev) => ({
                              ...prev,
                              [p.provider]: { ...prev[p.provider], monthlyBudgetUsd: e.target.value },
                            }))
                          }
                          placeholder="Unlimited"
                          style={inputStyle}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                          Alert at Budget (%)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="100"
                          value={draft?.alertThresholdPct || '80'}
                          disabled={!canWrite}
                          onChange={(e) =>
                            setProviderDrafts((prev) => ({
                              ...prev,
                              [p.provider]: { ...prev[p.provider], alertThresholdPct: e.target.value },
                            }))
                          }
                          style={inputStyle}
                        />
                      </div>
                    </div>

                    {/* Connectivity Status Line */}
                    <div
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 6,
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        color:
                          p.lastStatusOk === true
                            ? '#34D399'
                            : p.lastStatusOk === false
                              ? '#FCA5A5'
                              : '#94A3B8',
                      }}
                    >
                      {p.lastCheckedAt ? (
                        <>
                          {p.lastStatusOk ? `✓ Connected (${p.lastLatencyMs}ms)` : `✕ ${p.lastError || 'Failed'}`}
                          {' · '}
                          {formatDateTime(p.lastCheckedAt)}
                        </>
                      ) : (
                        'Connectivity not yet tested'
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        disabled={!canWrite || isBusy}
                        onClick={() => void handleSaveProvider(p.provider)}
                        style={btnPrimary}
                      >
                        {isBusy ? 'Saving...' : 'Save Provider'}
                      </button>
                      <button
                        type="button"
                        disabled={!canWrite || isTesting}
                        onClick={() => void handleTestConnectivity(p.provider)}
                        style={btnSecondary}
                      >
                        {isTesting ? 'Checking...' : 'Check Connectivity'}
                      </button>
                      {p.hasAdminKey && (
                        <button
                          type="button"
                          disabled={!canWrite || isBusy}
                          onClick={() => void handleSaveProvider(p.provider, { clearApiKey: true })}
                          style={btnDanger}
                        >
                          Clear Key
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Catalog & Add/Edit Form */}
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                  Model Registry &amp; Capabilities
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#94A3B8' }}>
                  Enable or disable models, designate the active default, customize pricing/capabilities, or register custom provider models.
                </p>
              </div>
              {canWrite && (
                <button type="button" onClick={openNewModel} style={btnPrimary}>
                  + Add Model Configuration
                </button>
              )}
            </div>

            {showModelEditor && (
              <form
                onSubmit={handleSaveModel}
                style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  borderRadius: 8,
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  backgroundColor: 'rgba(3, 10, 22, 0.75)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38BDF8' }}>
                  {modelForm.id ? `Configure Model: ${modelForm.id}` : 'Add Custom Model Configuration'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Model ID Slug *
                    </label>
                    <input
                      required
                      value={modelForm.id}
                      onChange={(e) => setModelForm((f) => ({ ...f, id: e.target.value }))}
                      placeholder="e.g. gpt-4.1"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Display Name *
                    </label>
                    <input
                      required
                      value={modelForm.name}
                      onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. GPT-4.1"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Provider *
                    </label>
                    <select
                      value={modelForm.provider}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, provider: e.target.value as AIProvider }))
                      }
                      style={inputStyle}
                    >
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="openweight">Open-Weight</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Provider Model Identifier *
                    </label>
                    <input
                      required
                      value={modelForm.modelIdentifier}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, modelIdentifier: e.target.value }))
                      }
                      placeholder="e.g. gpt-4.1-2025-04-14"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Context Window (tokens)
                    </label>
                    <input
                      type="number"
                      min="1024"
                      value={modelForm.contextWindow}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, contextWindow: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Max Output Tokens
                    </label>
                    <input
                      type="number"
                      min="256"
                      value={modelForm.maxOutputTokens}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, maxOutputTokens: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Input Cost ($/1M tokens)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={modelForm.inputPerMillion}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, inputPerMillion: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                      Output Cost ($/1M tokens)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0"
                      value={modelForm.outputPerMillion}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, outputPerMillion: e.target.value }))
                      }
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 3 }}>
                    Description
                  </label>
                  <input
                    value={modelForm.description}
                    onChange={(e) => setModelForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Concise summary of strengths..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: 6 }}>
                    Supported Capabilities
                  </label>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    {ALL_CAPABILITIES.map((cap) => {
                      const checked = modelForm.capabilities.includes(cap);
                      return (
                        <label
                          key={cap}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.78rem',
                            padding: '0.28rem 0.6rem',
                            borderRadius: 6,
                            border: checked
                              ? '1px solid #38BDF8'
                              : '1px solid rgba(255,255,255,0.12)',
                            backgroundColor: checked
                              ? 'rgba(56, 189, 248, 0.12)'
                              : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setModelForm((f) => ({
                                ...f,
                                capabilities: e.target.checked
                                  ? [...f.capabilities, cap]
                                  : f.capabilities.filter((c) => c !== cap),
                              }));
                            }}
                          />
                          {CAPABILITY_LABELS[cap]}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={modelForm.enabled}
                      onChange={(e) => setModelForm((f) => ({ ...f, enabled: e.target.checked }))}
                    />
                    Enabled
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                    <input
                      type="checkbox"
                      checked={modelForm.isDefault}
                      onChange={(e) =>
                        setModelForm((f) => ({ ...f, isDefault: e.target.checked }))
                      }
                    />
                    Set as System Default
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" disabled={savingModel} style={btnPrimary}>
                    {savingModel ? 'Saving...' : 'Save Model'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModelEditor(false)}
                    style={btnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Model</th>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Provider / ID</th>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Capabilities</th>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Pricing ($/1M)</th>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Status</th>
                    <th style={{ padding: '0.55rem 0.45rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => (
                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '0.6rem 0.45rem' }}>
                        <div style={{ fontWeight: 600 }}>
                          {m.name}{' '}
                          {m.isCustom && (
                            <span
                              style={{
                                fontSize: '0.64rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: 4,
                                backgroundColor: 'rgba(167, 139, 250, 0.16)',
                                color: '#C4B5FD',
                              }}
                            >
                              CUSTOM
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.69rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                          {m.id} · {(m.contextWindow / 1000).toFixed(0)}k ctx
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.45rem' }}>
                        <div style={{ textTransform: 'capitalize' }}>{m.provider}</div>
                        <div style={{ fontSize: '0.69rem', color: '#94A3B8', fontFamily: 'var(--font-mono, monospace)' }}>
                          {m.modelIdentifier}
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.45rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {m.capabilities.map((cap) => (
                            <span
                              key={cap}
                              style={{
                                fontSize: '0.66rem',
                                padding: '0.12rem 0.4rem',
                                borderRadius: 4,
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                color: '#BAE6FD',
                              }}
                            >
                              {CAPABILITY_LABELS[cap]}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '0.6rem 0.45rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        ${m.pricing.inputPerMillion} / ${m.pricing.outputPerMillion}
                      </td>
                      <td style={{ padding: '0.6rem 0.45rem' }}>
                        {m.isDefault && (
                          <span
                            style={{
                              fontSize: '0.66rem',
                              padding: '0.14rem 0.45rem',
                              borderRadius: 4,
                              backgroundColor: 'rgba(56, 189, 248, 0.18)',
                              color: '#38BDF8',
                              fontWeight: 700,
                              marginRight: 4,
                            }}
                          >
                            DEFAULT
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: '0.68rem',
                            color: m.isAvailable ? '#34D399' : '#FCA5A5',
                          }}
                        >
                          {m.enabled === false
                            ? 'Disabled'
                            : m.isAvailable
                              ? 'Active'
                              : m.unavailabilityReason || 'Unconfigured'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.45rem' }}>
                        {canWrite && (
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {!m.isDefault && m.enabled !== false && (
                              <button
                                type="button"
                                onClick={() => void handleToggleModel(m, { isDefault: true })}
                                style={btnSecondary}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                void handleToggleModel(m, { enabled: m.enabled === false })
                              }
                              style={m.enabled === false ? btnPrimary : btnSecondary}
                            >
                              {m.enabled === false ? 'Enable' : 'Disable'}
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModel(m)}
                              style={btnSecondary}
                            >
                              Edit
                            </button>
                            {m.isCustom && (
                              <button
                                type="button"
                                onClick={() => void handleDeleteCustomModel(m)}
                                style={btnDanger}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: USAGE LIMITS & SPENDING CONTROLS ─── */}
      {activeTab === 'limits' && (
        <form onSubmit={handleSaveLimits} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.85rem 0' }}>
              Server-Side Rate Limits &amp; Message Quotas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Anonymous Visitor Messages / Hour
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canWrite}
                  value={limits.anonMessagesPerHour}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, anonMessagesPerHour: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Anonymous Visitor Messages / Day
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canWrite}
                  value={limits.anonMessagesPerDay}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, anonMessagesPerDay: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Authenticated User Messages / Hour
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canWrite}
                  value={limits.authMessagesPerHour}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, authMessagesPerHour: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Authenticated User Messages / Day
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canWrite}
                  value={limits.authMessagesPerDay}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, authMessagesPerDay: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Per-User Requests / Minute (RPM)
                </label>
                <input
                  type="number"
                  min="1"
                  disabled={!canWrite}
                  value={limits.perUserRequestsPerMinute}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      perUserRequestsPerMinute: Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.85rem 0' }}>
              Request Payload &amp; File Upload Limits
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Max Characters per User Message
                </label>
                <input
                  type="number"
                  min="200"
                  disabled={!canWrite}
                  value={limits.maxMessageChars}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, maxMessageChars: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Max Conversation Turns per Request
                </label>
                <input
                  type="number"
                  min="2"
                  disabled={!canWrite}
                  value={limits.maxMessagesPerRequest}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, maxMessagesPerRequest: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Max Attachments per Message
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={!canWrite}
                  value={limits.maxAttachmentsPerMessage}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      maxAttachmentsPerMessage: Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Max PDF / Office / Image Upload (bytes)
                </label>
                <input
                  type="number"
                  min="262144"
                  disabled={!canWrite}
                  value={limits.maxDocImageBytes}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, maxDocImageBytes: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>
                  {(limits.maxDocImageBytes / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Max Text / CSV / Code Upload (bytes)
                </label>
                <input
                  type="number"
                  min="65536"
                  disabled={!canWrite}
                  value={limits.maxTextCodeBytes}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, maxTextCodeBytes: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginTop: 2 }}>
                  {(limits.maxTextCodeBytes / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.85rem 0' }}>
              Provider &amp; Global Spending Alerts
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Daily Spending Alert Threshold (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={!canWrite}
                  value={limits.dailySpendingAlertUsd}
                  onChange={(e) =>
                    setLimits((l) => ({ ...l, dailySpendingAlertUsd: Number(e.target.value) }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'block', marginBottom: 4 }}>
                  Monthly Spending Alert Threshold (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  disabled={!canWrite}
                  value={limits.monthlySpendingAlertUsd}
                  onChange={(e) =>
                    setLimits((l) => ({
                      ...l,
                      monthlySpendingAlertUsd: Number(e.target.value),
                    }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input
                type="checkbox"
                disabled={!canWrite}
                checked={limits.enforceSpendingHardStop}
                onChange={(e) =>
                  setLimits((l) => ({ ...l, enforceSpendingHardStop: e.target.checked }))
                }
              />
              Enforce automatic server-side hard stop when daily, monthly, or provider budget is exceeded
            </label>

            <div>
              {canWrite && (
                <button type="submit" disabled={savingLimits} style={btnPrimary}>
                  {savingLimits ? 'Saving Limits...' : 'Save Usage Limits & Spending Controls'}
                </button>
              )}
            </div>
          </div>
        </form>
      )}

      {/* ─── TAB 4: REGISTERED USERS (PRIVACY-RESPECTING) ─── */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div
            style={{
              padding: '0.8rem 1rem',
              borderRadius: 8,
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              color: '#BAE6FD',
              fontSize: '0.8rem',
            }}
          >
            🔒 <strong>Privacy Guarantee:</strong> Administrators inspect account status, custom limits, and aggregate token/message counters only. Private conversation titles, prompts, responses, and files are never exposed here.
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '0.9rem',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>
                Registered QuantumBot Accounts ({users.length})
              </h2>
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email, or user ID..."
                style={{ ...inputStyle, maxWidth: 280 }}
              />
            </div>

            {users.length === 0 ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                No registered QuantumBot user accounts found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '0.5rem 0.45rem' }}>User</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Status</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Usage Summary</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Daily Msg Override</th>
                      <th style={{ padding: '0.5rem 0.45rem' }}>Access Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const limitDraft =
                        userLimitEdits[u.id] !== undefined
                          ? userLimitEdits[u.id]
                          : u.dailyMessageLimitOverride !== null
                            ? String(u.dailyMessageLimitOverride)
                            : '';
                      const reasonDraft =
                        suspendReasonEdits[u.id] !== undefined
                          ? suspendReasonEdits[u.id]
                          : u.suspendedReason || '';
                      const busy = savingUserId === u.id;

                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <div style={{ fontWeight: 600 }}>{u.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{u.email}</div>
                            <div style={{ fontSize: '0.66rem', color: '#64748B', fontFamily: 'var(--font-mono, monospace)' }}>
                              Joined {formatDateTime(u.createdAt)}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '0.16rem 0.48rem',
                                borderRadius: 4,
                                backgroundColor:
                                  u.status === 'ACTIVE'
                                    ? 'rgba(52, 211, 153, 0.14)'
                                    : u.status === 'LIMITED'
                                      ? 'rgba(251, 191, 36, 0.14)'
                                      : 'rgba(239, 68, 68, 0.15)',
                                color:
                                  u.status === 'ACTIVE'
                                    ? '#34D399'
                                    : u.status === 'LIMITED'
                                      ? '#FBBF24'
                                      : '#FCA5A5',
                              }}
                            >
                              {u.status}
                            </span>
                            {u.suspendedReason && (
                              <div style={{ fontSize: '0.68rem', color: '#FCA5A5', marginTop: 3 }}>
                                {u.suspendedReason}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <div>
                              {u.messagesToday} today · {u.messagesTotal} msgs (30d)
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                              {u.conversationCount} chats · {u.tokensTotal.toLocaleString()} tok ·{' '}
                              {formatCurrency(u.estimatedCostUsd)}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                              <input
                                type="number"
                                min="0"
                                disabled={!canWrite || busy}
                                value={limitDraft}
                                onChange={(e) =>
                                  setUserLimitEdits((prev) => ({
                                    ...prev,
                                    [u.id]: e.target.value,
                                  }))
                                }
                                placeholder={`Default (${limits.authMessagesPerDay})`}
                                style={{ ...inputStyle, width: 110, padding: '0.32rem 0.45rem' }}
                              />
                              {canWrite && (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() =>
                                    void handleUpdateUser(u.id, {
                                      dailyMessageLimitOverride:
                                        limitDraft.trim() === '' ? null : Number(limitDraft),
                                    })
                                  }
                                  style={btnSecondary}
                                >
                                  Set
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '0.6rem 0.45rem' }}>
                            {canWrite && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  {u.status !== 'ACTIVE' && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() =>
                                        void handleUpdateUser(u.id, {
                                          status: 'ACTIVE',
                                          suspendedReason: null,
                                        })
                                      }
                                      style={btnSecondary}
                                    >
                                      Restore Active
                                    </button>
                                  )}
                                  {u.status !== 'LIMITED' && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() =>
                                        void handleUpdateUser(u.id, { status: 'LIMITED' })
                                      }
                                      style={btnSecondary}
                                    >
                                      Throttle 50%
                                    </button>
                                  )}
                                  {u.status !== 'SUSPENDED' && (
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() =>
                                        void handleUpdateUser(u.id, {
                                          status: 'SUSPENDED',
                                          suspendedReason:
                                            reasonDraft.trim() || 'Suspended by administrator',
                                        })
                                      }
                                      style={btnDanger}
                                    >
                                      Suspend
                                    </button>
                                  )}
                                </div>
                                {u.status !== 'SUSPENDED' && (
                                  <input
                                    value={reasonDraft}
                                    onChange={(e) =>
                                      setSuspendReasonEdits((prev) => ({
                                        ...prev,
                                        [u.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Optional note / suspension reason"
                                    style={{ ...inputStyle, padding: '0.28rem 0.45rem', fontSize: '0.72rem' }}
                                  />
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 5: MODEL ERRORS & RATE LIMITS ─── */}
      {activeTab === 'errors' && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: '0 0 0.85rem 0' }}>
            Recent Model Errors, Rate-Limit Events &amp; Blocked Uploads
          </h2>
          {analytics.recentErrors.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
              No provider errors, quota blocks, or rate-limit events recorded in this window.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                <thead>
                  <tr style={{ color: '#94A3B8', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '0.45rem 0.35rem' }}>Time</th>
                    <th style={{ padding: '0.45rem 0.35rem' }}>Event</th>
                    <th style={{ padding: '0.45rem 0.35rem' }}>Model / Provider</th>
                    <th style={{ padding: '0.45rem 0.35rem' }}>HTTP</th>
                    <th style={{ padding: '0.45rem 0.35rem' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recentErrors.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '0.5rem 0.35rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono, monospace)' }}>
                        {formatDateTime(ev.createdAt)}
                      </td>
                      <td style={{ padding: '0.5rem 0.35rem' }}>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '0.14rem 0.42rem',
                            borderRadius: 4,
                            backgroundColor:
                              ev.eventType === 'chat_error'
                                ? 'rgba(239, 68, 68, 0.16)'
                                : 'rgba(251, 191, 36, 0.16)',
                            color: ev.eventType === 'chat_error' ? '#FCA5A5' : '#FDE68A',
                          }}
                        >
                          {ev.eventType}
                        </span>
                      </td>
                      <td style={{ padding: '0.5rem 0.35rem' }}>
                        {ev.modelId || '—'} {ev.provider ? `(${ev.provider})` : ''}
                      </td>
                      <td style={{ padding: '0.5rem 0.35rem', fontFamily: 'var(--font-mono, monospace)' }}>
                        {ev.statusCode ?? '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.35rem', color: '#CBD5E1' }}>
                        {ev.errorMessage || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
