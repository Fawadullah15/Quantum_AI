'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@/lib/bot/use-chat';
import { QuantumBotIcon } from './QuantumBotIcon';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { WelcomeScreen } from './WelcomeScreen';

interface FloatingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingChatModal({ isOpen, onClose }: FloatingChatModalProps) {
  const router = useRouter();
  const {
    conversationId,
    messages,
    modelId,
    availableModels,
    isGenerating,
    streamingContent,
    streamingThought,
    error,
    sendMessage,
    stopGeneration,
    regenerate,
    editUserMessage,
    startNewConversation,
    setModelId,
  } = useChat();

  const activeModel = availableModels.find((m) => m.id === modelId);
  const handleSwitchToVisionModel = () => {
    const visionModel = availableModels.find(
      (m) => m.isAvailable !== false && m.capabilities.includes('vision')
    );
    if (visionModel) {
      setModelId(visionModel.id);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message or streaming, keep WelcomeScreen scrolled to top
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    if (messages.length === 0 && !streamingContent) {
      el.scrollTop = 0;
      return;
    }
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent, isOpen]);

  if (!isOpen) return null;

  const handleExpandToFullScreen = () => {
    onClose();
    router.push(`/quantumbot?c=${encodeURIComponent(conversationId)}`);
  };

  return (
    <div
      role="dialog"
      aria-label="QuantumBot Assistant"
      className="fixed z-[1100] bottom-4 left-4 right-4 sm:left-auto sm:w-[420px] md:bottom-[5.5rem] md:right-6 h-[min(78dvh,540px)] md:h-[540px] md:max-h-[calc(100vh-11rem)] flex flex-col rounded-2xl bg-[#070B16]/95 border border-cyan-500/30 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(0,240,255,0.15)] backdrop-blur-xl overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0A1020]/90 border-b border-gray-800/80 select-none">
        <div className="flex items-center gap-2">
          <QuantumBotIcon size={24} showGlow />
          <div className="flex flex-col">
            <span className="text-xs font-semibold font-mono text-white tracking-wide flex items-center gap-1.5">
              QuantumBot
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              AI ENGINE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => startNewConversation()}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
            title="Start new conversation"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Expand to Full-Screen Route */}
          <button
            type="button"
            onClick={handleExpandToFullScreen}
            className="p-1.5 text-gray-400 hover:text-cyan-400 rounded-lg hover:bg-gray-800/60 transition-colors"
            title="Open in full-screen workspace"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Close/Minimize */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
            title="Close QuantumBot panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth text-xs"
      >
        {messages.length === 0 ? (
          <div className="py-1">
            <WelcomeScreen compact onSelectPrompt={(p) => sendMessage(p)} />
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageItem
                key={msg.id || i}
                message={msg}
                onRegenerate={regenerate}
                onEdit={(newContent) => editUserMessage(msg.id, newContent)}
                isLastAssistant={i === messages.length - 1 && msg.role === 'assistant'}
              />
            ))}

            {/* Live Streaming Message Bubble */}
            {isGenerating && streamingContent && (
              <MessageItem
                message={{
                  id: 'streaming_msg',
                  role: 'assistant',
                  content: streamingContent,
                  model: modelId,
                }}
                isStreaming
                streamingThought={streamingThought}
              />
            )}

            {/* Live Thinking Indicator before first token */}
            {isGenerating && !streamingContent && (
              <div className="flex items-center gap-2.5 my-2 px-1">
                <QuantumBotIcon size={24} showGlow />
                <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-900/40 px-2.5 py-1.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  <span>{streamingThought || 'QuantumBot is formulating an answer...'}</span>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs flex items-center justify-between">
                <span className="line-clamp-2">{error}</span>
                <button
                  type="button"
                  onClick={regenerate}
                  className="px-2 py-0.5 rounded bg-rose-900/60 hover:bg-rose-800 text-white font-mono text-[10px] shrink-0 ml-2"
                >
                  Retry
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message Composer Footer */}
      <div className="p-2.5 bg-[#0A1020]/90 border-t border-gray-800/80">
        <MessageComposer
          onSend={(content, attachments) => sendMessage(content, attachments)}
          onStop={stopGeneration}
          isGenerating={isGenerating}
          placeholder="Message QuantumBot..."
          conversationId={conversationId}
          activeModel={activeModel}
          onSwitchToVisionModel={handleSwitchToVisionModel}
        />
      </div>
    </div>
  );
}
