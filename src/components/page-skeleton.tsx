export function PageSkeleton() {
  return (
    <main aria-label="Memuat halaman" className="min-h-screen bg-background p-4 sm:p-6">
      <div className="mx-auto max-w-7xl animate-pulse space-y-6">
        <div className="h-10 w-56 rounded-xl bg-surface-container-high" />
        <div className="h-4 w-80 max-w-full rounded-lg bg-surface-container-high" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-32 rounded-2xl border border-outline-variant/30 bg-surface-container" />
          ))}
        </div>
        <div className="space-y-3 rounded-2xl border border-outline-variant/30 bg-surface-container p-5">
          <div className="h-5 w-1/3 rounded-lg bg-surface-container-high" />
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-10 rounded-lg bg-surface-container-high" />
          ))}
        </div>
      </div>
    </main>
  );
}
