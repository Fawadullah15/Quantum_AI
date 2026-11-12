'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ModelDefinition } from '@/lib/bot/types';

interface ModelSelectorProps {
  currentModelId: string;
  models: ModelDefinition[];
  onSelectModel: (modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModelSelector({
  currentModelId,
  models,
  onSelectModel,
  disabled = false,
  compact = false,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel =
    models.find((m) => m.id === currentModelId) ||
    models[0] || {
      id: currentModelId,
      name: currentModelId,
      description: 'Conversational AI Model',
      family: 'General',
      capabilities: ['streaming'],
      contextWindow: 128000,
      isAvailable: true,
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

  const sortedModels = [...models].sort((a, b) => {
    const aAvail = a.isAvailable !== false ? 0 : 1;
    const bAvail = b.isAvailable !== false ? 0 : 1;
    return aAvail - bAvail;
  });

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg bg-gray-900/60 hover:bg-gray-800/80 border border-gray-800/80 hover:border-cyan-500/30 font-mono text-gray-200 transition-colors select-none ${
          compact ? 'px-2 py-1 text-[11px] max-w-[148px]' : 'px-2.5 py-1.5 text-xs'
        }`}
        title="Select AI Model"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
        <span className="font-semibold text-gray-100 truncate">{activeModel.name}</span>
        {!compact && activeModel.capabilities && !activeModel.capabilities.includes('vision') && (
          <span className="text-[9px] px-1 rounded bg-gray-800 text-amber-300 border border-amber-700/40 shrink-0">
            Text
          </span>
        )}
        <svg
          className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute mt-1.5 w-80 max-w-[calc(100vw-2rem)] rounded-xl bg-[#090E1D] border border-gray-800 shadow-2xl z-50 overflow-hidden divide-y divide-gray-800/60 animate-in fade-in duration-100 ${
            compact ? 'right-0 sm:left-0 sm:right-auto' : 'left-0'
          }`}
        >
          <div className="px-3 py-2 bg-[#0c1326] text-[11px] font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Intelligence Engines</span>
            <span className="text-[10px] text-gray-500">Capabilities</span>
          </div>
          <div className="max-h-80 overflow-y-auto py-1 divide-y divide-gray-800/30">
            {sortedModels.map((model) => {
              const isSelected = model.id === currentModelId;
              const isAvailable = model.isAvailable !== false;
              const hasVision = model.capabilities.includes('vision');

              return (
                <button
                  key={model.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (!isAvailable) return;
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  title={
                    isAvailable
                      ? model.recommendedFor || model.description
                      : model.unavailabilityReason || 'Provider API key not configured'
                  }
                  className={`w-full text-left px-3 py-2.5 flex flex-col gap-0.5 transition-colors ${
                    !isAvailable
                      ? 'opacity-45 cursor-not-allowed'
                      : 'hover:bg-cyan-950/20'
                  } ${isSelected ? 'bg-cyan-950/40 border-l-2 border-cyan-400' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-white truncate">
                      {model.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-800/70 text-cyan-300 shrink-0">
                      {model.family || model.provider}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 line-clamp-1">
                    {isAvailable
                      ? model.description
                      : model.unavailabilityReason || 'Not configured on server'}
                  </span>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-mono text-gray-400">
                    {hasVision ? (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                        Vision
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded bg-gray-900 border border-gray-800 text-gray-500">
                        No Vision
                      </span>
                    )}
                    {model.capabilities.includes('tools') && (
                      <span className="px-1.5 py-0.2 rounded bg-gray-900 border border-gray-800">
                        Tools
                      </span>
                    )}
                    {!isAvailable && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-950/50 border border-rose-900/50 text-rose-300">
                        Key Required
                      </span>
                    )}
                    <span className="ml-auto text-gray-400">
                      {model.contextWindow >= 1000000
                        ? '1M ctx'
                        : `${(model.contextWindow / 1000).toFixed(0)}k ctx`}
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
