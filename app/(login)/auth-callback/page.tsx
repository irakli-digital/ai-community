'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/community';

  useEffect(() => {
    // Brief delay to ensure the browser has processed the Set-Cookie header
    const timer = setTimeout(() => {
      window.location.href = returnTo;
    }, 100);
    return () => clearTimeout(timer);
  }, [returnTo]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="mt-4 text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
