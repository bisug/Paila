import Link from "next/link";
import { Home, MapPin } from "lucide-react";

export default function RootNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-stone-100 bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
          <MapPin size={22} />
        </div>
        <h1 className="text-lg font-bold text-stone-900">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          This destination is not available in the app yet.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-2.5 text-sm font-bold text-white hover:bg-terracotta/90"
        >
          <Home size={15} />
          Back to home
        </Link>
      </div>
    </div>
  );
}
