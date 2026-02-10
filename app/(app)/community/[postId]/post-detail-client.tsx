'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Heart,
  Lock,
  MessageCircle,
  Pin,
  PinOff,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n/ka';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import type { PostDetail, CommentWithAuthor } from '@/lib/db/community-queries';
import { LevelBadge } from '@/components/members/level-badge';
import {
  likePost,
  unlikePost,
  deletePost,
  pinPost,
  unpinPost,
  createComment,
  deleteComment,
  likeComment,
  unlikeComment,
} from '../actions';
import { MarkdownContent } from '@/components/community/markdown-content';
import { AuthModal } from '@/components/auth/auth-modal';
import { hasModRole } from '@/lib/auth/roles';

// ─── Comment Component ──────────────────────────────────────────────────────

function CommentItem({
  comment,
  postId,
  canLike,
  userId,
  userRole,
  depth,
  onReply,
}: {
  comment: CommentWithAuthor;
  postId: number;
  canLike: boolean;
  userId: number | null;
  userRole: string;
  depth: number;
  onReply: (parentId: number) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isAuthor = userId === comment.author.id;
  const isAdminOrMod = hasModRole(userRole);
  const canDelete = isAuthor || isAdminOrMod;

  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  async function handleLikeComment() {
    startTransition(async () => {
      if (comment.liked) {
        await unlikeComment(comment.id);
      } else {
        await likeComment(comment.id);
      }
      router.refresh();
    });
  }

  async function handleDeleteComment() {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      router.refresh();
    });
  }

  return (
    <div className={cn('border-l-2 border-border pl-4', depth > 0 && 'ml-4')}>
      <div className="flex items-start gap-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {comment.author.avatarUrl ? (
            <img
              src={comment.author.avatarUrl}
              alt={comment.author.name ?? ''}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            (comment.author.name?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/members/${comment.author.id}`} className="text-sm font-medium text-foreground hover:underline">
              {comment.author.name ?? 'User'}
            </Link>
            <LevelBadge level={comment.author.level} size="sm" />
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <div className="mt-1 text-sm text-foreground">
            <MarkdownContent content={comment.content} />
          </div>
          <div className="mt-2 flex items-center gap-3">
            <button
              onClick={handleLikeComment}
              disabled={!canLike || isPending}
              className={cn(
                'flex items-center gap-1 text-xs transition-colors',
                comment.liked
                  ? 'text-red-500'
                  : canLike
                    ? 'text-muted-foreground hover:text-red-500'
                    : 'text-muted-foreground/50'
              )}
            >
              <Heart
                className={cn('h-3.5 w-3.5', comment.liked && 'fill-current')}
              />
              {comment.likesCount > 0 && comment.likesCount}
            </button>
            {depth === 0 && userId && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDeleteComment}
                disabled={isPending}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Replies */}
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          canLike={canLike}
          userId={userId}
          userRole={userRole}
          depth={depth + 1}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

// ─── Main Detail Component ──────────────────────────────────────────────────

export function PostDetailClient({
  post,
  comments: initialComments,
  canLike,
  isAuthor,
  isAdminOrMod,
  userId,
  userRole,
}: {
  post: PostDetail;
  comments: CommentWithAuthor[];
  canLike: boolean;
  isAuthor: boolean;
  isAdminOrMod: boolean;
  userId: number | null;
  userRole: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: 'signin' | 'signup' }>({ open: false, mode: 'signup' });

  const isGuest = userId === null;

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: enUS,
  });

  async function handleLikePost() {
    // Optimistic
    setLiked(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));
    try {
      if (liked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch {
      setLiked(liked);
      setLikesCount(post.likesCount);
    }
  }

  async function handleDeletePost() {
    if (!confirm('Are you sure you want to delete this post?')) return;
    startTransition(async () => {
      await deletePost(post.id);
      router.push('/community');
    });
  }

  async function handlePin() {
    startTransition(async () => {
      if (post.isPinned) {
        await unpinPost(post.id);
      } else {
        await pinPost(post.id);
      }
      router.refresh();
    });
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    startTransition(async () => {
      await createComment({
        postId: post.id,
        content: commentText.trim(),
        parentId: replyToId,
      });
      setCommentText('');
      setReplyToId(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/community">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
      </Link>

      {/* Post */}
      <article className="rounded-lg border bg-card p-6">
        {/* Author header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-muted-foreground">
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

        {/* Title */}
        <h1 className="mt-4 text-2xl font-bold text-foreground">{post.title}</h1>

        {/* Content (markdown) — truncated with gradient for guests */}
        {isGuest ? (
          <div className="relative">
            <div className="mt-4 max-w-none max-h-[400px] overflow-hidden">
              <MarkdownContent content={post.content} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-card to-transparent" />
          </div>
        ) : (
          <div className="mt-4 max-w-none">
            <MarkdownContent content={post.content} />
          </div>
        )}

        {/* Paywall overlay for guests */}
        {isGuest && (
          <div className="mt-2 flex flex-col items-center rounded-lg border border-border bg-secondary/50 px-6 py-10 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {t('paywall.title')}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {t('paywall.description')}
            </p>
            <Button
              className="mt-6"
              onClick={() => setAuthModal({ open: true, mode: 'signup' })}
            >
              {t('paywall.joinNow')}
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('paywall.alreadyMember')}{' '}
              <button
                type="button"
                onClick={() => setAuthModal({ open: true, mode: 'signin' })}
                className="font-medium text-primary hover:underline"
              >
                {t('auth.signIn')}
              </button>
            </p>
          </div>
        )}

        {/* Images (authenticated only) */}
        {!isGuest && post.images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {post.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={img.altText ?? ''}
                className="rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        {/* Links (authenticated only) */}
        {!isGuest && post.links.length > 0 && (
          <div className="mt-4 space-y-2">
            {post.links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                {link.imageUrl && (
                  <img
                    src={link.imageUrl}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {link.title || link.url}
                    </p>
                    <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                  {link.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {link.description}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Actions (authenticated only) */}
        {!isGuest && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLikePost}
                disabled={!canLike}
                className={cn(
                  'flex items-center gap-1.5 text-sm transition-colors',
                  liked
                    ? 'text-red-500'
                    : canLike
                      ? 'text-muted-foreground hover:text-red-500'
                      : 'cursor-default text-muted-foreground'
                )}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
                {likesCount}
              </button>
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAdminOrMod && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePin}
                  disabled={isPending}
                >
                  {post.isPinned ? (
                    <>
                      <PinOff className="h-4 w-4" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="h-4 w-4" />
                      Pin
                    </>
                  )}
                </Button>
              )}
              {(isAuthor || isAdminOrMod) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeletePost}
                  disabled={isPending}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('common.delete')}
                </Button>
              )}
            </div>
          </div>
        )}
      </article>

      {/* Comment Form */}
      {userId && (
        <form onSubmit={handleSubmitComment} className="rounded-lg border bg-card p-4">
          {replyToId && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Replying to comment</span>
              <button
                type="button"
                onClick={() => setReplyToId(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              rows={2}
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPending || !commentText.trim()}
              className="self-end"
            >
              {isPending ? '...' : 'Send'}
            </Button>
          </div>
        </form>
      )}

      {/* Comments (authenticated only) */}
      {!isGuest && (
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            Comments ({post.commentsCount})
          </h2>
          {initialComments.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No comments yet.
            </p>
          ) : (
            initialComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={post.id}
                canLike={canLike}
                userId={userId}
                userRole={userRole}
                depth={0}
                onReply={(parentId) => setReplyToId(parentId)}
              />
            ))
          )}
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        open={authModal.open}
        onClose={() => setAuthModal({ open: false, mode: 'signup' })}
        defaultMode={authModal.mode}
      />
    </div>
  );
}
