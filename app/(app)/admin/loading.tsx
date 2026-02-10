export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-muted" />
              <div className="space-y-2">
                <div className="h-3 w-20 rounded bg-muted" />
                <div className="h-6 w-12 rounded bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 h-24" />
        ))}
      </div>
    </div>
  );
}
