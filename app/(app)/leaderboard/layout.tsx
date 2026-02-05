import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ლიდერბორდი — AI წრე',
  description: 'AI წრის ლიდერბორდი — ნახე ყველაზე აქტიური წევრები.',
  openGraph: {
    title: 'ლიდერბორდი — AI წრე',
    description: 'AI წრის ლიდერბორდი.',
    type: 'website',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
