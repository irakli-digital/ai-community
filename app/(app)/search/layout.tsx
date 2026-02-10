import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search — Agentic Tribe',
  description: 'Search for posts, courses, and members in Agentic Tribe.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
