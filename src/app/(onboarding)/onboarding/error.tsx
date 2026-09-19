"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-red-100 bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
          <AlertTriangle size={22} />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Something went wrong</h2>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          We could not load this onboarding step. Try again, and if it repeats, check the network or
          service configuration.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-stone-800"
        >
          <RotateCcw size={15} />
          Try again
        </button>
      </div>
    </div>
  );
}
