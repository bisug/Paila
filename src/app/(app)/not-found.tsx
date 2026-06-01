import Link from "next/link";
import { Home, MapPin } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-md rounded-card border border-stone-100 bg-white p-6 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta/10 text-terracotta">
          <MapPin size={22} />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Page not found</h2>
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
