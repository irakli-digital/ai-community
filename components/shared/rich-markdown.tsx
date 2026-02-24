import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeShiki from '@shikijs/rehype';
import { warmDarkTheme } from '@/lib/markdown/shiki-theme';
import { RichCodeBlock } from './rich-markdown-code-block';
import { TableOfContents } from './rich-markdown-toc';
import { cn } from '@/lib/utils';
import type { ComponentPropsWithoutRef } from 'react';

interface RichMarkdownProps {
  content: string;
  showToc?: boolean;
  className?: string;
}

export function RichMarkdown({
  content,
  showToc = false,
  className,
}: RichMarkdownProps) {
  if (!content) return null;

  const markdown = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, [remarkGithubAlerts, { markers: ['TIP', 'NOTE', 'IMPORTANT', 'WARNING', 'CAUTION', 'PROMO'] }]]}
      rehypePlugins={[
        [
          rehypeShiki,
          {
            theme: warmDarkTheme,
          },
        ],
        rehypeSlug,
        [
          rehypeAutolinkHeadings,
          {
            behavior: 'append',
            properties: { className: ['heading-anchor'], ariaHidden: true },
            content: { type: 'text', value: '#' },
          },
        ],
      ]}
      components={{
        pre: PreBlock,
        a: Anchor,
        img: Image,
        table: Table,
      }}
    >
      {content}
    </ReactMarkdown>
  );

  if (showToc) {
    return (
      <div className="flex gap-8 lg:gap-12">
        <div className={cn('rich-prose min-w-0 flex-1', className)}>
          {markdown}
        </div>
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <TableOfContents content={content} />
          </div>
        </aside>
      </div>
    );
  }

  return (
    <div className={cn('rich-prose', className)}>
      {markdown}
    </div>
  );
}

/** Wraps <pre> blocks with the code block component for copy + language label */
function PreBlock(props: ComponentPropsWithoutRef<'pre'>) {
  const { children, ...rest } = props;

  // Shiki renders: <pre class="shiki ..."><code>...</code></pre>
  // react-markdown passes the <code> element as children
  // Extract language from the code element's className
  let language: string | undefined;

  if (
    children &&
    typeof children === 'object' &&
    'props' in children
  ) {
    const codeProps = children.props as Record<string, unknown>;
    const codeClassName = codeProps.className;
    if (typeof codeClassName === 'string') {
      // Match "language-xxx" from class list
      const match = codeClassName.match(/language-(\S+)/);
      if (match) language = match[1];
    }
  }

  return (
    <RichCodeBlock language={language}>
      <pre {...rest}>{children}</pre>
    </RichCodeBlock>
  );
}

/** External links open in a new tab */
function Anchor(props: ComponentPropsWithoutRef<'a'>) {
  const { href, children, className, ...rest } = props;
  const isExternal = href && (href.startsWith('http://') || href.startsWith('https://'));

  return (
    <a
      href={href}
      className={className}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

/** Images with alt text as caption */
function Image(props: ComponentPropsWithoutRef<'img'>) {
  const { alt, ...rest } = props;
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt={alt || ''} {...rest} />
      {alt && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {alt}
        </figcaption>
      )}
    </figure>
  );
}

/** Responsive table wrapper */
function Table(props: ComponentPropsWithoutRef<'table'>) {
  return (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
  );
}
