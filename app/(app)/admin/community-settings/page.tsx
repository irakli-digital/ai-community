import { getUser, getCommunitySettings } from '@/lib/db/queries';
import { redirect } from 'next/navigation';
import { CommunitySettingsClient } from './settings-client';

export default async function CommunitySettingsPage() {
  const user = await getUser();
  if (!user || user.role !== 'admin') redirect('/community');

  const settings = await getCommunitySettings();

  return (
    <CommunitySettingsClient
      settings={settings ? {
        id: settings.id,
        name: settings.name,
        description: settings.description || '',
        aboutContent: settings.aboutContent || '',
        logoUrl: settings.logoUrl || '',
        coverImageUrl: settings.coverImageUrl || '',
      } : {
        id: 0,
        name: 'AI Circle',
        description: '',
        aboutContent: '',
        logoUrl: '',
        coverImageUrl: '',
      }}
    />
  );
}
