'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { hasModRole } from '@/lib/auth/roles';
import {
  X,
  Check,
  Copy,
  Heart,
  MessageCircle,
  Pencil,
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
import { MarkdownContent } from '@/components/community/markdown-content';
import { getImageVariantUrl } from '@/lib/storage/image-utils';
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
  getPostDetail,
} from '@/app/(app)/community/actions';

// ─── Comment Component ──────────────────────────────────────────────────────

function ModalCommentItem({
  comment,
  postId,
  canLike,
  userId,
  userRole,
  depth,
  onReply,
  onRefresh,
}: {
  comment: CommentWithAuthor;
  postId: number;
  canLike: boolean;
  userId: number | null;
  userRole: string;
  depth: number;
  onReply: (parentId: number) => void;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
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
      onRefresh();
    });
  }

  async function handleDeleteComment() {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    startTransition(async () => {
      await deleteComment(comment.id);
      onRefresh();
    });
  }

  return (
    <div className={cn('border-l-2 border-border pl-4', depth > 0 && 'ml-4')}>
      <div className="flex items-start gap-3 py-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
          {comment.author.avatarUrl ? (
            <img
              src={getImageVariantUrl(comment.author.avatarUrl, 'avatar-sm')}
              alt={comment.author.name ?? ''}
              className="h-full w-full rounded-full object-cover"
              onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = comment.author.avatarUrl!; } }}
            />
          ) : (
            (comment.author.name?.[0] ?? '?').toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link
              href={`/members/${comment.author.id}`}
              className="text-sm font-medium text-foreground hover:underline"
            >
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
      {comment.replies.map((reply) => (
        <ModalCommentItem
          key={reply.id}
          comment={reply}
          postId={postId}
          canLike={canLike}
          userId={userId}
          userRole={userRole}
          depth={depth + 1}
          onReply={onReply}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface PostDetailModalProps {
  postId: number;
  onClose: () => void;
  onPostDeleted?: () => void;
}

export function PostDetailModal({ postId, onClose, onPostDeleted }: PostDetailModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [canLike, setCanLike] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAdminOrMod, setIsAdminOrMod] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState('member');
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    const result = await getPostDetail(postId);
    if (!result) {
      onClose();
      return;
    }
    setPost(result.post);
    setComments(result.comments);
    setCanLike(result.canLike);
    setIsAuthor(result.isAuthor);
    setIsAdminOrMod(result.isAdminOrMod);
    setUserId(result.userId);
    setUserRole(result.userRole);
    setLiked(result.post.liked);
    setLikesCount(result.post.likesCount);
    setLoading(false);
  }, [postId, onClose]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function handleLikePost() {
    if (!post) return;
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
    if (!post) return;
    if (!confirm('Are you sure you want to delete this post?')) return;
    startTransition(async () => {
      await deletePost(post.id);
      onClose();
      onPostDeleted?.();
      router.refresh();
    });
  }

  async function handlePin() {
    if (!post) return;
    startTransition(async () => {
      if (post.isPinned) {
        await unpinPost(post.id);
      } else {
        await pinPost(post.id);
      }
      fetchData();
    });
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !post) return;

    startTransition(async () => {
      await createComment({
        postId: post.id,
        content: commentText.trim(),
        parentId: replyToId,
      });
      setCommentText('');
      setReplyToId(null);
      fetchData();
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 mt-8 mb-8 flex max-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col rounded-lg border border-border bg-background shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground truncate mr-2">
            {loading ? t('common.loading') : post?.title}
          </h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            {!loading && post && userId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(post.content);
                  } catch {
                    const ta = document.createElement('textarea');
                    ta.value = post.content;
                    ta.style.position = 'fixed';
                    ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                  }
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
            {!loading && post && (isAuthor || isAdminOrMod) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClose();
                  router.push(`/community/${post.id}/edit`);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : post ? (
            <div className="space-y-6">
              {/* Author header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
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
                      <Link
                        href={`/members/${post.author.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {post.author.name ?? 'User'}
                      </Link>
                      <LevelBadge level={post.author.level} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                        locale: enUS,
                      })}
                    </p>
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

              {/* Featured image */}
              {post.featuredImageUrl && (
                <img
                  src={getImageVariantUrl(post.featuredImageUrl, 'md')}
                  alt={post.title}
                  className="max-h-[400px] w-full rounded-lg object-cover"
                  onError={(e) => { if (!e.currentTarget.dataset.fallback) { e.currentTarget.dataset.fallback = '1'; e.currentTarget.src = post.featuredImageUrl!; } }}
                />
              )}

              {/* Content */}
              <div className="prose prose-sm max-w-none text-foreground">
                <MarkdownContent content={post.content} />
              </div>

              {/* Images */}
              {post.images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
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

              {/* Links */}
              {post.links.length > 0 && (
                <div className="space-y-2">
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

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-border pt-4">
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
                      onClick={() => {
                        onClose();
                        router.push(`/community/${post.id}/edit`);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
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
                      className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
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

              {/* Comments */}
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">
                  Comments ({post.commentsCount})
                </h2>
                {comments.length === 0 ? (
                  <p className="py-4 text-sm text-muted-foreground">
                    No comments yet.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <ModalCommentItem
                      key={comment.id}
                      comment={comment}
                      postId={post.id}
                      canLike={canLike}
                      userId={userId}
                      userRole={userRole}
                      depth={0}
                      onReply={(parentId) => setReplyToId(parentId)}
                      onRefresh={fetchData}
                    />
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
