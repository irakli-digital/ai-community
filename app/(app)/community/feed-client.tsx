'use client';

import { useState, useCallback, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from '@/components/community/category-filter';
import { PostCard } from '@/components/community/post-card';
import { t } from '@/lib/i18n/ka';
import type { FeedPost } from '@/lib/db/community-queries';
import type { Category } from '@/lib/db/schema';
import { likePost, unlikePost } from './actions';
import { loadMorePosts } from './load-more';

interface CommunityFeedProps {
  initialPinned: FeedPost[];
  initialPosts: FeedPost[];
  initialCursor: { createdAt: string; id: number } | null;
  categories: Category[];
  selectedCategoryId: number | null;
  canCreate: boolean;
  canLike: boolean;
  userId: number | null;
}

export function CommunityFeed({
  initialPinned,
  initialPosts,
  initialCursor,
  categories,
  selectedCategoryId,
  canCreate,
  canLike,
  userId,
}: CommunityFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [pinned, setPinned] = useState(initialPinned);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Infinite scroll
  useEffect(() => {
    if (!cursor) return;

    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && cursor && !loading) {
          setLoading(true);
          try {
            const result = await loadMorePosts({
              cursor,
              categoryId: selectedCategoryId,
              userId,
            });
            const pinnedIds = new Set(pinned.map((p) => p.id));
            const newPosts = result.posts.filter((p) => !pinnedIds.has(p.id));
            setPosts((prev) => [...prev, ...newPosts]);
            setCursor(result.nextCursor);
          } finally {
            setLoading(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [cursor, loading, selectedCategoryId, userId, pinned]);

  function handleCategorySelect(catId: number | null) {
    const params = new URLSearchParams();
    if (catId) params.set('category', String(catId));
    router.push(`/community${params.toString() ? `?${params}` : ''}`);
  }

  async function handleLike(postId: number, currentlyLiked: boolean) {
    const updateLikeState = (postList: FeedPost[]) =>
      postList.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !currentlyLiked,
              likesCount: p.likesCount + (currentlyLiked ? -1 : 1),
            }
          : p
      );

    // Optimistic update
    setPosts(updateLikeState);
    setPinned(updateLikeState);

    try {
      if (currentlyLiked) {
        await unlikePost(postId);
      } else {
        await likePost(postId);
      }
    } catch {
      // Revert on error
      setPosts(updateLikeState);
      setPinned(updateLikeState);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('community.title')}
        </h1>
        {canCreate && (
          <Link href="/community/new">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              {t('community.newPost')}
            </Button>
          </Link>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <CategoryFilter
          categories={categories}
          selectedId={selectedCategoryId}
          onSelect={handleCategorySelect}
        />
      )}

      {/* Pinned posts */}
      {pinned.length > 0 && (
        <div className="space-y-4">
          {pinned.map((post) => (
            <PostCard
              key={`pinned-${post.id}`}
              post={post}
              onLike={handleLike}
              canLike={canLike}
            />
          ))}
        </div>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            canLike={canLike}
          />
        ))}
      </div>

      {/* Empty state */}
      {posts.length === 0 && pinned.length === 0 && (
        <p className="py-12 text-center text-gray-500">
          {t('community.noPostsYet')}
        </p>
      )}

      {/* Infinite scroll loader */}
      {cursor && (
        <div ref={loaderRef} className="flex justify-center py-8">
          <div className="text-sm text-gray-400">{t('common.loading')}</div>
        </div>
      )}
    </div>
  );
}
