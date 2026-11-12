'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BotMessage,
  BotAttachment,
  ModelDefinition,
  StreamChunk,
  BotToolCall,
  BotToolResult,
} from './types';
import {
  StoredConversation,
  getStoredConversation,
  saveConversation,
  getActiveConversationId,
  setActiveConversationId,
} from './storage';

export interface UseChatOptions {
  initialConversationId?: string;
  defaultModelId?: string;
}

export function useChat(options: UseChatOptions = {}) {
  const [conversationId, setConversationId] = useState<string>(
    () => options.initialConversationId || getActiveConversationId() || `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const [title, setTitle] = useState<string>('New Conversation');
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [modelId, setModelIdState] = useState<string>(options.defaultModelId || 'gemini-2.5-flash');
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();

  // Streaming generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingThought, setStreamingThought] = useState('');
  const [activeToolCall, setActiveToolCall] = useState<BotToolCall | null>(null);
  const [activeToolResult, setActiveToolResult] = useState<BotToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // 1. Fetch available models on mount
  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        const res = await fetch('/api/bot/models');
        if (res.ok) {
          const data = await res.json();
          if (mounted && data.models) {
            setAvailableModels(data.models);
            if (data.defaultModelId && !options.defaultModelId) {
              setModelIdState(data.defaultModelId);
            }
            setIsFallback(!!data.isDefaultFallback);
            setFallbackReason(data.fallbackReason);
          }
        }
      } catch (err) {
        console.warn('[useChat] Failed to fetch model registry:', err);
      }
    }
    loadModels();
    return () => {
      mounted = false;
    };
  }, [options.defaultModelId]);

  // 2. Load conversation from storage whenever conversationId changes
  useEffect(() => {
    const stored = getStoredConversation(conversationId);
    if (stored) {
      setMessages(stored.messages || []);
      setTitle(stored.title || 'New Conversation');
      if (stored.modelId) {
        setModelIdState(stored.modelId);
      }
    } else {
      setMessages([]);
      setTitle('New Conversation');
    }
    setActiveConversationId(conversationId);
  }, [conversationId]);

  // 3. Listen for cross-tab or cross-component sync
  useEffect(() => {
    const handleSync = (e: any) => {
      const detail = e.detail;
      if (detail?.conversationId === conversationId) {
        const updated = getStoredConversation(conversationId);
        if (updated) {
          setMessages(updated.messages || []);
          setTitle(updated.title || 'New Conversation');
        }
      }
    };
    window.addEventListener('quantumbot:sync', handleSync);
    return () => window.removeEventListener('quantumbot:sync', handleSync);
  }, [conversationId]);

  // 4. Save to storage helper
  const persist = useCallback(
    (newMessages: BotMessage[], currentTitle?: string, currentModel?: string) => {
      const conv: StoredConversation = {
        id: conversationId,
        title: currentTitle || title,
        modelId: currentModel || modelId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: newMessages,
      };
      saveConversation(conv);
    },
    [conversationId, title, modelId]
  );

  // 5. Send message & process SSE stream
  const sendMessage = useCallback(
    async (content: string, attachments: BotAttachment[] = []) => {
      if ((!content.trim() && attachments.length === 0) || isGenerating) return;

      setError(null);
      setStreamingContent('');
      setStreamingThought('');
      setActiveToolCall(null);
      setActiveToolResult(null);

      // Create and append user message
      const userMessage: BotMessage = {
        id: `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content: content.trim(),
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: new Date().toISOString(),
      };

      const updatedHistory = [...messages, userMessage];
      setMessages(updatedHistory);
      persist(updatedHistory);

      setIsGenerating(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedContent = '';
      const toolCallsAccumulator: BotToolCall[] = [];
      const toolResultsAccumulator: BotToolResult[] = [];

      try {
        const response = await fetch('/api/bot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            modelId,
            messages: updatedHistory,
            enableTools: true,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error || `Request failed with status ${response.status}`);
        }

        if (!response.body) {
          throw new Error('ReadableStream not supported by provider.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;

            const jsonStr = trimmed.slice(6);
            if (!jsonStr) continue;

            try {
              const chunk: StreamChunk = JSON.parse(jsonStr);

              switch (chunk.type) {
                case 'text':
                  if (chunk.text) {
                    accumulatedContent += chunk.text;
                    setStreamingContent(accumulatedContent);
                  }
                  break;

                case 'thought':
                  if (chunk.thought) {
                    setStreamingThought((prev) => (prev ? `${prev}\n${chunk.thought}` : chunk.thought!));
                  }
                  break;

                case 'tool_call':
                  if (chunk.toolCall) {
                    setActiveToolCall(chunk.toolCall);
                    toolCallsAccumulator.push(chunk.toolCall);
                  }
                  break;

                case 'tool_result':
                  if (chunk.toolResult) {
                    setActiveToolResult(chunk.toolResult);
                    toolResultsAccumulator.push(chunk.toolResult);
                  }
                  break;

                case 'error':
                  setError(chunk.error || 'Generation error encountered.');
                  break;

                case 'done':
                  break;
              }
            } catch (parseErr) {
              console.warn('[useChat] Failed to parse SSE event:', parseErr);
            }
          }
        }

        // Commit final assistant message if content was generated
        if (accumulatedContent || toolCallsAccumulator.length > 0) {
          const assistantMessage: BotMessage = {
            id: `msg_asst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content: accumulatedContent,
            model: modelId,
            toolCalls: toolCallsAccumulator.length > 0 ? toolCallsAccumulator : undefined,
            toolResults: toolResultsAccumulator.length > 0 ? toolResultsAccumulator : undefined,
            createdAt: new Date().toISOString(),
          };

          const finalMessages = [...updatedHistory, assistantMessage];
          setMessages(finalMessages);
          persist(finalMessages);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          // If aborted, keep what was generated so far
          if (accumulatedContent) {
            const partialMessage: BotMessage = {
              id: `msg_asst_${Date.now()}`,
              role: 'assistant',
              content: `${accumulatedContent}\n\n*(Generation stopped by user)*`,
              model: modelId,
              createdAt: new Date().toISOString(),
            };
            const finalMessages = [...updatedHistory, partialMessage];
            setMessages(finalMessages);
            persist(finalMessages);
          }
        } else {
          const errMsg = err?.message || 'Chat generation failed.';
          setError(errMsg);
        }
      } finally {
        setIsGenerating(false);
        setStreamingContent('');
        setStreamingThought('');
        setActiveToolCall(null);
        setActiveToolResult(null);
        abortControllerRef.current = null;
      }
    },
    [conversationId, modelId, messages, isGenerating, persist]
  );

  // 6. Stop generation handler
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 7. Regenerate last response
  const regenerate = useCallback(async () => {
    if (isGenerating || messages.length === 0) return;

    // Remove trailing assistant message if present
    const lastMsg = messages[messages.length - 1];
    let trimmedHistory = [...messages];
    if (lastMsg.role === 'assistant') {
      trimmedHistory.pop();
      setMessages(trimmedHistory);
      persist(trimmedHistory);
    }

    if (trimmedHistory.length === 0) return;

    // Take the last user prompt and re-run
    const lastUserMsg = trimmedHistory[trimmedHistory.length - 1];
    if (lastUserMsg.role === 'user') {
      // Temporarily remove last user message from history to let sendMessage re-add it
      const baseHistory = trimmedHistory.slice(0, -1);
      setMessages(baseHistory);
      persist(baseHistory);
      await sendMessage(lastUserMsg.content, lastUserMsg.attachments);
    }
  }, [isGenerating, messages, persist, sendMessage]);

  // 8. Edit user message and re-send
  const editUserMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (isGenerating) return;
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const targetMsg = messages[index];
      // Keep everything before this message
      const historyBefore = messages.slice(0, index);
      setMessages(historyBefore);
      persist(historyBefore);

      await sendMessage(newContent, targetMsg.attachments);
    },
    [isGenerating, messages, persist, sendMessage]
  );

  // 9. Start a fresh conversation
  const startNewConversation = useCallback(
    (initialModel?: string) => {
      stopGeneration();
      const newId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setConversationId(newId);
      setMessages([]);
      setTitle('New Conversation');
      setError(null);
      setStreamingContent('');
      if (initialModel) {
        setModelIdState(initialModel);
      }
      setActiveConversationId(newId);
    },
    [stopGeneration]
  );

  // 10. Switch active conversation
  const switchConversation = useCallback(
    (id: string) => {
      if (id === conversationId) return;
      stopGeneration();
      setConversationId(id);
      setError(null);
      setStreamingContent('');
    },
    [conversationId, stopGeneration]
  );

  // 11. Change model
  const setModelId = useCallback(
    (id: string) => {
      setModelIdState(id);
      const conv = getStoredConversation(conversationId);
      if (conv) {
        saveConversation({ ...conv, modelId: id });
      }
    },
    [conversationId]
  );

  return {
    conversationId,
    title,
    messages,
    modelId,
    availableModels,
    isFallback,
    fallbackReason,
    isGenerating,
    streamingContent,
    streamingThought,
    activeToolCall,
    activeToolResult,
    error,
    sendMessage,
    stopGeneration,
    regenerate,
    editUserMessage,
    startNewConversation,
    switchConversation,
    setModelId,
  };
}
