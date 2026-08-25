'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmVariant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function AdminConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      setIsOpen(true);
      setResolver(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolver) resolver(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  const isDanger = options.variant !== 'primary' && options.variant !== 'warning';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {isOpen && (
        <div
          onClick={handleCancel}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 6, 23, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#070E1E',
              border: isDanger ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(22, 119, 255, 0.4)',
              borderRadius: '14px',
              padding: '1.5rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 25px rgba(0, 0, 0, 0.5)',
              color: '#F8FAFC',
              animation: 'modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '1.35rem' }}>{isDanger ? '⚠️' : '❓'}</span>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: isDanger ? '#F87171' : '#F8FAFC' }}>
                {options.title || (isDanger ? 'Confirm Deletion' : 'Confirm Action')}
              </h3>
            </div>

            <p style={{ color: '#CBD5E1', fontSize: '0.88rem', lineHeight: 1.55, margin: '0 0 1.5rem 0' }}>
              {options.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#94A3B8',
                  padding: '0.55rem 1.15rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                {options.cancelText || 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  backgroundColor: isDanger ? '#DC2626' : '#1677FF',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '0.55rem 1.35rem',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono, monospace)',
                  boxShadow: isDanger ? '0 4px 14px rgba(220, 38, 38, 0.4)' : '0 4px 14px rgba(22, 119, 255, 0.4)',
                }}
              >
                {options.confirmText || (isDanger ? 'Delete Permanently' : 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes modalPop {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </ConfirmContext.Provider>
  );
}

export function useAdminConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    return {
      confirm: async (opts: ConfirmOptions) => window.confirm(opts.message),
    };
  }
  return context;
}
