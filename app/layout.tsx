import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { getUser } from '@/lib/db/queries';
import { SWRConfig } from 'swr';

export const metadata: Metadata = {
  title: {
    default: 'Agentic Tribe — AI Community',
    template: '%s',
  },
  description:
    'Agentic Tribe — an AI community. Learn AI, automation, and technology.',
  metadataBase: new URL(process.env.BASE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Agentic Tribe — AI Community',
    description: 'Learn AI, automation, and technology with the Agentic Tribe community.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Agentic Tribe',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Tribe — AI Community',
    description: 'Learn AI, automation, and technology with the Agentic Tribe community.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const inter = Inter({
  subsets: ['latin'],
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
      lang="en"
      className={`bg-background text-foreground ${inter.className}`}
    >
      <body className="min-h-[100dvh] bg-background">
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
