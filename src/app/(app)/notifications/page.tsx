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

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setItems((data ?? []) as Notification[]);
      setLoading(false);
      const unreadIds = ((data as Notification[]) ?? []).filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
      }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-stone-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h1>
      </header>
      <div className="px-4 pt-4">
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
                  className={`rounded-2xl p-4 border ${n.read ? "bg-white border-stone-100" : "bg-pine-tint/40 border-pine/20"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-stone-900">{n.title}</h3>
                    <span className="text-[10px] text-stone-400 whitespace-nowrap">
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {n.body && <p className="mt-1 text-xs text-stone-600">{n.body}</p>}
                </div>
              );
              return <li key={n.id}>{n.link ? <Link href={n.link}>{card}</Link> : card}</li>;
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
