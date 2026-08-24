"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, ArrowLeft, Loader2, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) {
          router.push("/login");
          return;
        }
        const { data, error: fetchError } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (fetchError) throw fetchError;
        setItems((data ?? []) as Notification[]);
      } catch {
        setError("Notifications could not be loaded. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const markAsRead = async (id: string) => {
    const previous = items;
    setItems((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    const { error: updateError } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    if (updateError) {
      setItems(previous);
      setError("This notification could not be marked as read.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
        <Link href="/" aria-label="Back to home" className="text-stone-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h1>
      </header>
      <div className="px-4 pt-4">
        {error && (
          <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-stone-400" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-sm">
            <CheckCheck size={32} className="mx-auto mb-2 text-stone-300" />
            You're all caught up.
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const card = (
                <div
                  className={`rounded-card p-4 border shadow-card ${n.read ? "bg-white border-stone-100" : "bg-pine-tint/40 border-pine/20"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-stone-900">{n.title}</h3>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 line-clamp-3 text-xs text-stone-600">{n.body}</p>}
                </div>
              );
              return (
                <li key={n.id}>
                  {n.link ? (
                    <Link
                      href={n.link}
                      onClick={() => {
                        if (!n.read) void markAsRead(n.id);
                      }}
                      className="block rounded-card transition hover:shadow-card-md"
                    >
                      {card}
                    </Link>
                  ) : (
                    <div>
                      {card}
                      {!n.read && (
                        <button
                          type="button"
                          onClick={() => void markAsRead(n.id)}
                          className="mt-1 min-h-11 px-2 text-xs font-semibold text-pine underline underline-offset-2"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
