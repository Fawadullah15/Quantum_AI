'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration: number = 3500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast('success', message, title),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast('error', message, title),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast('info', message, title),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast('warning', message, title),
    [showToast]
  );

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: '#06281E',
          border: 'rgba(16, 185, 129, 0.4)',
          text: '#34D399',
          icon: '✓',
          shadow: '0 10px 30px -5px rgba(16, 185, 129, 0.3)',
        };
      case 'error':
        return {
          bg: '#2A0E14',
          border: 'rgba(239, 68, 68, 0.4)',
          text: '#F87171',
          icon: '✕',
          shadow: '0 10px 30px -5px rgba(239, 68, 68, 0.3)',
        };
      case 'warning':
        return {
          bg: '#2B1E06',
          border: 'rgba(245, 158, 11, 0.4)',
          text: '#FBBF24',
          icon: '⚠',
          shadow: '0 10px 30px -5px rgba(245, 158, 11, 0.3)',
        };
      case 'info':
      default:
        return {
          bg: '#0A1D3A',
          border: 'rgba(56, 189, 248, 0.4)',
          text: '#38BDF8',
          icon: 'ℹ',
          shadow: '0 10px 30px -5px rgba(56, 189, 248, 0.3)',
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100vw - 40px)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const style = getToastStyles(toast.type);
          return (
            <div
              key={toast.id}
              style={{
                backgroundColor: style.bg,
                border: `1px solid ${style.border}`,
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                boxShadow: style.shadow,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                color: '#F8FAFC',
                pointerEvents: 'auto',
                animation: 'slideInToast 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: style.text,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {style.icon}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && (
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: style.text, marginBottom: '0.15rem' }}>
                    {toast.title}
                  </div>
                )}
                <div style={{ fontSize: '0.8rem', color: '#E2E8F0', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {toast.message}
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: 0,
                  marginLeft: '0.25rem',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideInToast {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useAdminToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback safe dummy if used outside provider
    return {
      showToast: () => {},
      success: (msg: string) => alert(`Success: ${msg}`),
      error: (msg: string) => alert(`Error: ${msg}`),
      info: (msg: string) => alert(`Info: ${msg}`),
      warning: (msg: string) => alert(`Warning: ${msg}`),
    };
  }
  return context;
}
