import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard — AI Circle',
  description: 'AI Circle leaderboard — see the most active members.',
  openGraph: {
    title: 'Leaderboard — AI Circle',
    description: 'AI Circle leaderboard.',
    type: 'website',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
