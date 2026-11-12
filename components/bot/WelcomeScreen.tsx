'use client';

import React from 'react';
import { QuantumBotIcon } from './QuantumBotIcon';

interface WelcomeScreenProps {
  onSelectPrompt: (prompt: string) => void;
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

export function WelcomeScreen({ onSelectPrompt }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-2xl mx-auto px-4 py-8 select-none">
      {/* Brand Icon Header */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="mb-4 p-3 rounded-2xl bg-gradient-to-b from-cyan-950/40 to-transparent border border-cyan-500/20 shadow-[0_0_24px_rgba(0,240,255,0.12)]">
          <QuantumBotIcon size={44} showGlow />
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight font-mono mb-2">
          Hello, I&apos;m QuantumBot.
        </h1>
        <p className="text-sm sm:text-base text-gray-400 max-w-md">
          What would you like to work on today?
        </p>
      </div>

      {/* 6 Starter Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {STARTER_SUGGESTIONS.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectPrompt(item.prompt)}
            className="group flex flex-col items-start text-left p-3.5 rounded-xl bg-[#090E1B]/70 hover:bg-[#0E172B] border border-gray-800/80 hover:border-cyan-500/40 transition-all duration-150 shadow-sm hover:shadow-cyan-950/20"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-gray-900/90 border border-gray-800/80 group-hover:border-cyan-500/30 transition-colors">
                {item.icon}
              </span>
              <span className="text-xs text-gray-400 font-mono tracking-wider uppercase group-hover:text-cyan-400 transition-colors">
                {item.category}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
              {item.title}
            </span>
            <span className="text-xs text-gray-400 line-clamp-1 mt-0.5">
              {item.prompt}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
