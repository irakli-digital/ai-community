import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ძიება — AI წრე',
  description: 'მოძებნე პოსტები, კურსები და წევრები AI წრეში.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
