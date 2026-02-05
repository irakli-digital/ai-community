import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[100dvh]">
      <div className="max-w-md space-y-8 p-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white font-bold text-lg">
            AI
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          გვერდი ვერ მოიძებნა
        </h1>
        <p className="text-base text-gray-500">
          გვერდი, რომელსაც ეძებთ, არ არსებობს ან წაშლილია.
        </p>
        <Link
          href="/"
          className="max-w-48 mx-auto flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          მთავარ გვერდზე დაბრუნება
        </Link>
      </div>
    </div>
  );
}
