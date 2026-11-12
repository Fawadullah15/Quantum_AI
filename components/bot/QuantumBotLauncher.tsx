'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { QuantumBotIcon } from './QuantumBotIcon';
import { FloatingChatModal } from './FloatingChatModal';

/**
 * QuantumBot Floating Launcher
 * Floats at the bottom right across the public website.
 * Opens the interactive floating chat panel without interfering with ambient sound controls or navigation.
 */
export function QuantumBotLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide on full-screen workspace and admin routes
  if (pathname.startsWith('/quantumbot') || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <div className="quantumbot-launcher-root">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Close QuantumBot AI Assistant' : 'Open QuantumBot AI Assistant'}
          title="QuantumBot AI Assistant"
          className={`group relative flex items-center gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-[#080E1C]/90 hover:bg-[#0E172E] border border-cyan-500/40 hover:border-cyan-400 text-white shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_16px_rgba(0,240,255,0.2)] backdrop-blur-md transition-all duration-200 select-none ${
            isOpen ? 'ring-2 ring-cyan-400/50 bg-[#0E172E]' : 'hover:scale-105'
          }`}
        >
          {/* Subtle Ambient Pulse Ring */}
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-cyan-400/10 animate-ping pointer-events-none opacity-40"
          />

          {/* Brand Icon */}
          <QuantumBotIcon size={26} showGlow />

          {/* Desktop Text Label */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold font-mono tracking-tight leading-none text-white">
              QuantumBot
            </span>
            <span className="text-[10px] font-mono text-cyan-400 tracking-wider leading-tight">
              AI ENGINE
            </span>
          </div>

          {/* Quick status dot */}
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </button>
      </div>

      {/* Floating Chat Modal */}
      <FloatingChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

      <style>{`
        .quantumbot-launcher-root {
          position: fixed;
          bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
          right: calc(1.5rem + env(safe-area-inset-right, 0px));
          z-index: 1001;
          pointer-events: auto;
        }

        @media (min-width: 768px) {
          .quantumbot-launcher-root {
            bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px));
            right: calc(5.25rem + env(safe-area-inset-right, 0px));
          }
        }
      `}</style>
    </>
  );
}
