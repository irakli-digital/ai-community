export default function MembersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-32 rounded bg-gray-200" />
      <div className="flex gap-3">
        <div className="h-10 flex-1 max-w-sm rounded-lg bg-gray-200" />
        <div className="h-10 w-36 rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-24 rounded bg-gray-200" />
              <div className="h-3 w-16 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
