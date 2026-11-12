'use client';

import React, { useState, useEffect } from 'react';
import {
  ModelDefinition,
  PublicBotUser,
  ResponseStyle,
  UserPreferences,
} from '@/lib/bot/types';

export type SettingsTab = 'engine' | 'personalization' | 'account' | 'privacy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
  models: ModelDefinition[];
  currentModelId: string;
  onSelectModel: (id: string) => void;
  // Phase 7 Auth, Personalization & Privacy props
  authUser?: PublicBotUser | null;
  authType?: 'bot_account' | 'admin_session' | 'anonymous';
  isAuthenticated?: boolean;
  preferences?: UserPreferences;
  onSavePreferences?: (patch: Partial<UserPreferences>) => Promise<UserPreferences | null>;
  onClearAllConversations?: () => Promise<void> | void;
  onOpenAuthModal?: (mode?: 'login' | 'register') => void;
  onSignOut?: (allDevices?: boolean) => Promise<void> | void;
  onAccountDeleted?: () => Promise<void> | void;
}

const RESPONSE_STYLE_OPTIONS: Array<{ value: ResponseStyle; label: string; hint: string }> = [
  { value: 'balanced', label: 'Balanced', hint: 'Clear explanation + practical detail' },
  { value: 'concise', label: 'Concise', hint: 'Direct, brief, bulleted answers' },
  { value: 'detailed', label: 'Detailed', hint: 'Thorough walkthroughs & edge cases' },
  { value: 'technical', label: 'Technical / Engineering', hint: 'Idiomatic code & precise architecture' },
  { value: 'beginner_friendly', label: 'Beginner-Friendly', hint: 'Step-by-step plain language' },
];

const LANGUAGE_OPTIONS = [
  'English',
  'Urdu',
  'Arabic',
  'Spanish',
  'French',
  'German',
  'Chinese',
  'Hindi',
];

export function SettingsModal({
  isOpen,
  onClose,
  initialTab = 'engine',
  models,
  currentModelId,
  onSelectModel,
  authUser,
  authType = 'anonymous',
  isAuthenticated = false,
  preferences,
  onSavePreferences,
  onClearAllConversations,
  onOpenAuthModal,
  onSignOut,
  onAccountDeleted,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    latencyMs?: number;
    error?: string;
  } | null>(null);
  const [kbStats, setKbStats] = useState<{ verifiedDocuments: number; indexVersion: number } | null>(
    null
  );

  // Personalization draft state
  const [displayName, setDisplayName] = useState('');
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('balanced');
  const [language, setLanguage] = useState('English');
  const [customInstructions, setCustomInstructions] = useState('');
  const [defaultWebSearch, setDefaultWebSearch] = useState(false);
  const [enterToSend, setEnterToSend] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsNotice, setPrefsNotice] = useState<string | null>(null);

  // Privacy & account deletion states
  const [privacyNotice, setPrivacyNotice] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setTestResult(null);
      setPrefsNotice(null);
      setPrivacyNotice(null);
      setShowDeleteAccountConfirm(false);
      setDeletePassword('');

      if (preferences) {
        setDisplayName(preferences.displayName || '');
        setResponseStyle(preferences.responseStyle || 'balanced');
        setLanguage(preferences.language || 'English');
        setCustomInstructions(preferences.customInstructions || '');
        setDefaultWebSearch(Boolean(preferences.defaultWebSearch));
        setEnterToSend(preferences.enterToSend !== false);
      }

      fetch('/api/bot/knowledge')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.stats) {
            setKbStats({
              verifiedDocuments: data.stats.verifiedDocuments ?? 0,
              indexVersion: data.stats.indexVersion ?? 1,
            });
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialTab, preferences]);

  if (!isOpen) return null;

  const handleTestConnection = async (id: string) => {
    setTestingModelId(id);
    setTestResult(null);
    try {
      const res = await fetch('/api/bot/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId: id }),
      });
      const data = await res.json();
      setTestResult({
        id,
        success: !!data.success,
        latencyMs: data.latencyMs,
        error: data.error,
      });
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        error: err?.message || 'Connection test failed.',
      });
    } finally {
      setTestingModelId(null);
    }
  };

  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSavePreferences) return;
    setSavingPrefs(true);
    setPrefsNotice(null);
    try {
      const updated = await onSavePreferences({
        displayName: displayName.trim(),
        responseStyle,
        language: language.trim() || 'English',
        customInstructions: customInstructions.trim(),
        defaultModelId: currentModelId,
        defaultWebSearch,
        enterToSend,
      });
      if (updated) {
        setPrefsNotice('Personalization preferences saved.');
      } else {
        setPrefsNotice('Failed to save preferences.');
      }
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleClearConversations = async () => {
    if (
      confirm(
        'Are you sure you want to permanently delete all your saved conversations? This cannot be undone.'
      )
    ) {
      if (onClearAllConversations) {
        await onClearAllConversations();
      }
      setPrivacyNotice('All saved conversations for your session have been deleted.');
    }
  };

  const handleDeleteUploadedFiles = async () => {
    const res = await fetch('/api/bot/privacy/files', { method: 'DELETE' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setPrivacyNotice(
        `Deleted ${data?.deletedFiles ?? 0} uploaded file(s) from private storage.`
      );
    } else {
      setPrivacyNotice(data?.error || 'Could not delete uploaded files.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeletingAccount(true);
    setPrivacyNotice(null);
    try {
      const res = await fetch('/api/bot/auth/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPrivacyNotice(data?.error || 'Account deletion failed.');
        return;
      }
      setShowDeleteAccountConfirm(false);
      setDeletePassword('');
      if (onAccountDeleted) {
        await onAccountDeleted();
      }
      onClose();
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="QuantumBot Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none"
    >
      <div className="w-full max-w-xl rounded-2xl bg-[#090E1D] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 bg-[#0c1326]">
          <h2 className="text-sm font-semibold text-white font-mono tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            QuantumBot Settings &amp; Account
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50"
            aria-label="Close settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-4 border-b border-gray-800/80 bg-[#070b16] text-[11px] font-mono">
          {(
            [
              ['engine', 'Engine'],
              ['personalization', 'Personalize'],
              ['account', 'Account'],
              ['privacy', 'Privacy'],
            ] as Array<[SettingsTab, string]>
          ).map(([tabKey, label]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              className={`py-2.5 text-center transition-colors border-b-2 ${
                activeTab === tabKey
                  ? 'border-cyan-400 text-cyan-300 bg-[#0c1326]/60 font-semibold'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs text-gray-300 max-h-[68vh] overflow-y-auto">
          {activeTab === 'engine' && (
            <>
              <div className="space-y-2">
                <label className="block text-gray-200 font-medium font-mono uppercase tracking-wider text-[11px]">
                  Active Model Architecture
                </label>
                <select
                  value={currentModelId}
                  onChange={(e) => onSelectModel(e.target.value)}
                  className="w-full bg-[#060A14] text-white border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  {models.map((m) => (
                    <option
                      key={m.id}
                      value={m.id}
                      disabled={m.isAvailable === false}
                      className="bg-[#060A14] text-white"
                    >
                      {m.name} ({m.family || m.provider}) · {m.capabilities.includes('vision') ? 'Vision + Docs' : 'Text + Docs'} · {m.contextWindow >= 1000000 ? '1M' : `${(m.contextWindow / 1000).toFixed(0)}k`} ctx{m.isAvailable === false ? ' [Key Required]' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-gray-500 text-[11px]">
                  Switches the inference backbone powering QuantumBot queries.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-gray-200 font-medium font-mono uppercase tracking-wider text-[11px]">
                  Provider Gateway Diagnostics
                </label>
                <div className="divide-y divide-gray-800/50 border border-gray-800/80 rounded-xl bg-[#060A14] overflow-hidden">
                  {models.slice(0, 4).map((m) => {
                    const isTesting = testingModelId === m.id;
                    const result = testResult?.id === m.id ? testResult : null;

                    return (
                      <div key={m.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-white flex items-center gap-1.5">
                            {m.name}
                            <span className="text-[10px] font-mono text-gray-500 uppercase">
                              ({m.provider})
                            </span>
                          </div>
                          {result && (
                            <div
                              className={`text-[10px] mt-0.5 font-mono ${
                                result.success ? 'text-emerald-400' : 'text-amber-400'
                              }`}
                            >
                              {result.success
                                ? `Connected (${result.latencyMs}ms)`
                                : result.error || 'Connection unverified'}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={() => handleTestConnection(m.id)}
                          className="px-2.5 py-1 text-[11px] font-mono rounded bg-gray-800/80 hover:bg-cyan-950/40 hover:text-cyan-300 text-gray-300 transition-colors border border-gray-700/60 disabled:opacity-50"
                        >
                          {isTesting ? 'Testing...' : 'Ping API'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-800/60">
                <label className="block text-gray-200 font-medium font-mono uppercase tracking-wider text-[11px]">
                  QuantumBot Identity &amp; Knowledge Base
                </label>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  QuantumBot is an AI assistant by Quantum AI. General-purpose queries run freely on your selected model; verified company context activates when you ask about Quantum AI.
                </p>
                {kbStats && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#060A14] border border-cyan-500/20 text-[10px] font-mono text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {kbStats.verifiedDocuments} verified company sources indexed (v{kbStats.indexVersion})
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'personalization' && (
            <form onSubmit={handleSavePersonalization} className="space-y-4">
              <div className="px-3 py-2 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed">
                QuantumBot only uses preferences you explicitly save here and does not silently create hidden personal profiles.
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-300 mb-1">
                  Preferred Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  placeholder="How should QuantumBot address you?"
                  className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-gray-300 mb-1">
                    Response Style
                  </label>
                  <select
                    value={responseStyle}
                    onChange={(e) => setResponseStyle(e.target.value as ResponseStyle)}
                    className="w-full bg-[#060A14] text-white border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
                  >
                    {RESPONSE_STYLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#060A14]">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-gray-300 mb-1">
                    Preferred Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-[#060A14] text-white border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang} value={lang} className="bg-[#060A14]">
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-gray-300 mb-1">
                  Saved Custom Instructions
                </label>
                <textarea
                  rows={3}
                  maxLength={1200}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Prefer TypeScript examples, summarize key takeaways first..."
                  className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60 resize-y"
                />
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={defaultWebSearch}
                    onChange={(e) => setDefaultWebSearch(e.target.checked)}
                    className="rounded border-gray-700 bg-[#060A14] text-cyan-400"
                  />
                  <span>Enable Web Research by default on new sessions</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enterToSend}
                    onChange={(e) => setEnterToSend(e.target.checked)}
                    className="rounded border-gray-700 bg-[#060A14] text-cyan-400"
                  />
                  <span>Press Enter to send messages (Shift+Enter for new line)</span>
                </label>
              </div>

              {prefsNotice && (
                <div className="px-3 py-2 rounded-lg bg-emerald-950/30 border border-emerald-700/50 text-emerald-300 text-[11px]">
                  {prefsNotice}
                </div>
              )}

              <button
                type="submit"
                disabled={savingPrefs}
                className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-mono font-semibold text-xs transition-colors"
              >
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </button>
            </form>
          )}

          {activeTab === 'account' && (
            <div className="space-y-4">
              {isAuthenticated && authUser ? (
                <div className="p-4 rounded-xl bg-[#060A14] border border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {authUser.name}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400">
                        {authUser.email}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 text-[10px] font-mono uppercase">
                      {authType === 'admin_session' ? 'Admin Account' : 'Verified Account'}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Your conversations, pinned/archived threads, and personalization preferences are isolated to your account and synced securely across reloads and sessions.
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {onSignOut && (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await onSignOut(false);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs transition-colors"
                        >
                          Sign Out
                        </button>
                        {authType === 'bot_account' && (
                          <button
                            type="button"
                            onClick={async () => {
                              await onSignOut(true);
                              onClose();
                            }}
                            className="px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/40 border border-amber-700/40 text-amber-300 font-mono text-xs transition-colors"
                          >
                            Sign Out All Devices
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#060A14] border border-gray-800 space-y-3">
                  <div className="text-sm font-semibold text-white">
                    Anonymous Guest Session
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    You are currently using QuantumBot with an isolated guest session cookie. Create an optional free account or sign in to keep your chat history and preferences tied to your credentials across devices.
                  </p>
                  {onOpenAuthModal && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAuthModal('login');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-semibold text-xs"
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAuthModal('register');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs border border-gray-700"
                      >
                        Create Account
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#060A14] border border-gray-800/80 space-y-2 text-[11px] leading-relaxed text-gray-300">
                <div className="font-mono font-semibold text-white text-xs">
                  Storage, Isolation &amp; Retention Policy
                </div>
                <p>
                  • <strong>Strict Data Isolation:</strong> Conversations and uploaded files are scoped strictly to your authenticated user ID or signed guest session cookie and cannot be accessed by other visitors or accounts.
                </p>
                <p>
                  • <strong>Uploaded Files Retention:</strong> Documents and images are stored privately for analysis and automatically purged from server storage after 24 hours (unless deleted earlier below).
                </p>
                <p>
                  • <strong>Privacy First:</strong> QuantumBot only stores explicit preferences you choose to save and provides instant export and full deletion controls below.
                </p>
              </div>

              {privacyNotice && (
                <div className="px-3 py-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-200 text-[11px]">
                  {privacyNotice}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <a
                  href="/api/bot/privacy/export"
                  download
                  className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-mono text-xs border border-gray-700 inline-flex items-center gap-1.5"
                >
                  Export My Data (JSON)
                </a>

                <button
                  type="button"
                  onClick={handleDeleteUploadedFiles}
                  className="px-3 py-2 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/50 font-mono text-xs transition-colors"
                >
                  Delete Uploaded Files Now
                </button>

                <button
                  type="button"
                  onClick={handleClearConversations}
                  className="px-3 py-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border border-rose-800/50 font-mono text-xs transition-colors"
                >
                  Delete All Conversations
                </button>
              </div>

              {isAuthenticated && authType === 'bot_account' && (
                <div className="pt-3 border-t border-gray-800/80 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-rose-400">
                    Danger Zone — Account Deletion
                  </div>
                  {!showDeleteAccountConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteAccountConfirm(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-700/50 font-mono text-xs"
                    >
                      Delete My Account &amp; All Data...
                    </button>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="p-3 rounded-xl bg-rose-950/20 border border-rose-800/60 space-y-2.5">
                      <p className="text-[11px] text-rose-200">
                        Enter your password to permanently erase your QuantumBot account, saved preferences, uploaded files, and all conversation history.
                      </p>
                      <input
                        type="password"
                        required
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Confirm current password"
                        className="w-full bg-[#060A14] text-white border border-rose-800/60 rounded-lg px-3 py-1.5 outline-none text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={deletingAccount}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs"
                        >
                          {deletingAccount ? 'Deleting...' : 'Confirm Permanent Deletion'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeleteAccountConfirm(false);
                            setDeletePassword('');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-mono text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-800/80 bg-[#0c1326] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium font-mono text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
