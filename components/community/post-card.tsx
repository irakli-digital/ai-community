'use client';

import Link from 'next/link';
import { Heart, MessageCircle, Pin } from 'lucide-react';
import { t } from '@/lib/i18n/ka';
import type { FeedPost } from '@/lib/db/community-queries';
import { formatDistanceToNow } from 'date-fns';
import { ka } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: FeedPost;
  onLike?: (postId: number, liked: boolean) => void;
  canLike?: boolean;
}

export function PostCard({ post, onLike, canLike }: PostCardProps) {
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ka,
  });

  const contentPreview =
    post.content.length > 200
      ? post.content.slice(0, 200) + '...'
      : post.content;

  return (
    <div className="rounded-xl border bg-white p-5 transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
            {post.author.avatarUrl ? (
              <img
                src={post.author.avatarUrl}
                alt={post.author.name ?? ''}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              (post.author.name?.[0] ?? '?').toUpperCase()
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {post.author.name ?? 'მომხმარებელი'}
            </p>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.isPinned && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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
      <Link href={`/community/${post.id}`}>
        <h3 className="mt-3 text-lg font-semibold text-gray-900 hover:text-gray-700">
          {post.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">
          {contentPreview}
        </p>
      </Link>

      {/* Footer */}
      <div className="mt-4 flex items-center gap-4 border-t pt-3">
        <button
          onClick={() => canLike && onLike?.(post.id, post.liked)}
          className={cn(
            'flex items-center gap-1.5 text-sm transition-colors',
            post.liked
              ? 'text-red-500'
              : canLike
                ? 'text-gray-500 hover:text-red-500'
                : 'cursor-default text-gray-400'
          )}
          disabled={!canLike}
        >
          <Heart
            className={cn('h-4 w-4', post.liked && 'fill-current')}
          />
          {post.likesCount}
        </button>
        <Link
          href={`/community/${post.id}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <MessageCircle className="h-4 w-4" />
          {post.commentsCount}
        </Link>
      </div>
    </div>
  );
}
