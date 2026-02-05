import { t } from '@/lib/i18n/ka';

export default function CommunityPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('community.title')}</h1>
      <p className="mt-2 text-gray-500">{t('community.noPostsYet')}</p>
    </div>
  );
}
