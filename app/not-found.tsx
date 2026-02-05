import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-gray-50">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-lg">
            AI
          </div>
        </div>
        <div>
          <p className="text-7xl font-bold text-orange-500 mb-2">404</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            გვერდი ვერ მოიძებნა
          </h1>
        </div>
        <p className="text-base text-gray-500">
          გვერდი, რომელსაც ეძებთ, არ არსებობს ან წაშლილია.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-orange-500 hover:bg-orange-600 rounded-full gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              მთავარ გვერდზე დაბრუნება
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full gap-2">
            <Link href="/community">
              <ArrowLeft className="h-4 w-4" />
              თემში დაბრუნება
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
