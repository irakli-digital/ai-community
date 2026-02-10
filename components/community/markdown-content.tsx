import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGithubAlerts from 'remark-github-alerts';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import type { ComponentPropsWithoutRef } from 'react';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  if (!content) return null;

  return (
    <div className="rich-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkGithubAlerts]}
        rehypePlugins={[
          rehypeSanitize,
          rehypeSlug,
        ]}
        components={{
          pre: PreBlock,
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

/** Styled fenced code block wrapper */
function PreBlock(props: ComponentPropsWithoutRef<'pre'>) {
  return (
    <pre
      className="overflow-x-auto rounded-lg bg-secondary p-4 text-sm"
      {...props}
    />
  );
}

/** Inline and block code */
function CodeBlock(props: ComponentPropsWithoutRef<'code'>) {
  const { className, children, ...rest } = props;
  const isInline = !className;
  if (isInline) {
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

/** Images with alt text */
function Image(props: ComponentPropsWithoutRef<'img'>) {
  const { alt, ...rest } = props;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt || ''} className="max-w-full rounded-lg" loading="lazy" {...rest} />
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
