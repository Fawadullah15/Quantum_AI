'use client';

import React, { useState, useEffect } from 'react';
import { clearAllStoredConversations } from '@/lib/bot/storage';
import { ModelDefinition } from '@/lib/bot/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelDefinition[];
  currentModelId: string;
  onSelectModel: (id: string) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  models,
  currentModelId,
  onSelectModel,
}: SettingsModalProps) {
  const [testingModelId, setTestingModelId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latencyMs?: number; error?: string } | null>(null);
  const [kbStats, setKbStats] = useState<{ verifiedDocuments: number; indexVersion: number } | null>(null);

  useEffect(() => {
    setTestResult(null);
    if (isOpen) {
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
  }, [isOpen]);

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

  const handleClearConversations = () => {
    if (confirm('Are you sure you want to delete all saved conversations? This cannot be undone.')) {
      clearAllStoredConversations();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-lg rounded-2xl bg-[#090E1D] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 bg-[#0c1326]">
          <h2 className="text-sm font-semibold text-white font-mono tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            QuantumBot Engine Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs text-gray-300 max-h-[75vh] overflow-y-auto">
          {/* Default Model */}
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

          {/* Provider Verification & Health Diagnostic */}
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

          {/* Company Knowledge & Identity Status */}
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

          {/* Data & Storage Management */}
          <div className="space-y-2 pt-2 border-t border-gray-800/60">
            <label className="block text-gray-200 font-medium font-mono uppercase tracking-wider text-[11px]">
              Local Cache & Conversation History
            </label>
            <p className="text-gray-400 text-[11px]">
              Multi-turn conversations are persisted locally in your browser&apos;s local storage.
            </p>
            <button
              type="button"
              onClick={handleClearConversations}
              className="px-3 py-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 rounded-lg transition-colors"
            >
              Clear All Saved Conversations
            </button>
          </div>
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
