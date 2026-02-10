import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leaderboard — Agentic Tribe',
  description: 'Agentic Tribe leaderboard — see the most active members.',
  openGraph: {
    title: 'Leaderboard — Agentic Tribe',
    description: 'Agentic Tribe leaderboard.',
    type: 'website',
  },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
