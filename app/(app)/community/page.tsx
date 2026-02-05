import { getUser, isPaidUser } from '@/lib/db/queries';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import {
  getFeedPosts,
  getPinnedPosts,
} from '@/lib/db/community-queries';
import { CommunityFeed } from './feed-client';

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const user = await getUser();
  const categories = await getCategories();
  const categoryId = params.category ? Number(params.category) : null;

  const paid = user ? await isPaidUser(user.id) : false;
  const canCreate = paid || user?.role === 'admin';
  const canLike = paid || user?.role === 'admin';

  const pinnedPosts = await getPinnedPosts({
    categoryId,
    userId: user?.id,
  });

  const { posts, nextCursor } = await getFeedPosts({
    categoryId,
    userId: user?.id,
    limit: 20,
  });

  // Filter out pinned from main feed to avoid duplicates
  const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
  const feedPosts = posts.filter((p) => !pinnedIds.has(p.id));

  return (
    <CommunityFeed
      initialPinned={pinnedPosts}
      initialPosts={feedPosts}
      initialCursor={nextCursor}
      categories={categories}
      selectedCategoryId={categoryId}
      canCreate={canCreate ?? false}
      canLike={canLike ?? false}
      userId={user?.id ?? null}
    />
  );
}
