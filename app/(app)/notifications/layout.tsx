import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — AI Circle',
  description: 'Your notifications in AI Circle.',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
