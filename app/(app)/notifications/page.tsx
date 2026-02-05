import { t } from '@/lib/i18n/ka';

export default function NotificationsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.notifications')}</h1>
      <p className="mt-2 text-gray-500">შეტყობინებები ცარიელია.</p>
    </div>
  );
}
