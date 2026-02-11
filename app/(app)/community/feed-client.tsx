'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from '@/components/community/category-filter';
import { PostCard } from '@/components/community/post-card';
import { WriteBar } from '@/components/community/write-bar';
import { CommunitySidebar } from '@/components/community/community-sidebar';
import { PostDetailModal } from '@/components/community/post-detail-modal';
import { t } from '@/lib/i18n/ka';
import type { FeedPost } from '@/lib/db/community-queries';
import type { Category } from '@/lib/db/schema';
import { likePost, unlikePost, deletePost } from './actions';
import { loadMorePosts } from './load-more';
import { hasModRole } from '@/lib/auth/roles';

interface CommunityFeedProps {
  initialPinned: FeedPost[];
  initialPosts: FeedPost[];
  initialCursor: { createdAt: string; id: number } | null;
  categories: Category[];
  selectedCategoryId: number | null;
  canCreate: boolean;
  canLike: boolean;
  userId: number | null;
  userRole: string;
  communityName: string;
  communityDescription: string | null;
  communityLogoUrl: string | null;
  memberCount: number;
  onlineCount: number;
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
  userRole,
  communityName,
  communityDescription,
  communityLogoUrl,
  memberCount,
  onlineCount,
}: CommunityFeedProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [pinned, setPinned] = useState(initialPinned);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
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

  function handlePostClick(postId: number) {
    setSelectedPostId(postId);
    window.history.pushState({ postId }, '', `/community/${postId}`);
  }

  // Handle browser back/forward to close/open modal
  useEffect(() => {
    function handlePopState(e: PopStateEvent) {
      if (e.state?.postId) {
        setSelectedPostId(e.state.postId);
      } else {
        setSelectedPostId(null);
      }
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const canDelete = hasModRole(userRole);

  async function handleDelete(postId: number) {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setPinned((prev) => prev.filter((p) => p.id !== postId));
    await deletePost(postId);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left column: feed */}
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
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

          {/* Write bar */}
          {canCreate && <WriteBar />}

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
                  onDelete={handleDelete}
                  canLike={canLike}
                  canDelete={canDelete}
                  onClick={handlePostClick}
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
                onDelete={handleDelete}
                canLike={canLike}
                canDelete={canDelete}
                onClick={handlePostClick}
              />
            ))}
          </div>

          {/* Empty state */}
          {posts.length === 0 && pinned.length === 0 && (
            <p className="py-12 text-center text-muted-foreground">
              {t('community.noPostsYet')}
            </p>
          )}

          {/* Infinite scroll loader */}
          {cursor && (
            <div ref={loaderRef} className="flex justify-center py-8">
              <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
            </div>
          )}
        </div>

        {/* Right column: sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-[5rem]">
            <CommunitySidebar
              name={communityName}
              description={communityDescription}
              logoUrl={communityLogoUrl}
              memberCount={memberCount}
              onlineCount={onlineCount}
            />
          </div>
        </div>
      </div>

      {/* Post detail modal */}
      {selectedPostId && (
        <PostDetailModal
          postId={selectedPostId}
          onClose={() => {
            setSelectedPostId(null);
            window.history.pushState(null, '', '/community');
          }}
          onPostDeleted={() => {
            setPosts((prev) => prev.filter((p) => p.id !== selectedPostId));
            setPinned((prev) => prev.filter((p) => p.id !== selectedPostId));
          }}
        />
      )}
    </>
  );
}
