'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Pin, Trash2 } from 'lucide-react';
import { t } from '@/lib/i18n/ka';
import type { FeedPost } from '@/lib/db/community-queries';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { LevelBadge } from '@/components/members/level-badge';
import { getImageVariantUrl } from '@/lib/storage/image-utils';
import { getPostUrl } from '@/lib/utils/post-url';

interface PostCardProps {
  post: FeedPost;
  onLike?: (postId: number, liked: boolean) => void;
  onDelete?: (postId: number) => void;
  canLike?: boolean;
  canDelete?: boolean;
  onClick?: (postId: number) => void;
}

export function PostCard({ post, onLike, onDelete, canLike, canDelete, onClick }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  const contentPreview =
    post.content.length > 200
      ? post.content.slice(0, 200) + '...'
      : post.content;

  return (
    <div className="rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
            {post.author.avatarUrl ? (
              <img
                src={getImageVariantUrl(post.author.avatarUrl, 'avatar-sm')}
                alt={post.author.name ?? ''}
                className="h-full w-full rounded-full object-cover"
                onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = post.author.avatarUrl!; } }}
              />
            ) : (
              (post.author.name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={`/members/${post.author.id}`} className="text-sm font-medium text-foreground hover:underline">
                {post.author.name ?? 'User'}
              </Link>
              <LevelBadge level={post.author.level} size="sm" />
            </div>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.isPinned && (
            <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
              <Pin className="h-3 w-3" />
              {t('community.pinnedPost')}
            </span>
          )}
          {post.category && (
            <span
              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: post.category.color }}
            >
              {post.category.name}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <Link
        href={getPostUrl(post)}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick(post.id);
          }
        }}
        className="mt-3 flex gap-4"
      >
        {post.featuredImageUrl && (
          <img
            src={getImageVariantUrl(post.featuredImageUrl, 'sm')}
            alt=""
            className="h-28 w-40 shrink-0 rounded-lg object-cover sm:h-32 sm:w-48"
            onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = post.featuredImageUrl!; } }}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-foreground hover:text-muted-foreground line-clamp-2">
            {post.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
            {contentPreview}
          </p>
        </div>
      </Link>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => canLike && onLike?.(post.id, post.liked)}
            className={cn(
              'flex items-center gap-1.5 text-sm transition-colors',
              post.liked
                ? 'text-red-500'
                : canLike
                  ? 'text-muted-foreground hover:text-red-500'
                  : 'cursor-default text-muted-foreground'
            )}
            disabled={!canLike}
          >
            <Heart
              className={cn('h-4 w-4', post.liked && 'fill-current')}
            />
            {post.likesCount}
          </button>
          <Link
            href={getPostUrl(post)}
            onClick={(e) => {
              if (onClick) {
                e.preventDefault();
                onClick(post.id);
              }
            }}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            {post.commentsCount}
          </Link>
        </div>
        {canDelete && (
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this post?')) {
                onDelete?.(post.id);
              }
            }}
            className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
