import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Members — Agentic Tribe',
  description: 'Agentic Tribe member directory — meet the community members.',
  openGraph: {
    title: 'Members — Agentic Tribe',
    description: 'Agentic Tribe member directory.',
    type: 'website',
  },
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
