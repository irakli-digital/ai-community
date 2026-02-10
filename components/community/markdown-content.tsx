import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ children, href, ...props }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
            {...props}
          >
            {children}
          </a>
        ),
        code: ({ children, className, ...props }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code
                className="rounded bg-secondary px-1 py-0.5 text-sm"
                {...props}
              >
                {children}
              </code>
            );
          }
          return (
            <code
              className={`block overflow-x-auto rounded bg-secondary p-3 text-sm ${className || ''}`}
              {...props}
            >
              {children}
            </code>
          );
        },
        img: ({ src, alt }) => (
          <img
            src={src}
            alt={alt || ''}
            className="max-w-full rounded-lg"
            loading="lazy"
          />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
