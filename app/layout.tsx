import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Georgian } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: 'AI წრე — ქართული AI/ტექ საზოგადოება',
  description:
    'AI წრე — ქართული ტექნოლოგიური საზოგადოება. ისწავლე AI, ავტომატიზაცია და ტექნოლოგიები.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const notoSansGeorgian = Noto_Sans_Georgian({
  subsets: ['georgian', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ka"
      className={`bg-white dark:bg-gray-950 text-black dark:text-white ${notoSansGeorgian.className}`}
    >
      <body className="min-h-[100dvh] bg-gray-50">
        <SWRConfig
          value={{
            fallback: {
              '/api/user': getUser(),
            },
          }}
        >
          {children}
        </SWRConfig>
      </body>
    </html>
  );
}
