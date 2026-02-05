import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'შეტყობინებები — AI წრე',
  description: 'თქვენი შეტყობინებები AI წრეში.',
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
