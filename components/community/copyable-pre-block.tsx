'use client';

import { useRef, useState, type ComponentPropsWithoutRef } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyablePreBlock(props: ComponentPropsWithoutRef<'pre'>) {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const text = preRef.current?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group my-5">
      <pre
        ref={preRef}
        className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm"
        {...props}
      />
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md bg-background/80 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        title="Copy code"
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
