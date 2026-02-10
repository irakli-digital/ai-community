'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { Copy, Check } from 'lucide-react';

interface RichCodeBlockProps {
  children: ReactNode;
  language?: string;
}

export function RichCodeBlock({ children, language }: RichCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const el = document.createElement('div');
    if (typeof children === 'string') {
      el.textContent = children;
    } else {
      // Extract text from React elements rendered by shiki
      const pre = document.querySelector('[data-copy-source="true"]');
      if (pre) {
        el.textContent = pre.textContent;
      }
    }

    const text = extractText(children);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="group relative my-5 overflow-hidden rounded-lg border border-border bg-secondary">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {/* Code content */}
      <div className="overflow-x-auto [&>pre]:!m-0 [&>pre]:!rounded-none [&>pre]:!border-0 [&>pre]:px-4 [&>pre]:py-3">
        {children}
      </div>
    </div>
  );
}

/** Recursively extract text content from React elements */
function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && 'props' in node) {
    const props = (node as { props: { children?: ReactNode } }).props;
    return extractText(props.children);
  }
  return '';
}
