import { getCommunitySettings, getMemberCount, getOnlineMemberCount } from '@/lib/db/queries';
import { getLatestPosts } from '@/lib/db/community-queries';
import { t } from '@/lib/i18n/ka';
import { LandingContent } from '@/components/landing/landing-content';

export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  const [settings, memberCount, onlineCount, latestPosts] = await Promise.all([
    getCommunitySettings(),
    getMemberCount(),
    getOnlineMemberCount(),
    getLatestPosts(6),
  ]);

  const communityName = settings?.name || t('common.appName');
  const description =
    settings?.description ||
    'AI community - learn, share, and grow together.';
  const aboutContent =
    settings?.aboutContent ||
    'Agentic Tribe is an AI community where you can learn Agentic AI, automation, and modern technologies. Join us and become part of our community!';

  return (
    <LandingContent
      communityName={communityName}
      description={description}
      aboutContent={aboutContent}
      memberCount={memberCount}
      onlineCount={onlineCount}
      logoUrl={settings?.logoUrl}
      coverImageUrl={settings?.coverImageUrl}
      latestPosts={latestPosts.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
