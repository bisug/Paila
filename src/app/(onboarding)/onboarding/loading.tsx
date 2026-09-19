export default function OnboardingLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="h-8 w-2/3 mx-auto rounded bg-stone-200 animate-pulse" />
        <div className="h-4 w-full rounded bg-stone-100 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 pt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-20 rounded-2xl bg-stone-100 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
