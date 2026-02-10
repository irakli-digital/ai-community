import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-background">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white font-bold text-lg">
            AI
          </div>
        </div>
        <div>
          <p className="text-7xl font-bold text-primary mb-2">404</p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Page Not Found
          </h1>
        </div>
        <p className="text-base text-muted-foreground">
          The page you are looking for does not exist or has been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-primary hover:bg-primary/90 rounded-md gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-md gap-2">
            <Link href="/community">
              <ArrowLeft className="h-4 w-4" />
              Back to Community
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
