'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BotMessage,
  BotAttachment,
  ModelDefinition,
  StreamChunk,
  BotToolCall,
  BotToolResult,
  PublicBotUser,
  UserPreferences,
} from './types';
import {
  StoredConversation,
  getStoredConversation,
  saveConversation,
  getActiveConversationId,
  setActiveConversationId,
  replaceAllStoredConversations,
  clearAllStoredConversations,
  clearAllServerConversations,
  fetchServerConversations,
  fetchSingleServerConversation,
  syncConversationToServer,
  patchConversationOnServer,
  archiveStoredConversation,
  restoreStoredConversation,
  deleteStoredConversation,
  togglePinConversation,
  renameStoredConversation,
} from './storage';

export interface UseChatOptions {
  initialConversationId?: string;
  defaultModelId?: string;
}

const INITIAL_PREFERENCES: UserPreferences = {
  responseStyle: 'balanced',
  language: 'English',
  defaultWebSearch: false,
  enterToSend: true,
};

export function useChat(options: UseChatOptions = {}) {
  const [conversationId, setConversationId] = useState<string>(
    () =>
      // If a specific conversation ID was passed via URL (?c=...), use it.
      // Otherwise always start a fresh conversation on page load — never resume the last one.
      options.initialConversationId ||
      `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  );
  const [title, setTitle] = useState<string>('New Conversation');
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [modelId, setModelIdState] = useState<string>(options.defaultModelId || 'gemini-3.5-flash');
  const [availableModels, setAvailableModels] = useState<ModelDefinition[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState<string | undefined>();

  // Phase 7: Account Session & Personalization state
  const [authUser, setAuthUser] = useState<PublicBotUser | null>(null);
  const [authType, setAuthType] = useState<'bot_account' | 'admin_session' | 'anonymous'>('anonymous');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(INITIAL_PREFERENCES);

  // Web Search & Streaming generation states
  const [enableWebSearch, setEnableWebSearchState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem('quantumbot_web_search') === 'true';
    } catch {
      return false;
    }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingThought, setStreamingThought] = useState('');
  const [activeToolCall, setActiveToolCall] = useState<BotToolCall | null>(null);
  const [activeToolResult, setActiveToolResult] = useState<BotToolResult | null>(null);
  const [streamingToolCalls, setStreamingToolCalls] = useState<BotToolCall[]>([]);
  const [streamingToolResults, setStreamingToolResults] = useState<BotToolResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [restoredDraft, setRestoredDraft] = useState<{
    key: number;
    content: string;
    attachments: BotAttachment[];
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string>(conversationId);
  conversationIdRef.current = conversationId;

  const setEnableWebSearch = useCallback((next: boolean | ((prev: boolean) => boolean)) => {
    setEnableWebSearchState((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        localStorage.setItem('quantumbot_web_search', String(resolved));
      } catch {}
      return resolved;
    });
  }, []);

  // 1. Fetch available models on mount & keep active model synced if admin disables a model
  useEffect(() => {
    let mounted = true;
    async function loadModels() {
      try {
        const res = await fetch('/api/bot/models', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (mounted && Array.isArray(data.models)) {
            setAvailableModels(data.models);
            const activeIds = new Set(
              (data.models as ModelDefinition[])
                .filter((m) => m.enabled !== false)
                .map((m) => m.id)
            );
            setModelIdState((prev) => {
              if (!options.defaultModelId && (!activeIds.has(prev) || !prev)) {
                return data.defaultModelId || data.models[0]?.id || prev;
              }
              return prev;
            });
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

  useEffect(() => {
    if (availableModels.length === 0) return;
    const enabledModels = availableModels.filter((m) => m.enabled !== false);
    if (enabledModels.length > 0 && !enabledModels.some((m) => m.id === modelId)) {
      const fallback =
        enabledModels.find((m) => m.isDefault && m.isAvailable) ||
        enabledModels.find((m) => m.isAvailable) ||
        enabledModels[0];
      if (fallback) {
        setModelIdState(fallback.id);
      }
    }
  }, [availableModels, modelId]);

  // 1b. Load & restore authenticated/guest session + authoritative conversation history
  const refreshSessionAndConversations = useCallback(
    async (opts?: { forceServerReplace?: boolean }) => {
      setAuthLoading(true);
      try {
        const [sessionRes, serverConvs] = await Promise.all([
          fetch('/api/bot/auth/session', { cache: 'no-store' }),
          fetchServerConversations(),
        ]);

        let isAuthedNow = false;
        if (sessionRes.ok) {
          const sData = await sessionRes.json();
          isAuthedNow = Boolean(sData?.authenticated);
          setIsAuthenticated(isAuthedNow);
          setAuthType(sData?.authType || 'anonymous');
          setAuthUser(sData?.user || null);
          if (sData?.sessionExpired) {
            setSessionNotice(
              'Your previous QuantumBot session expired. You can continue as a guest or sign back in to access synced account history.'
            );
          } else if (isAuthedNow) {
            setSessionNotice(null);
          }
          if (sData?.preferences) {
            setPreferences(sData.preferences);
            if (sData.preferences.defaultModelId && !options.defaultModelId) {
              setModelIdState(sData.preferences.defaultModelId);
            }
            if (typeof sData.preferences.defaultWebSearch === 'boolean') {
              try {
                if (localStorage.getItem('quantumbot_web_search') === null) {
                  setEnableWebSearch(sData.preferences.defaultWebSearch);
                }
              } catch {}
            }
          }
        }

        if (serverConvs !== null) {
          if (isAuthedNow || opts?.forceServerReplace || serverConvs.length > 0) {
            replaceAllStoredConversations(serverConvs);
            const active = serverConvs.find((c) => c.id === conversationIdRef.current);
            if (active) {
              setMessages(active.messages || []);
              setTitle(active.title || 'New Conversation');
              if (active.modelId) setModelIdState(active.modelId);
            } else if (isAuthedNow || opts?.forceServerReplace) {
              setMessages([]);
              setTitle('New Conversation');
            }
          }
        }
      } catch (err) {
        console.warn('[useChat] Session restoration skipped:', err);
      } finally {
        setAuthLoading(false);
      }
    },
    [options.defaultModelId, setEnableWebSearch]
  );

  useEffect(() => {
    void refreshSessionAndConversations();
  }, [refreshSessionAndConversations]);

  // 2. Load conversation from localStorage or server whenever conversationId changes
  useEffect(() => {
    let active = true;
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
      void fetchSingleServerConversation(conversationId).then((remote) => {
        if (!active || !remote) return;
        saveConversation({
          id: remote.id,
          title: remote.title,
          modelId: remote.modelId,
          pinned: remote.pinned,
          archived: remote.archived,
          createdAt: remote.createdAt,
          updatedAt: remote.updatedAt,
          messages: remote.messages,
        });
        setMessages(remote.messages || []);
        setTitle(remote.title || 'New Conversation');
        if (remote.modelId) setModelIdState(remote.modelId);
      });
    }
    setActiveConversationId(conversationId);
    return () => {
      active = false;
    };
  }, [conversationId]);

  // 3. Listen for cross-tab or cross-component sync
  useEffect(() => {
    const handleSync = (e: any) => {
      const detail = e.detail;
      if (detail?.cleared || detail?.deletedId === conversationId) {
        setMessages([]);
        setTitle('New Conversation');
        return;
      }
      if (detail?.conversationId === conversationId || detail?.refreshed) {
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

  // 4. Save to storage helper (strips heavy raw binary/text payloads to protect localStorage quota; server resolves via fileId)
  const persist = useCallback(
    (
      newMessages: BotMessage[],
      currentTitle?: string,
      currentModel?: string,
      syncToServerNow = false
    ) => {
      const compactMessages: BotMessage[] = newMessages.map((msg) => {
        if (!msg.attachments || msg.attachments.length === 0) return msg;
        return {
          ...msg,
          attachments: msg.attachments.map((att) => ({
            id: att.id,
            fileId: att.fileId,
            name: att.name,
            mimeType: att.mimeType,
            extension: att.extension,
            size: att.size,
            kind: att.kind,
            status: att.status,
            url: att.url || (att.fileId ? `/api/bot/files/${att.fileId}` : undefined),
            textPreview: att.textPreview?.slice(0, 600),
            extractedSummary: att.extractedSummary,
            expiresAt: att.expiresAt,
            errorMessage: att.errorMessage,
          })),
        };
      });

      const conv: StoredConversation = {
        id: conversationId,
        title: currentTitle || title,
        modelId: currentModel || modelId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: compactMessages,
      };
      const saved = saveConversation(conv);
      if (saved?.title && saved.title !== title) {
        setTitle(saved.title);
      }
      if (syncToServerNow) {
        void syncConversationToServer(saved);
      }
    },
    [conversationId, title, modelId]
  );

  // 5. Send message & process SSE stream
  const sendMessage = useCallback(
    async (content: string, attachments: BotAttachment[] = []) => {
      if ((!content.trim() && attachments.length === 0) || isGenerating) return;

      setError(null);
      setRestoredDraft(null);
      setStreamingContent('');
      setStreamingThought('');
      setActiveToolCall(null);
      setActiveToolResult(null);
      setStreamingToolCalls([]);
      setStreamingToolResults([]);

      const trimmedContent = content.trim();
      const userMessage: BotMessage = {
        id: `msg_user_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        role: 'user',
        content: trimmedContent,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdAt: new Date().toISOString(),
      };

      const baseMessages = messages;
      const updatedHistory = [...baseMessages, userMessage];
      setMessages(updatedHistory);
      persist(updatedHistory);

      setIsGenerating(true);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      let accumulatedContent = '';
      let actualResponseModel = modelId;
      let streamErrorReceived: string | null = null;
      const toolCallsAccumulator: BotToolCall[] = [];
      const toolResultsAccumulator: BotToolResult[] = [];

      const restoreUnsentUserTurn = () => {
        setMessages(baseMessages);
        persist(baseMessages);
        setRestoredDraft({
          key: Date.now() + Math.random(),
          content: trimmedContent,
          attachments,
        });
      };

      try {
        const response = await fetch('/api/bot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            modelId,
            messages: updatedHistory,
            enableTools: true,
            enableWebSearch,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 401) {
            setSessionNotice('Your session expired. Please sign in again or continue as guest.');
          }
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
                    setStreamingToolCalls([...toolCallsAccumulator]);
                  }
                  break;

                case 'tool_result':
                  if (chunk.toolResult) {
                    setActiveToolResult(chunk.toolResult);
                    toolResultsAccumulator.push(chunk.toolResult);
                    setStreamingToolResults([...toolResultsAccumulator]);
                    for (let k = toolCallsAccumulator.length - 1; k >= 0; k--) {
                      if (toolCallsAccumulator[k].id === chunk.toolResult.toolCallId) {
                        toolCallsAccumulator[k] = {
                          ...toolCallsAccumulator[k],
                          status: chunk.toolResult.confirmationRequired
                            ? 'confirmation_required'
                            : chunk.toolResult.isError
                              ? 'error'
                              : 'completed',
                        };
                        break;
                      }
                    }
                    setStreamingToolCalls([...toolCallsAccumulator]);
                  }
                  break;

                case 'error':
                  streamErrorReceived = chunk.error || 'Generation error encountered.';
                  setError(streamErrorReceived);
                  break;

                case 'done':
                  if (chunk.model) {
                    actualResponseModel = chunk.model;
                  }
                  break;
              }
            } catch (parseErr) {
              console.warn('[useChat] Failed to parse SSE event:', parseErr);
            }
          }
        }

        if (accumulatedContent || toolCallsAccumulator.length > 0) {
          // Content was delivered — clear any transient error (e.g. from quota fallback)
          setError(null);
          const assistantMessage: BotMessage = {
            id: `msg_asst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content: accumulatedContent,
            model: actualResponseModel || modelId,
            toolCalls: toolCallsAccumulator.length > 0 ? toolCallsAccumulator : undefined,
            toolResults: toolResultsAccumulator.length > 0 ? toolResultsAccumulator : undefined,
            createdAt: new Date().toISOString(),
          };

          const finalMessages = [...updatedHistory, assistantMessage];
          setMessages(finalMessages);
          persist(finalMessages);
        } else if (streamErrorReceived || !accumulatedContent) {
          // Provider/SSE failed before delivering any answer -> preserve user's unsent message & attachments
          if (!streamErrorReceived) {
            setError('No response received from the AI provider. Your message was restored below.');
          }
          restoreUnsentUserTurn();
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || controller.signal.aborted) {
          if (accumulatedContent) {
            const partialMessage: BotMessage = {
              id: `msg_asst_${Date.now()}`,
              role: 'assistant',
              content: `${accumulatedContent}\n\n*(Generation stopped by user)*`,
              model: actualResponseModel || modelId,
              createdAt: new Date().toISOString(),
            };
            const finalMessages = [...updatedHistory, partialMessage];
            setMessages(finalMessages);
            persist(finalMessages, undefined, undefined, true);
          } else {
            restoreUnsentUserTurn();
          }
        } else {
          const rawMsg = err?.message || '';
          const friendlyMsg =
            rawMsg === 'Failed to fetch' || err?.name === 'TypeError'
              ? 'Network connection interrupted while contacting QuantumBot. Your unsent message has been restored below.'
              : rawMsg || 'Chat generation failed. Your unsent message has been restored below.';
          setError(friendlyMsg);
          if (!accumulatedContent && toolCallsAccumulator.length === 0) {
            restoreUnsentUserTurn();
          }
        }
      } finally {
        setIsGenerating(false);
        setStreamingContent('');
        setStreamingThought('');
        setActiveToolCall(null);
        setActiveToolResult(null);
        setStreamingToolCalls([]);
        setStreamingToolResults([]);
        abortControllerRef.current = null;
      }
    },
    [conversationId, modelId, messages, isGenerating, enableWebSearch, persist]
  );

  // 5b. Confirm or cancel a sensitive / external-write tool invocation
  const resolveToolConfirmation = useCallback(
    async (messageId: string, toolResult: BotToolResult, approved: boolean) => {
      const preview = toolResult.actionPreview;
      if (!preview) return;

      const res = await fetch('/api/bot/tools/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolName: toolResult.toolName,
          arguments: preview.arguments,
          actionKey: preview.actionKey,
          approved,
          conversationId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      const resolutionStatus = approved ? 'approved' : 'rejected';

      setMessages((prev) => {
        const next = prev.map((msg) => {
          if (msg.id !== messageId || !msg.toolResults) return msg;
          return {
            ...msg,
            toolResults: msg.toolResults.map((tr) =>
              tr.toolCallId === toolResult.toolCallId
                ? {
                    ...tr,
                    confirmationRequired: false,
                    status: data.status || (approved ? 'success' : 'denied'),
                    isError: Boolean(data.isError),
                    result: data.result ?? tr.result,
                    actionPreview: tr.actionPreview
                      ? { ...tr.actionPreview, resolution: resolutionStatus as 'approved' | 'rejected' }
                      : undefined,
                  }
                : tr
            ),
          };
        });
        persist(next, undefined, undefined, true);
        return next;
      });
    },
    [conversationId, persist]
  );

  // 6. Stop generation handler
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // 7. Regenerate last response (or resend preserved failed draft)
  const retryFailed = useCallback(async () => {
    if (isGenerating) return;
    setError(null);
    if (restoredDraft) {
      const draft = restoredDraft;
      setRestoredDraft(null);
      await sendMessage(draft.content, draft.attachments);
      return;
    }
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];
    const trimmedHistory = [...messages];
    if (lastMsg.role === 'assistant') {
      trimmedHistory.pop();
      setMessages(trimmedHistory);
      persist(trimmedHistory);
    }

    if (trimmedHistory.length === 0) return;

    const lastUserMsg = trimmedHistory[trimmedHistory.length - 1];
    if (lastUserMsg.role === 'user') {
      const baseHistory = trimmedHistory.slice(0, -1);
      setMessages(baseHistory);
      persist(baseHistory);
      await sendMessage(lastUserMsg.content, lastUserMsg.attachments);
    }
  }, [isGenerating, messages, persist, restoredDraft, sendMessage]);

  const regenerate = retryFailed;

  // 8. Edit user message and re-send
  const editUserMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (isGenerating) return;
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const targetMsg = messages[index];
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
        void patchConversationOnServer(conversationId, { modelId: id });
      }
    },
    [conversationId]
  );

  // 12. Phase 7: Explicit Personalization, Conversation Lifecycle & Sign Out
  const updatePreferences = useCallback(async (patch: Partial<UserPreferences>) => {
    const res = await fetch('/api/bot/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.preferences) {
        setPreferences(data.preferences);
        if (typeof data.preferences.defaultWebSearch === 'boolean') {
          setEnableWebSearch(data.preferences.defaultWebSearch);
        }
        return data.preferences as UserPreferences;
      }
    }
    return null;
  }, [setEnableWebSearch]);

  const signOutUser = useCallback(
    async (allDevices = false) => {
      stopGeneration();
      await fetch('/api/bot/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allDevices }),
      }).catch(() => {});

      if (authType === 'admin_session') {
        try {
          const { signOut } = await import('next-auth/react');
          await signOut({ redirect: false });
        } catch {}
      }

      clearAllStoredConversations();
      const freshId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setConversationId(freshId);
      setMessages([]);
      setTitle('New Conversation');
      await refreshSessionAndConversations({ forceServerReplace: true });
    },
    [authType, refreshSessionAndConversations, stopGeneration]
  );

  const clearAllConversations = useCallback(async () => {
    stopGeneration();
    clearAllStoredConversations();
    await clearAllServerConversations();
    const freshId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setConversationId(freshId);
    setMessages([]);
    setTitle('New Conversation');
  }, [stopGeneration]);

  return {
    conversationId,
    title,
    messages,
    modelId,
    availableModels,
    isFallback,
    fallbackReason,
    enableWebSearch,
    setEnableWebSearch,
    isGenerating,
    streamingContent,
    streamingThought,
    activeToolCall,
    activeToolResult,
    streamingToolCalls,
    streamingToolResults,
    error,
    sessionNotice,
    dismissSessionNotice: () => setSessionNotice(null),
    restoredDraft,
    // Auth & Preferences (Phase 7)
    authUser,
    authType,
    isAuthenticated,
    authLoading,
    preferences,
    updatePreferences,
    refreshSessionAndConversations,
    signOutUser,
    // Actions
    sendMessage,
    stopGeneration,
    regenerate,
    editUserMessage,
    resolveToolConfirmation,
    startNewConversation,
    switchConversation,
    setModelId,
    renameConversation: renameStoredConversation,
    togglePinConversation,
    archiveConversation: archiveStoredConversation,
    restoreConversation: restoreStoredConversation,
    deleteConversation: deleteStoredConversation,
    clearAllConversations,
  };
}
