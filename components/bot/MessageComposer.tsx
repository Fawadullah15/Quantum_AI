'use client';

import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, DragEvent } from 'react';
import { BotAttachment, ModelDefinition } from '@/lib/bot/types';

interface MessageComposerProps {
  onSend: (content: string, attachments: BotAttachment[]) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  placeholder?: string;
  conversationId?: string;
  activeModel?: ModelDefinition;
  onSwitchToVisionModel?: () => void;
  enableWebSearch?: boolean;
  onToggleWebSearch?: () => void;
  enterToSend?: boolean;
  restoredDraft?: { key: number; content: string; attachments: BotAttachment[] } | null;
}

const ACCEPTED_FILE_EXTENSIONS =
  '.pdf,.docx,.xlsx,.csv,.tsv,.txt,.md,.markdown,.log,.png,.jpg,.jpeg,.webp,.gif,.ts,.tsx,.js,.jsx,.mjs,.cjs,.py,.go,.rs,.java,.c,.h,.cpp,.hpp,.cc,.cs,.rb,.php,.sql,.sh,.bash,.json,.yaml,.yml,.toml,.xml,.html,.htm,.css,.scss,.prisma,.graphql';

export function MessageComposer({
  onSend,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Message QuantumBot...',
  conversationId,
  activeModel,
  onSwitchToVisionModel,
  enableWebSearch = false,
  onToggleWebSearch,
  enterToSend = true,
  restoredDraft,
}: MessageComposerProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<BotAttachment[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeXhrsRef = useRef<Map<string, XMLHttpRequest>>(new Map());
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastRestoredKeyRef = useRef<number | null>(null);

  // Restore unsent user message & attachments cleanly if a send attempt fails
  useEffect(() => {
    if (!restoredDraft || restoredDraft.key === lastRestoredKeyRef.current) return;
    lastRestoredKeyRef.current = restoredDraft.key;
    if (restoredDraft.content) {
      setInput((prev) => prev || restoredDraft.content);
    }
    if (restoredDraft.attachments?.length) {
      setAttachments((prev) => (prev.length > 0 ? prev : restoredDraft.attachments));
    }
  }, [restoredDraft]);

  const supportsVision = activeModel ? activeModel.capabilities.includes('vision') : true;
  const hasUploading = attachments.some((a) => a.status === 'uploading' || a.status === 'processing');
  const hasImageAttachment = attachments.some(
    (a) => a.status !== 'error' && (a.kind === 'image' || a.mimeType.startsWith('image/'))
  );
  const readyAttachments = attachments.filter((a) => a.status === 'ready');
  const visionBlocked = hasImageAttachment && !supportsVision;

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  // Abort any in-flight uploads on unmount
  useEffect(() => {
    const xhrs = activeXhrsRef.current;
    return () => {
      xhrs.forEach((xhr) => xhr.abort());
      xhrs.clear();
    };
  }, []);

  const uploadSingleFile = (file: File): Promise<void> => {
    const tempId = `att_tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const isImageLocal = file.type.startsWith('image/');
    const localPreviewUrl = isImageLocal ? URL.createObjectURL(file) : undefined;

    const pendingAttachment: BotAttachment = {
      id: tempId,
      name: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      kind: isImageLocal ? 'image' : undefined,
      status: 'uploading',
      progress: 5,
      url: localPreviewUrl,
    };

    setAttachments((prev) => [...prev, pendingAttachment]);
    setUploadError(null);

    return new Promise<void>((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }

      const xhr = new XMLHttpRequest();
      activeXhrsRef.current.set(tempId, xhr);

      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable && ev.total > 0) {
          const pct = Math.min(92, Math.max(8, Math.round((ev.loaded / ev.total) * 92)));
          setAttachments((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: pct,
                    status: pct >= 90 ? 'processing' : 'uploading',
                  }
                : item
            )
          );
        }
      };

      xhr.onload = () => {
        activeXhrsRef.current.delete(tempId);
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

        let parsed: any = null;
        try {
          parsed = JSON.parse(xhr.responseText || '{}');
        } catch {
          parsed = null;
        }

        if (xhr.status >= 200 && xhr.status < 300 && parsed?.attachment) {
          const readyAtt: BotAttachment = parsed.attachment;
          setAttachments((prev) =>
            prev.map((item) => (item.id === tempId ? readyAtt : item))
          );
        } else {
          const errMsg = parsed?.error || `Upload failed (HTTP ${xhr.status}).`;
          setUploadError(`${file.name}: ${errMsg}`);
          setAttachments((prev) => prev.filter((item) => item.id !== tempId));
        }
        resolve();
      };

      xhr.onerror = () => {
        activeXhrsRef.current.delete(tempId);
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        setUploadError(`${file.name}: Network error during upload.`);
        setAttachments((prev) => prev.filter((item) => item.id !== tempId));
        resolve();
      };

      xhr.onabort = () => {
        activeXhrsRef.current.delete(tempId);
        if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
        resolve();
      };

      xhr.open('POST', '/api/bot/files', true);
      xhr.send(formData);
    });
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = Array.from(files);
    uploadQueueRef.current = uploadQueueRef.current.then(async () => {
      for (const f of selected) {
        await uploadSingleFile(f);
      }
    });
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (att: BotAttachment) => {
    const inflight = activeXhrsRef.current.get(att.id);
    if (inflight) {
      inflight.abort();
      activeXhrsRef.current.delete(att.id);
    }

    setAttachments((prev) => prev.filter((a) => a.id !== att.id));

    if (att.fileId) {
      fetch(`/api/bot/files/${encodeURIComponent(att.fileId)}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (enterToSend) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend =
    !disabled &&
    !hasUploading &&
    !visionBlocked &&
    (input.trim().length > 0 || readyAttachments.length > 0);

  const handleSend = () => {
    if (isGenerating && onStop) {
      onStop();
      return;
    }

    if (!canSend) return;

    onSend(input, readyAttachments);
    setInput('');
    setAttachments([]);
    setUploadError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    handleFilesSelected(e.dataTransfer?.files || null);
  };

  return (
    <div
      className="w-full min-w-0"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Upload Error Alert */}
      {uploadError && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between gap-2">
          <span className="truncate">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-rose-300 hover:text-white shrink-0 font-mono text-[11px]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Non-Vision Model + Image Guard Banner */}
      {visionBlocked && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-200 text-xs flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>{activeModel?.name}</strong> does not support image analysis. Remove the image or switch to a vision model.
          </span>
          {onSwitchToVisionModel && (
            <button
              type="button"
              onClick={onSwitchToVisionModel}
              className="px-2.5 py-1 rounded-lg bg-cyan-400 text-black font-mono text-[11px] font-semibold hover:bg-cyan-300 transition-colors shrink-0"
            >
              Switch to Vision Model
            </button>
          )}
        </div>
      )}

      {/* Attachments preview tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((att) => (
            <ComposerAttachmentChip
              key={att.id}
              attachment={att}
              onRemove={() => removeAttachment(att)}
            />
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`relative flex items-end gap-1.5 sm:gap-2 p-2 w-full min-w-0 rounded-2xl bg-[#090E1D] border shadow-lg transition-all duration-150 ${
          isDragging
            ? 'border-cyan-400 ring-2 ring-cyan-400/25 bg-[#0b1328]'
            : 'border-gray-800 focus-within:border-cyan-500/50'
        }`}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-cyan-950/40 border border-dashed border-cyan-400 flex items-center justify-center z-10">
            <span className="text-xs font-mono text-cyan-300">
              Drop PDF, DOCX, XLSX, CSV, code, or images to analyze
            </span>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_FILE_EXTENSIONS}
          onChange={handleFileChange}
          className="hidden"
          aria-label="Upload documents or images"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isGenerating}
          className="p-2 text-gray-400 hover:text-cyan-400 rounded-xl hover:bg-gray-800/60 transition-colors shrink-0 disabled:opacity-40"
          title="Attach PDF, DOCX, XLSX, CSV, TXT, Code, or Images"
          aria-label="Attach files"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
            />
          </svg>
        </button>

        {/* Optional Web Research Toggle */}
        {onToggleWebSearch && (
          <button
            type="button"
            onClick={onToggleWebSearch}
            disabled={disabled || isGenerating}
            aria-pressed={enableWebSearch}
            aria-label={enableWebSearch ? 'Disable Web Research' : 'Enable Web Research'}
            title={
              enableWebSearch
                ? 'Live Web Research is ON — click to turn off'
                : 'Enable live Web Research with source citations'
            }
            className={`px-2 py-1.5 rounded-xl border text-[11px] font-mono flex items-center gap-1 transition-all shrink-0 disabled:opacity-40 ${
              enableWebSearch
                ? 'bg-cyan-500/15 border-cyan-400/60 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.18)]'
                : 'bg-transparent border-gray-800 text-gray-400 hover:text-gray-200 hover:border-gray-700'
            }`}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
            <span className="hidden sm:inline">Search</span>
          </button>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 min-w-0 w-full bg-transparent text-[14px] sm:text-[14.5px] leading-relaxed text-white placeholder-gray-500 outline-none resize-none py-1.5 px-1 max-h-[220px] font-sans"
        />

        {/* Send / Stop Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={isGenerating ? false : !canSend}
          className={`p-2 rounded-xl shrink-0 transition-all duration-150 ${
            isGenerating
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
              : canSend
              ? 'bg-cyan-400 text-black hover:bg-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title={
            isGenerating
              ? 'Stop generation'
              : hasUploading
              ? 'Waiting for file upload to finish...'
              : visionBlocked
              ? 'Current model does not support images'
              : 'Send message'
          }
          aria-label={isGenerating ? 'Stop generation' : 'Send message'}
        >
          {isGenerating ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

function ComposerAttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: BotAttachment;
  onRemove: () => void;
}) {
  const isImage = attachment.kind === 'image' || attachment.mimeType.startsWith('image/');
  const isLoading = attachment.status === 'uploading' || attachment.status === 'processing';
  const ext = (attachment.extension || attachment.name.split('.').pop() || 'FILE').toUpperCase();

  let detail = `${Math.max(1, Math.round(attachment.size / 1024))} KB`;
  if (attachment.status === 'uploading') {
    detail = `${attachment.progress ?? 10}%`;
  } else if (attachment.status === 'processing') {
    detail = 'Extracting...';
  } else if (attachment.extractedSummary?.pageCount) {
    detail = `${attachment.extractedSummary.pageCount}p · ${detail}`;
  } else if (attachment.extractedSummary?.sheetNames?.length) {
    detail = `${attachment.extractedSummary.sheetNames.length} sheet${attachment.extractedSummary.sheetNames.length > 1 ? 's' : ''} · ${detail}`;
  } else if (attachment.extractedSummary?.imageDimensions) {
    const d = attachment.extractedSummary.imageDimensions;
    detail = `${d.width}×${d.height}`;
  } else if (attachment.extractedSummary?.lineCount) {
    detail = `${attachment.extractedSummary.lineCount}L · ${detail}`;
  }

  return (
    <div className="relative overflow-hidden flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[#0e162b] border border-cyan-800/40 text-xs text-gray-200 shadow-sm max-w-[230px]">
      {isImage && attachment.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={attachment.url}
          alt={attachment.name}
          className="w-7 h-7 rounded-lg object-cover border border-gray-700 shrink-0"
        />
      ) : (
        <span className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-[10px] font-mono font-semibold text-cyan-300 shrink-0">
          {ext}
        </span>
      )}

      <div className="flex flex-col min-w-0">
        <span className="truncate font-medium text-[11.5px] text-gray-100">
          {attachment.name}
        </span>
        <span className="text-[10px] font-mono text-gray-400">{detail}</span>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="text-gray-400 hover:text-rose-400 ml-0.5 p-0.5 rounded transition-colors shrink-0"
        title="Remove attachment"
        aria-label={`Remove ${attachment.name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {isLoading && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-cyan-400 transition-all duration-150"
          style={{ width: `${attachment.progress ?? 20}%` }}
        />
      )}
    </div>
  );
}
