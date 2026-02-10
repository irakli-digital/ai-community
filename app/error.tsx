'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-6 p-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Something went wrong
        </h1>
        <p className="text-base text-muted-foreground">
          An error occurred while loading the page. Please try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-primary hover:bg-primary/90 rounded-md gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="rounded-md gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
