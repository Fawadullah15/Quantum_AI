'use client';

import React, { useState, useRef, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import { BotAttachment } from '@/lib/bot/types';

interface MessageComposerProps {
  onSend: (content: string, attachments: BotAttachment[]) => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({
  onSend,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Message QuantumBot...',
}: MessageComposerProps) {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<BotAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isGenerating && onStop) {
      onStop();
      return;
    }

    if ((!input.trim() && attachments.length === 0) || disabled) return;

    onSend(input, attachments);
    setInput('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle local file uploads
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: BotAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith('image/');
      const isText =
        file.type.startsWith('text/') ||
        file.name.endsWith('.md') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.csv');

      if (isImage) {
        const base64 = await readFileAsBase64(file);
        newAttachments.push({
          id: `att_${Date.now()}_${i}`,
          name: file.name,
          mimeType: file.type || 'image/jpeg',
          size: file.size,
          url: base64,
          base64: base64.split(',')[1],
        });
      } else if (isText) {
        const text = await readFileAsText(file);
        newAttachments.push({
          id: `att_${Date.now()}_${i}`,
          name: file.name,
          mimeType: file.type || 'text/plain',
          size: file.size,
          textContent: text,
        });
      } else {
        // PDF or binary
        const base64 = await readFileAsBase64(file);
        newAttachments.push({
          id: `att_${Date.now()}_${i}`,
          name: file.name,
          mimeType: file.type || 'application/pdf',
          size: file.size,
          base64: base64.split(',')[1],
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full min-w-0">
      {/* Attachments preview tray */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 px-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900 border border-cyan-800/40 text-xs text-gray-200 shadow-sm"
            >
              <span className="truncate max-w-[120px] font-medium">{att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="text-gray-400 hover:text-rose-400 ml-1 p-0.5 rounded transition-colors"
                title="Remove attachment"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative flex items-end gap-1.5 sm:gap-2 p-2 w-full min-w-0 rounded-2xl bg-[#090E1D] border border-gray-800 focus-within:border-cyan-500/50 shadow-lg transition-all duration-150">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf,text/*,.md,.json,.py,.ts,.js,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isGenerating}
          className="p-2 text-gray-400 hover:text-cyan-400 rounded-xl hover:bg-gray-800/60 transition-colors shrink-0 disabled:opacity-40"
          title="Attach document or image"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>

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
          disabled={disabled || (!isGenerating && !input.trim() && attachments.length === 0)}
          className={`p-2 rounded-xl shrink-0 transition-all duration-150 ${
            isGenerating
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40'
              : input.trim() || attachments.length > 0
              ? 'bg-cyan-400 text-black hover:bg-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
          title={isGenerating ? 'Stop generation' : 'Send message'}
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

// Helpers for reading files
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
