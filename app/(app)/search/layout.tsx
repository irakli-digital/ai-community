import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search — AI Circle',
  description: 'Search for posts, courses, and members in AI Circle.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
