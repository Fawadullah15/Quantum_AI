'use client';

import React from 'react';
import { QuantumBotIcon } from './QuantumBotIcon';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
  compact?: boolean;
}

const STARTER_SUGGESTIONS = [
  {
    category: 'Analysis & Concepts',
    title: 'Explain something complex',
    prompt: 'Explain the fundamental differences between quantum annealing and gate-based quantum computing, including industrial applications.',
    icon: (
      <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    category: 'Engineering & Code',
    title: 'Write or debug code',
    prompt: 'Write a high-throughput async processing pipeline in TypeScript with exponential backoff and concurrency control.',
    icon: (
      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  {
    category: 'Multimodal & Documents',
    title: 'Analyze a document',
    prompt: 'What types of documents or engineering technical specifications can you inspect and summarize for me?',
    icon: (
      <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    category: 'Problem Solving',
    title: 'Help me solve a problem',
    prompt: 'Help me calculate the required shaft diameter and factor of safety for a 15 kW motor rotating at 1450 RPM.',
    icon: (
      <svg className="w-4 h-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    category: 'Deep Research',
    title: 'Research a topic',
    prompt: 'Synthesize current breakthroughs in multimodal foundation models and edge AI deployment in manufacturing.',
    icon: (
      <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    category: 'Company Intelligence',
    title: 'Explore Quantum AI',
    prompt: 'Tell me about Quantum AI, its core services, executive leadership, and the Mechanical Engineering Design Copilot.',
    icon: (
      <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export function WelcomeScreen({ onSelectPrompt, compact = false }: WelcomeScreenProps) {
  return (
    <div
      className={`w-full min-w-0 flex flex-col items-center justify-center max-w-2xl mx-auto select-none ${
        compact ? 'px-0.5 py-1' : 'px-1 sm:px-4 py-2 sm:py-8'
      }`}
    >
      {/* Brand Icon Header */}
      <div className={`flex flex-col items-center text-center ${compact ? 'mb-4' : 'mb-6 sm:mb-8'}`}>
        <div
          className={`rounded-2xl bg-gradient-to-b from-cyan-950/40 to-transparent border border-cyan-500/20 shadow-[0_0_24px_rgba(0,240,255,0.12)] ${
            compact ? 'mb-2 p-2' : 'mb-3 sm:mb-4 p-2.5 sm:p-3'
          }`}
        >
          <QuantumBotIcon size={compact ? 30 : 40} showGlow />
        </div>
        <h1
          className={`font-semibold text-white tracking-tight font-mono ${
            compact ? 'text-lg mb-1' : 'text-xl sm:text-3xl mb-1.5 sm:mb-2'
          }`}
        >
          Hello, I&apos;m QuantumBot.
        </h1>
        <p className={`text-gray-400 max-w-md px-2 ${compact ? 'text-xs' : 'text-xs sm:text-base'}`}>
          An AI assistant by Quantum AI. What would you like to work on today?
        </p>
      </div>

      {/* 6 Starter Suggestions Grid */}
      <div
        className={`grid w-full min-w-0 ${
          compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-2.5'
        }`}
      >
        {STARTER_SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className={`w-full min-w-0 overflow-hidden group text-left rounded-xl bg-[#090E1B]/70 hover:bg-[#0E172B] border border-gray-800/80 hover:border-cyan-500/40 transition-all duration-150 shadow-sm hover:shadow-cyan-950/20 ${
              compact ? 'flex items-center gap-2.5 p-2.5' : 'flex flex-col items-start p-3 sm:p-3.5'
            }`}
          >
            {compact ? (
              <>
                <span className="p-1.5 rounded-lg bg-gray-900/90 border border-gray-800/80 group-hover:border-cyan-500/30 transition-colors shrink-0">
                  {item.icon}
                </span>
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <span className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-cyan-400/75 font-mono uppercase tracking-wider shrink-0">
                      {item.category.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 truncate w-full mt-0.5 block">
                    {item.prompt}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1 sm:mb-1.5 max-w-full">
                  <span className="p-1 rounded-md bg-gray-900/90 border border-gray-800/80 group-hover:border-cyan-500/30 transition-colors shrink-0">
                    {item.icon}
                  </span>
                  <span className="text-[11px] sm:text-xs text-gray-400 font-mono tracking-wider uppercase group-hover:text-cyan-400 transition-colors truncate">
                    {item.category}
                  </span>
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate w-full">
                  {item.title}
                </span>
                <span className="text-[11px] sm:text-xs text-gray-400 truncate w-full mt-0.5 block">
                  {item.prompt}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
