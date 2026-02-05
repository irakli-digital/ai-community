import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Georgian } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: {
    default: 'AI წრე — ქართული AI/ტექ საზოგადოება',
    template: '%s',
  },
  description:
    'AI წრე — ქართული ტექნოლოგიური საზოგადოება. ისწავლე AI, ავტომატიზაცია და ტექნოლოგიები.',
  metadataBase: new URL(process.env.BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'AI წრე — ქართული AI/ტექ საზოგადოება',
    description: 'ისწავლე AI, ავტომატიზაცია და ტექნოლოგიები ქართულ საზოგადოებაში.',
    type: 'website',
    locale: 'ka_GE',
    siteName: 'AI წრე',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI წრე — ქართული AI/ტექ საზოგადოება',
    description: 'ისწავლე AI, ავტომატიზაცია და ტექნოლოგიები ქართულ საზოგადოებაში.',
  },
  robots: {
    index: true,
    follow: true,
  },
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
