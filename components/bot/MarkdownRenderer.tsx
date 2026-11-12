'use client';

import React, { useState } from 'react';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

/**
 * High-performance, streaming-friendly Markdown, Code & Math Renderer
 * Renders syntax-styled code blocks with Copy buttons, LaTeX math, tables, lists, and quotes.
 */
export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  if (!content) return null;

  // Split content into blocks: code fences, math blocks, tables, and standard prose
  const blocks = parseBlocks(content);

  return (
    <div className="quantumbot-prose text-gray-200 text-[15px] leading-relaxed space-y-3.5 break-words">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return (
            <CodeBlock
              key={idx}
              language={block.language || 'text'}
              code={block.content}
            />
          );
        }

        if (block.type === 'math_display') {
          return (
            <div
              key={idx}
              className="my-3 overflow-x-auto py-2.5 px-4 rounded-lg bg-[#070D18]/90 border border-cyan-950/60 font-mono text-cyan-200 text-center tracking-wide text-sm shadow-inner"
            >
              {block.content}
            </div>
          );
        }

        if (block.type === 'table') {
          return <TableBlock key={idx} rawTable={block.content} />;
        }

        return (
          <ProseBlock
            key={idx}
            text={block.content}
            isStreaming={isStreaming && idx === blocks.length - 1}
          />
        );
      })}
    </div>
  );
}

// Block parser
interface Block {
  type: 'prose' | 'code' | 'math_display' | 'table';
  content: string;
  language?: string;
}

function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split('\n');
  let currentProse: string[] = [];
  let inCode = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let inMath = false;
  let mathBuffer: string[] = [];
  let inTable = false;
  let tableBuffer: string[] = [];

  const flushProse = () => {
    if (currentProse.length > 0) {
      blocks.push({ type: 'prose', content: currentProse.join('\n') });
      currentProse = [];
    }
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      blocks.push({ type: 'table', content: tableBuffer.join('\n') });
      tableBuffer = [];
      inTable = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. Code Fence (```)
    if (line.trim().startsWith('```')) {
      if (inCode) {
        // End code block
        blocks.push({
          type: 'code',
          content: codeBuffer.join('\n'),
          language: codeLang.toLowerCase(),
        });
        codeBuffer = [];
        codeLang = '';
        inCode = false;
      } else {
        // Start code block
        flushProse();
        flushTable();
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(line);
      continue;
    }

    // 2. Display Math ($$ ... $$)
    if (line.trim().startsWith('$$')) {
      if (inMath) {
        blocks.push({
          type: 'math_display',
          content: mathBuffer.join('\n'),
        });
        mathBuffer = [];
        inMath = false;
      } else {
        flushProse();
        flushTable();
        // Check single-line $$ formula $$
        const singleLineMatch = line.trim().match(/^\$\$(.+)\$\$$/);
        if (singleLineMatch) {
          blocks.push({
            type: 'math_display',
            content: singleLineMatch[1].trim(),
          });
        } else {
          inMath = true;
        }
      }
      continue;
    }

    if (inMath) {
      mathBuffer.push(line);
      continue;
    }

    // 3. Table row detector (| a | b |)
    const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
    if (isTableRow) {
      flushProse();
      inTable = true;
      tableBuffer.push(line);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Regular Prose
    currentProse.push(line);
  }

  // Flush remaining buffers
  flushProse();
  flushTable();
  if (inCode && codeBuffer.length > 0) {
    blocks.push({
      type: 'code',
      content: codeBuffer.join('\n'),
      language: codeLang.toLowerCase(),
    });
  }
  if (inMath && mathBuffer.length > 0) {
    blocks.push({
      type: 'math_display',
      content: mathBuffer.join('\n'),
    });
  }

  return blocks;
}

/**
 * Syntax-highlighted Code Block with Copy Feedback
 */
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-gray-800/80 bg-[#060913] text-sm shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0b1020] border-b border-gray-800/60 select-none">
        <span className="text-xs font-mono font-medium tracking-wider text-cyan-400 uppercase">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800/60 transition-colors"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-400 font-medium">Copied!</span>
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
      </div>
      <div className="p-3.5 overflow-x-auto font-mono text-[13.5px] leading-relaxed text-gray-200 whitespace-pre">
        <code>{code}</code>
      </div>
    </div>
  );
}

/**
 * Markdown Table Renderer
 */
function TableBlock({ rawTable }: { rawTable: string }) {
  const lines = rawTable.trim().split('\n');
  if (lines.length < 2) return <div>{rawTable}</div>;

  const parseRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim());

  const headers = parseRow(lines[0]);
  // line 1 is separator |---|---|
  const rows = lines.slice(2).map(parseRow);

  return (
    <div className="my-3.5 overflow-x-auto rounded-lg border border-gray-800/80 bg-[#070b16]">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-[#0d1424]">
            {headers.map((h, i) => (
              <th key={i} className="py-2 px-3 font-semibold text-cyan-300 tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-gray-800/30 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="py-2 px-3 text-gray-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Prose and Inline elements renderer
 */
function ProseBlock({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Headers
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-xl font-bold text-white mt-4 mb-2 font-mono tracking-tight">
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-semibold text-white mt-3.5 mb-2 font-mono tracking-tight">
              {renderInline(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-semibold text-cyan-200 mt-3 mb-1.5">
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="border-l-2 border-cyan-500/70 pl-3.5 my-2.5 italic text-gray-300 bg-cyan-950/20 py-1 rounded-r"
            >
              {renderInline(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Unordered List
        if (trimmed.split('\n').every((l) => l.trim().startsWith('- ') || l.trim().startsWith('* '))) {
          const items = trimmed.split('\n').map((l) => l.trim().slice(2));
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 my-2 text-gray-300 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ul>
          );
        }

        // Ordered List
        if (trimmed.split('\n').every((l) => /^\d+\.\s/.test(l.trim()))) {
          const items = trimmed.split('\n').map((l) => l.trim().replace(/^\d+\.\s/, ''));
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1 my-2 text-gray-300 pl-1">
              {items.map((item, iIdx) => (
                <li key={iIdx} className="leading-relaxed">
                  {renderInline(item)}
                </li>
              ))}
            </ol>
          );
        }

        // Standard Paragraph
        return (
          <p key={pIdx} className="leading-relaxed">
            {renderInline(trimmed)}
            {isStreaming && pIdx === paragraphs.length - 1 && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
            )}
          </p>
        );
      })}
    </>
  );
}

/**
 * Parses inline elements: `code`, $math$, **bold**, *italic*, [link](url)
 */
function renderInline(str: string): React.ReactNode[] {
  // Regex pattern matching inline code, inline math, links, bold, and italic
  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\$[^\$]+\$|\[[^\]]+\]\([^\)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.slice(lastIndex, match.index));
    }

    const token = match[0];

    // Inline Code
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded text-[13px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    // Inline Math
    else if (token.startsWith('$') && token.endsWith('$')) {
      parts.push(
        <span
          key={match.index}
          className="px-1 font-mono text-cyan-200 tracking-wide text-sm bg-[#0a1220]/60 rounded"
        >
          {token.slice(1, -1)}
        </span>
      );
    }
    // Markdown Link (strictly sanitize URL protocol to prevent javascript:/data: XSS)
    else if (token.startsWith('[') && token.includes('](')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const safeUrl = sanitizeMarkdownHref(linkMatch[2]);
        if (safeUrl) {
          const isExternal = /^https?:\/\//i.test(safeUrl);
          parts.push(
            <a
              key={match.index}
              href={safeUrl}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 inline-flex items-center gap-0.5"
            >
              {linkMatch[1]}
              {isExternal && (
                <svg className="w-3 h-3 inline ml-0.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          );
        } else {
          parts.push(
            <span key={match.index} className="text-gray-400 font-mono text-xs" title="Unsafe link protocol blocked">
              {linkMatch[1]}
            </span>
          );
        }
      }
    }
    // Bold
    else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    // Italic
    else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-gray-200">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < str.length) {
    parts.push(str.slice(lastIndex));
  }

  return parts;
}

/**
 * Only permit safe URL schemes inside rendered Markdown anchors to block javascript:/data:/vbscript: XSS.
 */
export function sanitizeMarkdownHref(rawHref: string): string | null {
  const cleaned = (rawHref || '').trim().replace(/[\x00-\x1f\x7f]/g, '');
  if (!cleaned) return null;
  if (cleaned.startsWith('/') && !cleaned.startsWith('//')) return cleaned;
  if (cleaned.startsWith('#')) return cleaned;
  try {
    const parsed = new URL(cleaned);
    if (
      parsed.protocol === 'https:' ||
      parsed.protocol === 'http:' ||
      parsed.protocol === 'mailto:'
    ) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}
