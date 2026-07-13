"use client";

import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-stone-100">
      <div className="w-full max-w-md rounded-modal bg-white p-8 shadow-tactile border border-stone-100 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <span className="text-3xl" role="img" aria-label="Warning">
            ⚠️
          </span>
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">Authentication Error</h1>
        <p className="text-stone-500 text-sm mb-6">
          The sign-in link has expired or is invalid. This can happen if the link was already used,
          or if more than 24 hours have passed.
        </p>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-primary px-4 py-2.5 font-bold text-white hover:bg-primary/90 transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
