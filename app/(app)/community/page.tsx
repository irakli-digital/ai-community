import type { Metadata } from 'next';
import { getUser, isPaidUser, getCommunitySettings, getMemberCount, getOnlineMemberCount } from '@/lib/db/queries';
import { getCategories } from '@/app/(app)/admin/categories/actions';
import {
  getFeedPosts,
  getPinnedPosts,
} from '@/lib/db/community-queries';
import { CommunityFeed } from './feed-client';

export const metadata: Metadata = {
  title: 'Community — Agentic Tribe',
  description: 'Agentic Tribe community feed — posts, discussions, and resources.',
  openGraph: {
    title: 'Community — Agentic Tribe',
    description: 'Agentic Tribe community feed — posts, discussions, and resources.',
    type: 'website',
  },
};

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
  const { hasAdminRole } = await import('@/lib/auth/roles');
  const canCreate = paid || hasAdminRole(user?.role);
  const canLike = paid || hasAdminRole(user?.role);

  const [pinnedPosts, { posts, nextCursor }, communitySettings, memberCount, onlineCount] =
    await Promise.all([
      getPinnedPosts({ categoryId, userId: user?.id }),
      getFeedPosts({ categoryId, userId: user?.id, limit: 20 }),
      getCommunitySettings(),
      getMemberCount(),
      getOnlineMemberCount(),
    ]);

  // Filter out pinned from main feed to avoid duplicates
  const pinnedIds = new Set(pinnedPosts.map((p) => p.id));
  const feedPosts = posts.filter((p) => !pinnedIds.has(p.id));

  return (
    <CommunityFeed
      key={categoryId ?? 'all'}
      initialPinned={pinnedPosts}
      initialPosts={feedPosts}
      initialCursor={nextCursor}
      categories={categories}
      selectedCategoryId={categoryId}
      canCreate={canCreate ?? false}
      canLike={canLike ?? false}
      userId={user?.id ?? null}
      userRole={user?.role ?? 'member'}
      communityName={communitySettings?.name ?? 'Agentic Tribe'}
      communityDescription={communitySettings?.description ?? null}
      communityLogoUrl={communitySettings?.logoUrl ?? null}
      memberCount={memberCount}
      onlineCount={onlineCount}
    />
  );
}
