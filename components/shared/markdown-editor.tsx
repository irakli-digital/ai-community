'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';
import remarkMark from '@/lib/remark-mark';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  Heading4,
  Code,
  CodeSquare,
  Link,
  ImageIcon,
  Table,
  Minus,
  Highlighter,
  MessageSquare,
  Eye,
  Columns2,
  Pencil,
} from 'lucide-react';

type ViewMode = 'edit' | 'split' | 'preview';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  placeholder?: string;
}

interface ToolbarAction {
  icon: typeof Bold;
  label: string;
  action: () => void;
}

export function MarkdownEditor({
  value,
  onChange,
  minRows = 12,
  placeholder = 'Write your content in Markdown...',
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [debouncedValue, setDebouncedValue] = useState(value);

  // Debounce preview rendering
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  // On mobile, default to edit-only
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('edit');
    }
  }, []);

  /** Insert text around selection or at cursor */
  const wrapSelection = useCallback(
    (before: string, after: string = '') => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = value.slice(start, end);
      const replacement = `${before}${selected || 'text'}${after}`;

      const newValue = value.slice(0, start) + replacement + value.slice(end);
      onChange(newValue);

      // Restore cursor inside the wrapping
      requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + before.length;
        const cursorEnd = cursorStart + (selected || 'text').length;
        textarea.setSelectionRange(cursorStart, cursorEnd);
      });
    },
    [value, onChange]
  );

  /** Insert text at cursor, replacing selection */
  const insertAtCursor = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newValue = value.slice(0, start) + text + value.slice(end);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const cursorPos = start + text.length;
        textarea.setSelectionRange(cursorPos, cursorPos);
      });
    },
    [value, onChange]
  );

  /** Insert text at start of the current line */
  const insertLinePrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const newValue = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      onChange(newValue);

      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + prefix.length;
        textarea.setSelectionRange(newPos, newPos);
      });
    },
    [value, onChange]
  );

  // Toolbar actions
  const toolbarActions = useMemo<ToolbarAction[]>(
    () => [
      { icon: Bold, label: 'Bold', action: () => wrapSelection('**', '**') },
      { icon: Italic, label: 'Italic', action: () => wrapSelection('_', '_') },
      { icon: Heading2, label: 'H2', action: () => insertLinePrefix('## ') },
      { icon: Heading3, label: 'H3', action: () => insertLinePrefix('### ') },
      { icon: Heading4, label: 'H4', action: () => insertLinePrefix('#### ') },
      { icon: Code, label: 'Inline code', action: () => wrapSelection('`', '`') },
      {
        icon: CodeSquare,
        label: 'Code block',
        action: () => insertAtCursor('\n```js\n\n```\n'),
      },
      {
        icon: Link,
        label: 'Link',
        action: () => wrapSelection('[', '](url)'),
      },
      {
        icon: ImageIcon,
        label: 'Image',
        action: () => insertAtCursor('![alt text](url)'),
      },
      {
        icon: Table,
        label: 'Table',
        action: () =>
          insertAtCursor(
            '\n| Header 1 | Header 2 | Header 3 |\n| --- | --- | --- |\n| Cell 1 | Cell 2 | Cell 3 |\n| Cell 4 | Cell 5 | Cell 6 |\n'
          ),
      },
      {
        icon: Minus,
        label: 'Horizontal rule',
        action: () => insertAtCursor('\n---\n'),
      },
    ],
    [wrapSelection, insertAtCursor, insertLinePrefix]
  );

  // Callout dropdown items
  const calloutTypes = useMemo(
    () => [
      { type: 'TIP', label: 'Tip' },
      { type: 'NOTE', label: 'Note' },
      { type: 'WARNING', label: 'Warning' },
      { type: 'CAUTION', label: 'Caution' },
      { type: 'IMPORTANT', label: 'Important' },
    ],
    []
  );

  const [showCalloutMenu, setShowCalloutMenu] = useState(false);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);

  const highlightColors = useMemo(
    () => [
      { prefix: '', label: 'Default', css: 'bg-primary/20' },
      { prefix: 'yellow:', label: 'Yellow', css: 'bg-yellow-500/25' },
      { prefix: 'green:', label: 'Green', css: 'bg-green-500/25' },
      { prefix: 'blue:', label: 'Blue', css: 'bg-blue-500/25' },
      { prefix: 'red:', label: 'Red', css: 'bg-red-500/25' },
      { prefix: 'purple:', label: 'Purple', css: 'bg-purple-500/25' },
    ],
    []
  );

  /** Handle keyboard shortcuts */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'b') {
        e.preventDefault();
        wrapSelection('**', '**');
      } else if (isMod && e.key === 'i') {
        e.preventDefault();
        wrapSelection('_', '_');
      } else if (isMod && e.key === 'k') {
        e.preventDefault();
        wrapSelection('[', '](url)');
      } else if (isMod && e.key === '`') {
        e.preventDefault();
        wrapSelection('`', '`');
      } else if (e.key === 'Tab') {
        e.preventDefault();
        insertAtCursor('  ');
      }
    },
    [wrapSelection, insertAtCursor]
  );

  /** Ratio-based scroll sync */
  const handleScroll = useCallback(() => {
    if (viewMode !== 'split') return;
    const textarea = textareaRef.current;
    const preview = previewRef.current;
    if (!textarea || !preview) return;

    const ratio =
      textarea.scrollTop /
      (textarea.scrollHeight - textarea.clientHeight || 1);
    preview.scrollTop =
      ratio * (preview.scrollHeight - preview.clientHeight);
  }, [viewMode]);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary px-2 py-1.5">
        {toolbarActions.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            title={item.label}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <item.icon className="h-4 w-4" />
          </button>
        ))}

        {/* Highlight color dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightMenu(!showHighlightMenu);
              setShowCalloutMenu(false);
            }}
            title="Highlight"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Highlighter className="h-4 w-4" />
          </button>
          {showHighlightMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-border bg-card py-1 shadow-lg">
              {highlightColors.map((hc) => (
                <button
                  key={hc.prefix || 'default'}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  onClick={() => {
                    wrapSelection(`==${hc.prefix}`, '==');
                    setShowHighlightMenu(false);
                  }}
                >
                  <span className={cn('inline-block h-3 w-3 rounded-sm', hc.css)} />
                  {hc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Callout dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowCalloutMenu(!showCalloutMenu);
              setShowHighlightMenu(false);
            }}
            title="Callout"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          {showCalloutMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-border bg-card py-1 shadow-lg">
              {calloutTypes.map((ct) => (
                <button
                  key={ct.type}
                  type="button"
                  className="block w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  onClick={() => {
                    insertAtCursor(
                      `\n> [!${ct.type}]\n> Your ${ct.label.toLowerCase()} here\n`
                    );
                    setShowCalloutMenu(false);
                  }}
                >
                  {ct.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex items-center rounded-md border border-border bg-background">
          {(
            [
              { mode: 'edit' as const, icon: Pencil, label: 'Edit' },
              { mode: 'split' as const, icon: Columns2, label: 'Split' },
              { mode: 'preview' as const, icon: Eye, label: 'Preview' },
            ] as const
          ).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              title={label}
              className={cn(
                'px-2 py-1 text-xs transition-colors',
                viewMode === mode
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Editor area */}
      <div
        className={cn(
          'flex',
          viewMode === 'split' ? 'divide-x divide-border' : ''
        )}
      >
        {/* Edit pane */}
        {viewMode !== 'preview' && (
          <div className={cn('flex-1', viewMode === 'split' ? 'w-1/2' : 'w-full')}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onScroll={handleScroll}
              placeholder={placeholder}
              rows={minRows}
              className="w-full resize-y bg-background px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              style={{ minHeight: `${minRows * 1.5}rem` }}
            />
          </div>
        )}

        {/* Preview pane */}
        {viewMode !== 'edit' && (
          <div
            ref={previewRef}
            className={cn(
              'overflow-y-auto bg-background px-4 py-3',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}
            style={{ minHeight: `${minRows * 1.5}rem`, maxHeight: '600px' }}
          >
            {debouncedValue ? (
              <div className="rich-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkGithubAlerts, remarkMark]}
                  rehypePlugins={[rehypeRaw]}
                >
                  {debouncedValue}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Preview will appear here...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
