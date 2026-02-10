'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { List, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TocItem {
  level: number;
  text: string;
  slug: string;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

/** Generate a slug matching rehype-slug output */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/** Extract h2-h4 headings from raw markdown */
function extractHeadings(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Match ## Heading, ### Heading, #### Heading (not inside code blocks)
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`[\]]/g, '').trim();
      items.push({ level, text, slug: slugify(text) });
    }
  }

  return items;
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const [activeSlug, setActiveSlug] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // IntersectionObserver for active heading tracking
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSlug(entry.target.id);
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
    );

    const elements = headings
      .map((h) => document.getElementById(h.slug))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleClick = useCallback(
    (slug: string) => {
      const el = document.getElementById(slug);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveSlug(slug);
        setIsOpen(false);
      }
    },
    []
  );

  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <nav className={cn('text-sm', className)}>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-muted-foreground md:hidden"
      >
        <List className="h-4 w-4" />
        <span className="flex-1 text-left font-medium">Table of Contents</span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* TOC list */}
      <div
        className={cn(
          'mt-2 md:mt-0 md:block',
          isOpen ? 'block' : 'hidden md:block'
        )}
      >
        <div className="hidden items-center gap-2 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground md:flex">
          <List className="h-3.5 w-3.5" />
          On this page
        </div>
        <ul className="space-y-1 border-l border-border">
          {headings.map((h, i) => {
            const indent = (h.level - minLevel) * 12;
            return (
              <li key={`${h.slug}-${i}`}>
                <button
                  onClick={() => handleClick(h.slug)}
                  className={cn(
                    'block w-full border-l-2 py-1 pl-3 text-left transition-colors hover:text-foreground',
                    activeSlug === h.slug
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground'
                  )}
                  style={{ paddingLeft: `${12 + indent}px` }}
                >
                  {h.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
