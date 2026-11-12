'use client';

import React, { useState } from 'react';
import { BotMessage, BotAttachment, BotToolCall, BotToolResult } from '@/lib/bot/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuantumBotIcon } from './QuantumBotIcon';

interface MessageItemProps {
  message: BotMessage;
  isStreaming?: boolean;
  streamingThought?: string;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onRetry?: () => void;
  onResolveToolConfirmation?: (
    messageId: string,
    toolResult: BotToolResult,
    approved: boolean
  ) => Promise<void> | void;
  isLastAssistant?: boolean;
}

export function describeToolCallLabel(tc: BotToolCall, tr?: BotToolResult): string {
  const done = Boolean(tr);
  switch (tc.name) {
    case 'web_search':
      return done
        ? `Web search: "${tc.arguments?.query || ''}"`
        : `Searching the web for "${tc.arguments?.query || ''}"...`;
    case 'web_fetch':
      return done
        ? `Fetched source: ${tc.arguments?.url || ''}`
        : `Reading webpage ${tc.arguments?.url || ''}...`;
    case 'query_quantum_ai_knowledge':
      return done
        ? `Quantum AI Knowledge: "${tc.arguments?.query || ''}"`
        : `Looking up Quantum AI info for "${tc.arguments?.query || ''}"...`;
    case 'calculate':
      return done
        ? `Calculated: ${tc.arguments?.expression || ''}`
        : `Calculating ${tc.arguments?.expression || ''}...`;
    case 'get_current_time':
      return done
        ? `System clock (${tc.arguments?.timezone || 'UTC'})`
        : `Checking current time...`;
    case 'submit_quantum_ai_inquiry':
      return tr?.actionPreview?.resolution === 'approved'
        ? 'Submitted inquiry to Quantum AI'
        : tr?.actionPreview?.resolution === 'rejected'
        ? 'Cancelled inquiry submission'
        : tr?.confirmationRequired
        ? 'Awaiting confirmation to send inquiry'
        : 'Preparing Quantum AI inquiry...';
    default:
      return done ? `Tool: ${tc.name}` : `Running ${tc.name}...`;
  }
}

function extractCitedSources(toolResults?: BotToolResult[]) {
  if (!toolResults || toolResults.length === 0) return [];
  const seen = new Set<string>();
  const sources: Array<{ title: string; url: string; domain: string }> = [];

  for (const tr of toolResults) {
    if (!tr?.result || typeof tr.result !== 'object') continue;
    if (tr.toolName === 'web_search' && Array.isArray(tr.result.results)) {
      for (const item of tr.result.results) {
        if (item?.url && /^https?:\/\//i.test(item.url) && !seen.has(item.url)) {
          seen.add(item.url);
          sources.push({
            title: String(item.title || item.domain || item.url),
            url: String(item.url),
            domain: String(item.domain || 'web'),
          });
        }
      }
    } else if (tr.toolName === 'web_fetch' && tr.result.available && tr.result.url) {
      const url = String(tr.result.url);
      if (/^https?:\/\//i.test(url) && !seen.has(url)) {
        seen.add(url);
        sources.push({
          title: String(tr.result.title || tr.result.domain || url),
          url,
          domain: String(tr.result.domain || 'web'),
        });
      }
    }
  }
  return sources;
}

export function MessageItem({
  message,
  isStreaming = false,
  streamingThought,
  onRegenerate,
  onEdit,
  onRetry,
  onResolveToolConfirmation,
  isLastAssistant = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showTools, setShowTools] = useState(false);
  const [resolvingCallId, setResolvingCallId] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  if (isUser) {
    return (
      <div className="group flex justify-end w-full my-3 px-2">
        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-end">
          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.attachments.map((att) => (
                <AttachmentCard key={att.id} attachment={att} />
              ))}
            </div>
          )}

          {isEditing ? (
            <div className="w-full min-w-[280px] p-2 rounded-xl bg-[#0e1628] border border-cyan-500/50">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-transparent text-sm text-white resize-none outline-none font-sans"
                rows={3}
                autoFocus
              />
              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-xs text-gray-400 hover:text-white rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1 text-xs font-medium text-black bg-cyan-400 hover:bg-cyan-300 rounded"
                >
                  Save & Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="relative px-4 py-2.5 rounded-2xl bg-[#131b2e] border border-gray-800 text-gray-100 text-[14.5px] leading-relaxed shadow-sm">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}

          {/* Action Row */}
          {!isEditing && (
            <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gray-500">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="hover:text-cyan-400 transition-colors"
                  title="Edit message"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                className="hover:text-gray-300 transition-colors"
                title="Copy text"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="group flex items-start gap-3 w-full my-4 px-2">
      {/* QuantumBot Emblem Avatar */}
      <div className="mt-0.5 shrink-0">
        <QuantumBotIcon size={30} showGlow />
      </div>

      <div className="flex-1 min-w-0">
        {/* Model & System Thought Notices */}
        {streamingThought && (
          <div className="mb-2 text-xs font-mono text-cyan-400/90 bg-cyan-950/20 border border-cyan-900/40 px-2.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="line-clamp-2">{streamingThought}</span>
          </div>
        )}

        {/* Tool Activity Drawer (Live & Completed) */}
        {((message.toolCalls && message.toolCalls.length > 0) ||
          (message.toolResults && message.toolResults.length > 0)) && (() => {
          const toolResults = message.toolResults || [];
          const hasAnyRunning =
            isStreaming &&
            (message.toolCalls || []).some(
              (tc) => !toolResults.some((tr) => tr.toolCallId === tc.id)
            );
          const citedSources = extractCitedSources(toolResults);
          const pendingConfirmations = toolResults.filter(
            (tr) => tr.actionPreview && (tr.confirmationRequired || tr.actionPreview.resolution)
          );

          return (
            <div className="mb-3 space-y-2.5">
              <div className="rounded-xl border border-gray-800/80 bg-[#070b16] text-xs font-mono overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTools(!showTools)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[#0b1222] text-gray-300 hover:text-cyan-300 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hasAnyRunning
                          ? 'bg-cyan-400 animate-ping'
                          : toolResults.some((tr) => tr.isError)
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                    />
                    <span className="truncate">
                      {hasAnyRunning
                        ? describeToolCallLabel(
                            message.toolCalls![message.toolCalls!.length - 1]
                          )
                        : `${message.toolCalls?.length || toolResults.length} Tool${
                            (message.toolCalls?.length || toolResults.length) > 1 ? 's' : ''
                          } Used`}
                    </span>
                  </span>
                  <span className="text-[10px] text-gray-500 shrink-0">
                    {showTools ? 'Hide details' : 'Inspect'}
                  </span>
                </button>

                {showTools && (
                  <div className="p-2.5 space-y-2 text-[11.5px] bg-[#050812] border-t border-gray-800/70">
                    {(message.toolCalls || []).map((tc, idx) => {
                      const matchedResult = toolResults.find((tr) => tr.toolCallId === tc.id);
                      const statusLabel = matchedResult?.status || (isStreaming ? 'running' : 'done');

                      return (
                        <div key={tc.id || idx} className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-cyan-300 font-semibold truncate">
                              {describeToolCallLabel(tc, matchedResult)}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 border ${
                                matchedResult?.isError || statusLabel === 'denied' || statusLabel === 'timeout'
                                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                                  : matchedResult?.confirmationRequired
                                  ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                                  : 'bg-emerald-950/50 border-emerald-800/50 text-emerald-300'
                              }`}
                            >
                              {statusLabel}
                              {matchedResult?.durationMs !== undefined
                                ? ` · ${matchedResult.durationMs}ms`
                                : ''}
                            </span>
                          </div>
                          <pre className="text-gray-400 text-[11px] overflow-x-auto">
                            {JSON.stringify(tc.arguments, null, 2)}
                          </pre>
                          {matchedResult && (
                            <pre className="text-gray-300 text-[11px] pt-1.5 border-t border-gray-800/70 overflow-x-auto max-h-40">
                              {JSON.stringify(matchedResult.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Guarded Action Confirmation Cards */}
              {pendingConfirmations.map((tr) => {
                const preview = tr.actionPreview!;
                const isResolving = resolvingCallId === tr.toolCallId;
                return (
                  <div
                    key={tr.toolCallId}
                    className="p-3.5 rounded-xl bg-[#0c1428] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.08)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-cyan-300">
                        {preview.title}
                      </span>
                      {preview.resolution && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                            preview.resolution === 'approved'
                              ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                              : 'bg-gray-900 border-gray-700 text-gray-400'
                          }`}
                        >
                          {preview.resolution === 'approved' ? 'Executed' : 'Cancelled'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{preview.summary}</p>

                    <div className="grid gap-1.5 p-2.5 rounded-lg bg-[#060b18] border border-gray-800 text-[11.5px]">
                      {preview.fields.map((f, fIdx) => (
                        <div key={fIdx} className="flex flex-col sm:flex-row sm:gap-2">
                          <span className="font-mono text-gray-400 sm:w-28 shrink-0">
                            {f.label}:
                          </span>
                          <span className="text-gray-100 break-words">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {tr.confirmationRequired && !preview.resolution && onResolveToolConfirmation && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          disabled={isResolving}
                          onClick={async () => {
                            setResolvingCallId(tr.toolCallId);
                            try {
                              await onResolveToolConfirmation(message.id, tr, false);
                            } finally {
                              setResolvingCallId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-mono text-gray-200 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={isResolving}
                          onClick={async () => {
                            setResolvingCallId(tr.toolCallId);
                            try {
                              await onResolveToolConfirmation(message.id, tr, true);
                            } finally {
                              setResolvingCallId(null);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-mono font-semibold transition-colors disabled:opacity-50"
                        >
                          {isResolving ? 'Executing...' : 'Approve & Execute'}
                        </button>
                      </div>
                    )}

                    {preview.resolution === 'approved' && tr.result?.summary && (
                      <p className="text-[11px] font-mono text-emerald-300">
                        {tr.result.summary}
                      </p>
                    )}
                    {preview.resolution === 'approved' && tr.result?.note && !tr.result?.summary && (
                      <p className="text-[11px] font-mono text-amber-300">
                        {tr.result.note}
                      </p>
                    )}
                  </div>
                );
              })}

              {/* Clickable Retrieved Web Sources */}
              {citedSources.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 mr-1">
                    Sources:
                  </span>
                  {citedSources.slice(0, 6).map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#0b1326] border border-gray-800 hover:border-cyan-500/50 text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors max-w-[240px]"
                      title={src.title}
                    >
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">
                        {src.domain}
                      </span>
                      <span className="truncate">{src.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Message Content */}
        <MarkdownRenderer content={message.content} isStreaming={isStreaming} />

        {/* Assistant Action Bar */}
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-gray-300 transition-colors"
            title="Copy message"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>

          {isLastAssistant && onRegenerate && (
            <button
              type="button"
              onClick={onRegenerate}
              className="flex items-center gap-1 hover:text-cyan-400 transition-colors"
              title="Regenerate response"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Regenerate</span>
            </button>
          )}

          {message.model && (
            <span className="text-[10px] font-mono text-gray-500 ml-auto">
              {message.model}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive File Attachment Card + Preview Lightbox / Document Modal
 */
function AttachmentCard({ attachment }: { attachment: BotAttachment }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imgBroken, setImgBroken] = useState(false);
  const [fullPreviewText, setFullPreviewText] = useState<string | null>(
    attachment.textPreview || attachment.textContent || null
  );
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isImage = attachment.kind === 'image' || attachment.mimeType.startsWith('image/');
  const ext = (attachment.extension || attachment.name.split('.').pop() || 'FILE').toUpperCase();
  const isExpired =
    attachment.status === 'expired' ||
    (attachment.expiresAt ? Date.now() > new Date(attachment.expiresAt).getTime() : false);

  const fileUrl =
    attachment.url || (attachment.fileId ? `/api/bot/files/${attachment.fileId}` : undefined);

  const sizeLabel = `${Math.max(1, Math.round(attachment.size / 1024))} KB`;
  const summaryParts: string[] = [];
  if (attachment.extractedSummary?.pageCount) {
    summaryParts.push(`${attachment.extractedSummary.pageCount}p`);
  } else if (attachment.extractedSummary?.sheetNames?.length) {
    summaryParts.push(
      `${attachment.extractedSummary.sheetNames.length} sheet${attachment.extractedSummary.sheetNames.length > 1 ? 's' : ''}`
    );
  } else if (attachment.extractedSummary?.imageDimensions) {
    const d = attachment.extractedSummary.imageDimensions;
    summaryParts.push(`${d.width}×${d.height}`);
  } else if (attachment.extractedSummary?.language) {
    summaryParts.push(attachment.extractedSummary.language);
  }
  summaryParts.push(sizeLabel);

  const handleOpenPreview = async () => {
    if (isExpired) return;
    setIsPreviewOpen(true);

    if (!isImage && attachment.fileId && (!fullPreviewText || fullPreviewText.endsWith('...'))) {
      setLoadingPreview(true);
      setPreviewError(null);
      try {
        const res = await fetch(
          `/api/bot/files/${encodeURIComponent(attachment.fileId)}?preview=text`
        );
        if (res.status === 410) {
          setPreviewError('This file has expired under retention policy.');
        } else if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setPreviewError(data?.error || 'Unable to load preview.');
        } else {
          const data = await res.json();
          if (data?.textContent) {
            setFullPreviewText(data.textContent);
          }
        }
      } catch {
        setPreviewError('Failed to fetch document preview.');
      } finally {
        setLoadingPreview(false);
      }
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpenPreview}
        disabled={isExpired}
        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-colors ${
          isExpired
            ? 'bg-gray-900/40 border-gray-800/60 text-gray-500 opacity-70 cursor-not-allowed'
            : 'bg-gray-900/80 border-gray-800 hover:border-cyan-500/40 text-gray-300 cursor-pointer'
        }`}
        title={isExpired ? 'File expired under retention policy' : `Inspect ${attachment.name}`}
      >
        {isImage && fileUrl && !imgBroken && !isExpired ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fileUrl}
            alt={attachment.name}
            onError={() => setImgBroken(true)}
            className="w-10 h-10 rounded-lg object-cover border border-gray-700 shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-cyan-950/40 border border-cyan-800/40 flex flex-col items-center justify-center shrink-0">
            <span className="text-[10px] font-mono font-bold text-cyan-300 leading-none">
              {ext.slice(0, 4)}
            </span>
          </div>
        )}
        <div className="flex flex-col min-w-0 pr-1">
          <span className="font-medium text-gray-100 truncate max-w-[165px]">
            {attachment.name}
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            {isExpired ? 'Expired · removed' : summaryParts.join(' · ')}
          </span>
        </div>
      </button>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-[1200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div
            className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#090E1D] border border-gray-800 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-[#0c1326]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-[10px] font-mono font-semibold text-cyan-300">
                  {ext}
                </span>
                <span className="text-xs font-medium text-white truncate">
                  {attachment.name}
                </span>
                <span className="text-[10px] font-mono text-gray-400 shrink-0">
                  ({summaryParts.join(' · ')})
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {fileUrl && !isImage && (
                  <a
                    href={fileUrl}
                    download={attachment.name}
                    className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-cyan-950/50 text-xs font-mono text-cyan-300 border border-gray-700"
                  >
                    Download
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                  aria-label="Close preview"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-[#050812]">
              {isImage && fileUrl ? (
                <div className="flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl}
                    alt={attachment.name}
                    className="max-w-full max-h-[68vh] rounded-xl border border-gray-800 object-contain"
                  />
                </div>
              ) : loadingPreview ? (
                <div className="py-8 text-center text-xs font-mono text-cyan-400 animate-pulse">
                  Loading extracted document content...
                </div>
              ) : previewError ? (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs">
                  {previewError}
                </div>
              ) : (
                <pre className="text-xs font-mono text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
                  {fullPreviewText || 'No text preview available for this file.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
