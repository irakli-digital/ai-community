import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'წევრები — AI წრე',
  description: 'AI წრის წევრების დირექტორია — გაიცანი საზოგადოების წევრები.',
  openGraph: {
    title: 'წევრები — AI წრე',
    description: 'AI წრის წევრების დირექტორია.',
    type: 'website',
  },
};

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
