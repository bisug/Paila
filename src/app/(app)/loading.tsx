export default function AppLoading() {
  return (
    <div className="px-4 py-6 md:px-8">
      <div className="mb-6 flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-stone-200 animate-pulse" />
        <div className="min-w-0 flex-1">
          <div className="h-6 w-48 rounded bg-stone-200 animate-pulse" />
          <div className="mt-2 h-4 w-full max-w-md rounded bg-stone-200 animate-pulse" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-card border border-stone-100 bg-white p-4 shadow-card"
          >
            <div className="h-32 rounded-xl bg-stone-100 animate-pulse" />
            <div className="mt-4 h-4 w-2/3 rounded bg-stone-200 animate-pulse" />
            <div className="mt-2 h-3 w-full rounded bg-stone-100 animate-pulse" />
            <div className="mt-2 h-3 w-1/2 rounded bg-stone-100 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
