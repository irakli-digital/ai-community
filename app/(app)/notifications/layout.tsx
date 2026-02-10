import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notifications — Agentic Tribe',
  description: 'Your notifications in Agentic Tribe.',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
