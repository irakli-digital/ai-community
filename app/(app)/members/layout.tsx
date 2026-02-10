import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Members — AI Circle',
  description: 'AI Circle member directory — meet the community members.',
  openGraph: {
    title: 'Members — AI Circle',
    description: 'AI Circle member directory.',
    type: 'website',
  },
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
