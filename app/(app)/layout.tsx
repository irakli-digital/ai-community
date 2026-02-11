'use client';

import { AppHeader } from '@/components/layout/app-header';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}
