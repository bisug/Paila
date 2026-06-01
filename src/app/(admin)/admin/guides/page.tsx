"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ShieldCheck, AlertCircle, Loader2, Check, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Submission = {
  id: string;
  user_id: string;
  full_name: string;
  guide_id_number: string;
  place: string;
  phone: string;
  id_card_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

export default function AdminGuidesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [adminEmail, setAdminEmail] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push("/login");
        return;
      }
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .maybeSingle();
      if (!role) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);
      await Promise.all([loadSubmissions(), loadAdminEmail()]);
      setLoading(false);
    })();
  }, [router]);

  async function loadSubmissions() {
    const { data, error } = await supabase
      .from("guide_verifications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      return;
    }
    const list = (data ?? []) as Submission[];
    setSubs(list);
    const urls: Record<string, string> = {};
    await Promise.all(
      list.map(async (s) => {
        const { data: signed } = await supabase.storage
          .from("guide-ids")
          .createSignedUrl(s.id_card_path, 60 * 30);
        if (signed?.signedUrl) urls[s.id] = signed.signedUrl;
      }),
    );
    setImageUrls(urls);
  }

  async function loadAdminEmail() {
    const { data } = await supabase
      .from("admin_settings")
      .select("admin_email")
      .eq("id", 1)
      .maybeSingle();
    setAdminEmail(data?.admin_email ?? "");
  }

  async function saveAdminEmail() {
    setError("");
    const { error } = await supabase
      .from("admin_settings")
      .update({ admin_email: adminEmail.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) setError(error.message);
  }

  async function decide(sub: Submission, status: "approved" | "rejected") {
    setBusy(sub.id);
    setError("");
    const { error } = await supabase
      .from("guide_verifications")
      .update({
        status,
        review_note: notes[sub.id] ?? sub.review_note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (error) {
      setError(error.message);
      setBusy(null);
      return;
    }
    await loadSubmissions();
    setBusy(null);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <ShieldCheck size={40} className="mx-auto text-stone-300" />
          <h1 className="mt-3 text-lg font-bold text-stone-900">Admins only</h1>
          <p className="mt-1 text-sm text-stone-500">You don't have access to this page.</p>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-terracotta">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  const pending = subs.filter((s) => s.status === "pending");
  const reviewed = subs.filter((s) => s.status !== "pending");

  return (
    <div className="min-h-screen bg-stone-50 pb-12">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white px-4 py-3 flex items-center gap-3">
        <Link href="/" className="text-stone-500">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-base font-bold text-stone-900">Guide verifications</h1>
      </header>

      <div className="px-4 pt-4 space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 border border-red-100 text-red-700 text-sm">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        <section className="rounded-2xl bg-white p-4 border border-stone-100 shadow-card">
          <label className="block text-xs font-semibold text-stone-600 mb-1.5">
            Admin notification email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="admin@example.com"
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <button
              onClick={saveAdminEmail}
              className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-bold text-white"
            >
              Save
            </button>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Address shown alongside in-app alerts. Email delivery requires a verified domain to be
            configured by the workspace admin.
          </p>
        </section>

        <section>
          <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
            Pending ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <p className="px-1 text-sm text-stone-500">No pending submissions.</p>
          ) : (
            <div className="space-y-3">
              {pending.map((s) => (
                <SubCard
                  key={s.id}
                  sub={s}
                  url={imageUrls[s.id]}
                  note={notes[s.id] ?? ""}
                  onNote={(v) => setNotes({ ...notes, [s.id]: v })}
                  onDecide={decide}
                  busy={busy === s.id}
                />
              ))}
            </div>
          )}
        </section>

        {reviewed.length > 0 && (
          <section>
            <h2 className="px-1 mb-2 text-xs font-bold uppercase tracking-wider text-stone-500">
              Reviewed
            </h2>
            <div className="space-y-3">
              {reviewed.map((s) => (
                <SubCard
                  key={s.id}
                  sub={s}
                  url={imageUrls[s.id]}
                  note={notes[s.id] ?? ""}
                  onNote={(v) => setNotes({ ...notes, [s.id]: v })}
                  onDecide={decide}
                  busy={busy === s.id}
                  compact
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function maskTail(value: string, visible = 4) {
  if (value.length <= visible) return "••••";
  return `${"•".repeat(Math.min(8, value.length - visible))}${value.slice(-visible)}`;
}

function SubCard({
  sub,
  url,
  note,
  onNote,
  onDecide,
  busy,
  compact,
}: {
  sub: Submission;
  url?: string;
  note: string;
  onNote: (v: string) => void;
  onDecide: (s: Submission, status: "approved" | "rejected") => void;
  busy: boolean;
  compact?: boolean;
}) {
  const statusColor =
    sub.status === "approved"
      ? "bg-pine-tint text-pine border-pine/20"
      : sub.status === "rejected"
        ? "bg-red-50 text-red-700 border-red-100"
        : "bg-amber-50 text-amber-800 border-amber-100";
  return (
    <article className="rounded-2xl bg-white border border-stone-100 shadow-card overflow-hidden">
      {url && !compact && <img src={url} alt="ID card" className="w-full h-48 object-cover" />}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-bold text-stone-900">{sub.full_name}</h3>
            <p className="text-xs text-stone-500">
              {sub.place} · {maskTail(sub.phone)}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">ID: {maskTail(sub.guide_id_number)}</p>
          </div>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider rounded-full border px-2 py-0.5 ${statusColor}`}
          >
            {sub.status}
          </span>
        </div>
        {compact && url && (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-terracotta"
          >
            View ID card →
          </a>
        )}
        {sub.review_note && (
          <p className="text-xs text-stone-600 rounded-lg bg-stone-50 p-2">
            Note: {sub.review_note}
          </p>
        )}
        {sub.status === "pending" && (
          <>
            <textarea
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Optional note (shown to guide on rejection)"
              rows={2}
              className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={() => onDecide(sub, "approved")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-pine px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <Check size={14} /> Approve
              </button>
              <button
                disabled={busy}
                onClick={() => onDecide(sub, "rejected")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <X size={14} /> Reject
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
