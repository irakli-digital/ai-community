import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { remarkGithubAlertsConfig } from '@/lib/markdown-config';
import remarkMark from '@/lib/remark-mark';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import rehypeHighlight from 'rehype-highlight';
import type { ComponentPropsWithoutRef } from 'react';
import { CopyablePreBlock } from './copyable-pre-block';
import { getImageVariantUrl } from '@/lib/storage/image-utils';

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'mark'],
  attributes: {
    ...defaultSchema.attributes,
    div: [...(defaultSchema.attributes?.div || []), 'className'],
    mark: ['className'],
  },
};

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className="rich-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGithubAlertsConfig, remarkMark]}
        rehypePlugins={[
          rehypeRaw,
          [rehypeSanitize, sanitizeSchema],
          rehypeSlug,
          rehypeHighlight,
        ]}
        components={{
          pre: CopyablePreBlock,
          code: CodeBlock,
          a: Anchor,
          img: Image,
          table: Table,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Inline and block code — rehype-highlight adds hljs class to block code */
function CodeBlock(props: ComponentPropsWithoutRef<'code'>) {
  const { className, children, ...rest } = props;
  const isBlock = className && (className.includes('hljs') || className.includes('language-'));
  if (!isBlock) {
    return (
      <code className="rounded bg-secondary px-1 py-0.5 text-sm" {...rest}>
        {children}
      </code>
    );
  }
  return (
    <code className={className} {...rest}>
      {children}
    </code>
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

/** Images with alt text — serves md variant for S3 images */
function Image(props: ComponentPropsWithoutRef<'img'>) {
  const { alt, src, ...rest } = props;
  const variantSrc = typeof src === 'string' ? getImageVariantUrl(src, 'md') : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt || ''}
      src={variantSrc}
      className="max-w-full rounded-lg"
      loading="lazy"
      onError={(e) => { if (typeof src === 'string' && variantSrc !== src && !e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = src; } }}
      {...rest}
    />
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
