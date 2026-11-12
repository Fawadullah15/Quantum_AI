'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useChat } from '@/lib/bot/use-chat';
import { getStoredConversations, StoredConversation } from '@/lib/bot/storage';
import { Sidebar } from '@/components/bot/Sidebar';
import { ModelSelector } from '@/components/bot/ModelSelector';
import { MessageItem } from '@/components/bot/MessageItem';
import { MessageComposer } from '@/components/bot/MessageComposer';
import { WelcomeScreen } from '@/components/bot/WelcomeScreen';
import { SettingsModal } from '@/components/bot/SettingsModal';
import { QuantumBotIcon } from '@/components/bot/QuantumBotIcon';

export default function QuantumBotPage() {
  return (
    <Suspense fallback={<QuantumBotLoadingPlaceholder />}>
      <QuantumBotWorkspace />
    </Suspense>
  );
}

function QuantumBotWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryConversationId = searchParams.get('c') || undefined;

  const {
    conversationId,
    title,
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
    switchConversation,
    setModelId,
  } = useChat({ initialConversationId: queryConversationId });

  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);

  // Sync URL query param when active conversation changes
  useEffect(() => {
    if (conversationId && searchParams.get('c') !== conversationId) {
      router.replace(`/quantumbot?c=${encodeURIComponent(conversationId)}`, { scroll: false });
    }
  }, [conversationId, router, searchParams]);

  // Load conversation list from storage and listen for changes
  useEffect(() => {
    const refreshList = () => {
      setConversations(getStoredConversations());
    };
    refreshList();

    window.addEventListener('quantumbot:sync', refreshList);
    return () => window.removeEventListener('quantumbot:sync', refreshList);
  }, []);

  // Handle scroll detection: do not auto-jump if user manually scrolled up
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isUp = distanceFromBottom > 150;
    isUserScrolledUpRef.current = isUp;
    setShowScrollBottom(isUp);
  };

  // Auto-scroll on new message or during streaming IF user isn't scrolled up
  useEffect(() => {
    if (!scrollContainerRef.current || isUserScrolledUpRef.current) return;
    const el = scrollContainerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  const scrollToBottom = () => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
    isUserScrolledUpRef.current = false;
    setShowScrollBottom(false);
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#030712] font-sans antialiased text-gray-100">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={conversationId}
        onSelectConversation={(id) => switchConversation(id)}
        onNewChat={() => startNewConversation()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Conversation Container */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#040816] relative">
        {/* Workspace Top Navigation Bar */}
        <header className="h-14 border-b border-gray-800/80 bg-[#060A18]/80 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between shrink-0 z-20 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60"
              title="Open sidebar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Desktop Brand Emblem (when sidebar is collapsed) */}
            {isSidebarCollapsed && (
              <div className="hidden md:flex items-center gap-2 pr-2 border-r border-gray-800">
                <QuantumBotIcon size={24} showGlow />
                <span className="font-mono font-semibold text-xs text-white">QuantumBot</span>
              </div>
            )}

            {/* Model Selector Dropdown */}
            <ModelSelector
              currentModelId={modelId}
              models={availableModels}
              onSelectModel={(id) => setModelId(id)}
              disabled={isGenerating}
            />

            {/* Conversation Title */}
            <h1 className="hidden sm:inline-block truncate text-xs font-medium text-gray-400 max-w-[200px] md:max-w-[320px]">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* New Chat Quick Button */}
            <button
              type="button"
              onClick={() => startNewConversation()}
              className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-mono text-gray-300 hover:text-white hover:bg-gray-800/70 border border-gray-800/80 rounded-lg transition-colors flex items-center gap-1.5"
              title="Start a new chat"
            >
              <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Chat</span>
            </button>

            {/* Settings Trigger */}
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/60 transition-colors"
              title="Engine Settings"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Stream */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-3 sm:px-6 py-6 scroll-smooth"
        >
          <div className="max-w-4xl mx-auto w-full">
            {messages.length === 0 ? (
              <WelcomeScreen onSelectPrompt={(prompt) => sendMessage(prompt)} />
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <MessageItem
                    key={msg.id || index}
                    message={msg}
                    onRegenerate={regenerate}
                    onEdit={(newContent) => editUserMessage(msg.id, newContent)}
                    isLastAssistant={index === messages.length - 1 && msg.role === 'assistant'}
                  />
                ))}

                {/* Live Streaming Assistant Message */}
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

                {/* Live Thinking Indicator without text yet */}
                {isGenerating && !streamingContent && (
                  <div className="flex items-center gap-3 my-4 px-2">
                    <QuantumBotIcon size={28} showGlow />
                    <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/20 border border-cyan-900/40 px-3 py-2 rounded-xl">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>{streamingThought || 'QuantumBot is formulating an answer...'}</span>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {error && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>{error}</span>
                    </div>
                    <button
                      type="button"
                      onClick={regenerate}
                      className="px-3 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-white font-mono text-xs shrink-0 ml-3 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll-to-bottom Floating Button */}
        {showScrollBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-24 right-8 z-30 p-2.5 rounded-full bg-[#0a1020] border border-cyan-500/40 text-cyan-400 shadow-xl hover:bg-cyan-950/40 hover:scale-105 transition-all"
            title="Scroll to latest message"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}

        {/* Docked Message Composer at Bottom */}
        <div className="p-3 sm:p-5 bg-gradient-to-t from-[#040816] via-[#040816]/95 to-transparent shrink-0">
          <div className="max-w-4xl mx-auto w-full">
            <MessageComposer
              onSend={(content, attachments) => sendMessage(content, attachments)}
              onStop={stopGeneration}
              isGenerating={isGenerating}
              placeholder="Ask QuantumBot anything... (Shift + Enter for new line)"
            />
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-gray-500 font-mono">
              <span>QuantumBot can assist with code, mathematics, and complex engineering.</span>
              <span className="hidden sm:inline">Enter to send, Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        models={availableModels}
        currentModelId={modelId}
        onSelectModel={(id) => setModelId(id)}
      />
    </div>
  );
}

function QuantumBotLoadingPlaceholder() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-[#030712] text-gray-400 font-mono text-xs">
      <div className="flex flex-col items-center gap-3">
        <QuantumBotIcon size={36} showGlow />
        <span className="text-cyan-400 animate-pulse">Initializing QuantumBot Intelligence Engine...</span>
      </div>
    </div>
  );
}
