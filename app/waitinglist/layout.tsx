import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Agentic Tribe — Join the Waiting List',
  description:
    'A tribe of builders exploring agentic AI. Join the waiting list.',
};

export default function WaitingListLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
        rel="stylesheet"
      />
      <div style={{ fontFamily: '"Satoshi", sans-serif' }}>{children}</div>
    </>
  );
}
