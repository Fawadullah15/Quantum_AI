'use client';

import React, { useState, useEffect } from 'react';
import { QuantumBotIcon } from './QuantumBotIcon';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialMode?: 'login' | 'register';
  hasGuestConversations?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
  hasGuestConversations = false,
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [claimGuestData, setClaimGuestData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setPassword('');
      setConfirmPassword('');
      setClaimGuestData(hasGuestConversations);
    }
  }, [isOpen, initialMode, hasGuestConversations]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      if (name.trim().length < 2) {
        setError('Please enter your name (at least 2 characters).');
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const endpoint = mode === 'register' ? '/api/bot/auth/register' : '/api/bot/auth/login';
      const payload =
        mode === 'register'
          ? { name: name.trim(), email: email.trim(), password, claimGuestData }
          : { email: email.trim(), password, claimGuestData };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || 'Authentication failed.');
        return;
      }

      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={mode === 'login' ? 'Sign in to QuantumBot' : 'Create QuantumBot Account'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#090E1D] border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/80 bg-[#0c1326]">
          <div className="flex items-center gap-2.5">
            <QuantumBotIcon size={24} showGlow />
            <div>
              <h2 className="text-sm font-semibold text-white font-mono">
                {mode === 'login' ? 'Sign In to QuantumBot' : 'Create QuantumBot Account'}
              </h2>
              <p className="text-[10px] text-cyan-400 font-mono">
                CLOUD HISTORY &amp; PERSONALIZATION
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50"
            aria-label="Close authentication modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-gray-300">
          {/* Guest Notice */}
          <div className="px-3 py-2 rounded-xl bg-cyan-950/25 border border-cyan-500/20 text-[11px] text-cyan-200/90 leading-relaxed">
            No account is required to chat with QuantumBot as a guest. Sign in or register to save conversations and preferences privately to your own account.
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#060A14] border border-gray-800/80 font-mono">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs transition-colors ${
                mode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`py-1.5 rounded-lg text-xs transition-colors ${
                mode === 'register'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="px-3 py-2 rounded-lg bg-rose-950/40 border border-rose-800/60 text-rose-300 text-[11px]"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Alex Rivera"
                  className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono text-gray-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-300 mb-1">
                Password {mode === 'register' ? '(min 8 characters)' : ''}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
              />
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-[11px] font-mono text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full bg-[#060A14] text-white placeholder-gray-600 border border-gray-800 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/60"
                />
              </div>
            )}

            {hasGuestConversations && (
              <label className="flex items-center gap-2 pt-1 text-[11px] text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={claimGuestData}
                  onChange={(e) => setClaimGuestData(e.target.checked)}
                  className="rounded border-gray-700 bg-[#060A14] text-cyan-400"
                />
                <span>Import my current guest conversations &amp; uploads into this account</span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black font-mono font-semibold text-xs transition-colors"
            >
              {loading
                ? mode === 'login'
                  ? 'Signing in...'
                  : 'Creating account...'
                : mode === 'login'
                  ? 'Sign In'
                  : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
