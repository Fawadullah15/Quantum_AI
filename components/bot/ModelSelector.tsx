'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ModelDefinition } from '@/lib/bot/types';

interface ModelSelectorProps {
  currentModelId: string;
  models: ModelDefinition[];
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  currentModelId,
  models,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = models.find((m) => m.id === currentModelId) || models[0] || {
    id: currentModelId,
    name: currentModelId,
    description: 'Conversational AI Model',
    family: 'General',
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/80 hover:border-cyan-500/30 text-xs font-mono text-gray-200 transition-colors select-none"
        title="Select AI Model"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span className="font-semibold text-gray-100">{activeModel.name}</span>
        <svg
          className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-[#090E1D] border border-gray-800 shadow-2xl z-50 overflow-hidden divide-y divide-gray-800/60 animate-in fade-in duration-100">
          <div className="px-3 py-2 bg-[#0c1326] text-[11px] font-mono uppercase tracking-wider text-gray-400">
            Available Intelligence Engines
          </div>
          <div className="max-h-72 overflow-y-auto py-1 divide-y divide-gray-800/30">
            {models.map((model) => {
              const isSelected = model.id === currentModelId;
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex flex-col gap-0.5 hover:bg-cyan-950/20 transition-colors ${
                    isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">
                      {model.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800/70 text-cyan-300">
                      {model.family || model.provider}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 line-clamp-1">
                    {model.description}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-gray-400">
                    {model.capabilities.includes('vision') && (
                      <span className="px-1 py-0.2 rounded bg-gray-900 border border-gray-800">
                        Vision
                      </span>
                    )}
                    {model.capabilities.includes('tools') && (
                      <span className="px-1 py-0.2 rounded bg-gray-900 border border-gray-800">
                        Tools
                      </span>
                    )}
                    <span className="ml-auto text-gray-400">
                      {(model.contextWindow / 1000).toFixed(0)}k ctx
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
