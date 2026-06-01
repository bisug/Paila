"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AlertCircle, ArrowRight, Footprints, Loader2, Mail } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setSending(true);
    try {
      const emailRedirectTo =
        typeof window !== "undefined" ? `${window.location.origin}/login` : undefined;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo },
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      setNotice("Check your email for a secure sign-in link.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send sign-in link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center px-4 xs:px-6 py-10 xs:py-12">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta shadow-float">
          <Footprints size={28} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-stone-900">Welcome to Paila</h1>
        <p className="mt-2 text-sm text-stone-500 font-medium">
          Sign in to book stays, save checkpoints, and manage your travel profile.
        </p>
      </div>

      <div className="mx-auto w-full max-w-sm">
        <form onSubmit={sendMagicLink} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">
              Email
            </span>
            <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-terracotta/25">
              <Mail size={16} className="shrink-0 text-stone-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
              />
            </div>
          </label>

          {error && (
            <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl border border-pine/15 bg-pine-tint p-3 text-xs font-semibold text-pine">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-white hover:bg-terracotta/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
            Send secure link
          </button>
        </form>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          Browse without account
        </button>
      </div>
    </div>
  );
}
