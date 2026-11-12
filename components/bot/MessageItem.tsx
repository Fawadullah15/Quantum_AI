'use client';

import React, { useState } from 'react';
import { BotMessage, BotAttachment } from '@/lib/bot/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { QuantumBotIcon } from './QuantumBotIcon';

interface MessageItemProps {
  message: BotMessage;
  isStreaming?: boolean;
  streamingThought?: string;
  onRegenerate?: () => void;
  onEdit?: (newContent: string) => void;
  onRetry?: () => void;
  isLastAssistant?: boolean;
}

export function MessageItem({
  message,
  isStreaming = false,
  streamingThought,
  onRegenerate,
  onEdit,
  onRetry,
  isLastAssistant = false,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showTools, setShowTools] = useState(false);

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

        {/* Tool Invocations Drawer */}
        {((message.toolCalls && message.toolCalls.length > 0) ||
          (message.toolResults && message.toolResults.length > 0)) && (
          <div className="mb-3 rounded-lg border border-gray-800/80 bg-[#070b16] text-xs font-mono overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTools(!showTools)}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-[#0b1222] text-gray-400 hover:text-cyan-300 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Autonomous Tools ({message.toolCalls?.length || 0})
              </span>
              <span className="text-[10px] text-gray-500">{showTools ? 'Hide' : 'Inspect'}</span>
            </button>
            {showTools && (
              <div className="p-2.5 space-y-2 text-[11.5px] bg-[#050812]">
                {message.toolCalls?.map((tc, idx) => (
                  <div key={idx} className="p-2 rounded bg-gray-900/60 border border-gray-800">
                    <span className="text-cyan-400 font-semibold">{tc.name}</span>
                    <pre className="text-gray-400 mt-1 overflow-x-auto">{JSON.stringify(tc.arguments, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
 * File attachment pill / card
 */
function AttachmentCard({ attachment }: { attachment: BotAttachment }) {
  const isImage = attachment.mimeType.startsWith('image/');

  return (
    <div className="flex items-center gap-2 p-1.5 rounded-lg bg-gray-900/80 border border-gray-800 text-xs text-gray-300">
      {isImage && attachment.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-8 h-8 rounded object-cover border border-gray-700"
        />
      ) : (
        <div className="w-8 h-8 rounded bg-cyan-950/40 border border-cyan-800/40 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      <div className="flex flex-col min-w-0 pr-1">
        <span className="font-medium text-gray-200 truncate max-w-[140px]">
          {attachment.name}
        </span>
        <span className="text-[10px] text-gray-500 font-mono">
          {(attachment.size / 1024).toFixed(0)} KB
        </span>
      </div>
    </div>
  );
}
