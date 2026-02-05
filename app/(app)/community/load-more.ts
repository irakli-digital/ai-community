'use server';

import { getFeedPosts, type FeedPost } from '@/lib/db/community-queries';

export async function loadMorePosts(params: {
  cursor: { createdAt: string; id: number };
  categoryId?: number | null;
  userId?: number | null;
}): Promise<{
  posts: FeedPost[];
  nextCursor: { createdAt: string; id: number } | null;
}> {
  return getFeedPosts({
    cursor: params.cursor,
    categoryId: params.categoryId,
    userId: params.userId,
    limit: 20,
  });
}
