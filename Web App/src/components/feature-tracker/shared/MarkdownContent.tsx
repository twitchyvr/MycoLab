// ============================================================================
// MARKDOWN CONTENT RENDERER
// Simple markdown to HTML converter for feature notes
// ============================================================================

import React, { useMemo } from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
  compact?: boolean;
}

/**
 * Parse and render basic markdown content
 * Supports: headers, bold, lists (checked/unchecked), code blocks, links
 */
export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  className = '',
  compact = false,
}) => {
  const rendered = useMemo(() => {
    if (!content) return null;

    // Split into lines for processing
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';

    const flushList = () => {
      if (currentList.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-1 my-2">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    const flushCodeBlock = () => {
      if (codeBlockContent.length > 0) {
        elements.push(
          <pre
            key={`code-${elements.length}`}
            className="bg-zinc-800/50 rounded-lg p-3 text-xs font-mono text-zinc-300 overflow-x-auto my-2"
          >
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        codeBlockLang = '';
      }
    };

    const parseInline = (text: string): React.ReactNode => {
      // Process inline formatting
      let result: React.ReactNode[] = [];
      let remaining = text;
      let key = 0;

      // Bold **text**
      const boldRegex = /\*\*([^*]+)\*\*/g;
      // Code `text`
      const codeRegex = /`([^`]+)`/g;
      // Links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

      // Simple approach: replace patterns sequentially
      remaining = remaining.replace(boldRegex, '###BOLD_START###$1###BOLD_END###');
      remaining = remaining.replace(codeRegex, '###CODE_START###$1###CODE_END###');
      remaining = remaining.replace(linkRegex, '###LINK_START###$1###LINK_SEP###$2###LINK_END###');

      // Split and render
      const parts = remaining.split(/(###[A-Z_]+###)/);
      let inBold = false;
      let inCode = false;
      let linkText = '';
      let inLink = false;

      for (const part of parts) {
        if (part === '###BOLD_START###') {
          inBold = true;
          continue;
        }
        if (part === '###BOLD_END###') {
          inBold = false;
          continue;
        }
        if (part === '###CODE_START###') {
          inCode = true;
          continue;
        }
        if (part === '###CODE_END###') {
          inCode = false;
          continue;
        }
        if (part === '###LINK_START###') {
          inLink = true;
          continue;
        }
        if (part === '###LINK_SEP###') {
          continue;
        }
        if (part === '###LINK_END###') {
          inLink = false;
          continue;
        }

        if (!part) continue;

        if (inBold) {
          result.push(
            <strong key={key++} className="font-semibold text-zinc-200">
              {part}
            </strong>
          );
        } else if (inCode) {
          result.push(
            <code key={key++} className="px-1.5 py-0.5 bg-zinc-800 rounded text-emerald-400 text-xs font-mono">
              {part}
            </code>
          );
        } else if (inLink) {
          const [text, url] = part.split('###LINK_SEP###');
          if (url) {
            result.push(
              <a
                key={key++}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                {text || url}
              </a>
            );
          } else {
            linkText = part;
          }
        } else {
          result.push(part);
        }
      }

      return result.length === 1 ? result[0] : result;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code block start/end
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock();
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
          codeBlockLang = trimmed.slice(3);
        }
        continue;
      }

      // Inside code block
      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Empty line
      if (!trimmed) {
        flushList();
        continue;
      }

      // Headers
      if (trimmed.startsWith('####')) {
        flushList();
        elements.push(
          <h4 key={i} className="text-sm font-semibold text-zinc-300 mt-3 mb-1">
            {parseInline(trimmed.slice(4).trim())}
          </h4>
        );
        continue;
      }
      if (trimmed.startsWith('###')) {
        flushList();
        elements.push(
          <h3 key={i} className="text-base font-semibold text-zinc-200 mt-4 mb-2">
            {parseInline(trimmed.slice(3).trim())}
          </h3>
        );
        continue;
      }
      if (trimmed.startsWith('##')) {
        flushList();
        elements.push(
          <h2 key={i} className="text-lg font-bold text-zinc-100 mt-4 mb-2">
            {parseInline(trimmed.slice(2).trim())}
          </h2>
        );
        continue;
      }
      if (trimmed.startsWith('#')) {
        flushList();
        elements.push(
          <h1 key={i} className="text-xl font-bold text-zinc-100 mt-4 mb-2">
            {parseInline(trimmed.slice(1).trim())}
          </h1>
        );
        continue;
      }

      // Checkbox list items - [x] or [ ]
      if (trimmed.startsWith('- [x]') || trimmed.startsWith('- [X]')) {
        currentList.push(
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-emerald-400 mt-0.5">✓</span>
            <span className="text-zinc-400 line-through">
              {parseInline(trimmed.slice(5).trim())}
            </span>
          </li>
        );
        continue;
      }
      if (trimmed.startsWith('- [ ]')) {
        currentList.push(
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-zinc-600 mt-0.5">○</span>
            <span className="text-zinc-300">
              {parseInline(trimmed.slice(5).trim())}
            </span>
          </li>
        );
        continue;
      }

      // Regular list items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        currentList.push(
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-zinc-600 mt-1">•</span>
            <span className="text-zinc-300">
              {parseInline(trimmed.slice(2).trim())}
            </span>
          </li>
        );
        continue;
      }

      // Numbered list
      const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        currentList.push(
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="text-zinc-500 w-5 text-right shrink-0">{numberedMatch[1]}.</span>
            <span className="text-zinc-300">
              {parseInline(numberedMatch[2])}
            </span>
          </li>
        );
        continue;
      }

      // Regular paragraph
      flushList();
      elements.push(
        <p key={i} className="text-sm text-zinc-400 my-1">
          {parseInline(trimmed)}
        </p>
      );
    }

    // Flush remaining
    flushList();
    flushCodeBlock();

    return elements;
  }, [content]);

  if (!content) return null;

  return (
    <div className={`markdown-content ${compact ? 'text-xs' : ''} ${className}`}>
      {rendered}
    </div>
  );
};

export default MarkdownContent;
