"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BadgeCheck, Upload, Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Submission = {
  id: string;
  full_name: string;
  guide_id_number: string;
  place: string;
  phone: string;
  id_card_path: string;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const NAME_RE = /^.{2,80}$/;
const GUIDE_ID_RE = /^[A-Za-z0-9-]{4,32}$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;
const PLACE_RE = /^.{2,80}$/;

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

export default function GuideVerifyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<Submission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [guideId, setGuideId] = useState("");
  const [place, setPlace] = useState("");
  const [phone, setPhone] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id ?? null;
      if (!uid) {
        router.push("/login");
        return;
      }
      if (cancelled) return;
      setUserId(uid);

      const { data, error: selErr } = await supabase
        .from("guide_verifications")
        .select("id, full_name, guide_id_number, place, phone, id_card_path, status, review_note")
        .eq("user_id", uid)
        .maybeSingle();
      if (cancelled) return;
      if (selErr) {
        setError(selErr.message);
      } else if (data) {
        setExisting(data as Submission);
        setFullName(data.full_name);
        setGuideId(data.guide_id_number);
        setPlace(data.place);
        setPhone(data.phone);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const locked = existing?.status === "approved";
  const isPending = existing?.status === "pending";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!userId) {
      setError("You must be signed in.");
      return;
    }
    if (!NAME_RE.test(fullName.trim())) {
      setError("Enter a valid full name (2–80 characters).");
      return;
    }
    if (!GUIDE_ID_RE.test(guideId.trim())) {
      setError("Guide ID must be 4–32 letters/numbers/dashes.");
      return;
    }
    if (!PLACE_RE.test(place.trim())) {
      setError("Enter a valid place (2–80 characters).");
      return;
    }
    if (!PHONE_RE.test(phone.trim())) {
      setError("Enter a valid phone number, e.g. +9779812345678.");
      return;
    }
    if (!existing && !file) {
      setError("Please attach a photo of your Guide ID card.");
      return;
    }
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        setError("Image must be 5 MB or smaller.");
        return;
      }
      if (!ALLOWED_FILE_TYPES.has(file.type)) {
        setError("File must be a JPG, PNG, or WebP image.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let id_card_path = existing?.id_card_path ?? "";

      if (file) {
        const safe = sanitizeFileName(file.name);
        const path = `${userId}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from("guide-ids")
          .upload(path, file, { upsert: false, contentType: file.type });
        if (upErr) throw upErr;
        id_card_path = path;
      }

      const payload = {
        user_id: userId,
        full_name: fullName.trim(),
        guide_id_number: guideId.trim(),
        place: place.trim(),
        phone: phone.trim(),
        id_card_path,
        status: "pending" as const,
        review_note: null as string | null,
      };

      const { data, error: upsertErr } = await supabase
        .from("guide_verifications")
        .upsert(payload, { onConflict: "user_id" })
        .select("id, full_name, guide_id_number, place, phone, id_card_path, status, review_note")
        .single();
      if (upsertErr) throw upsertErr;

      setExisting(data as Submission);
      setFile(null);
      setSuccess("Submitted! Your verification is pending review.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-stone-500">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-stone-500 mb-4 hover:text-stone-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-2xl font-bold text-stone-900">Get verified as a guide</h1>
      <p className="text-sm text-stone-500 mt-1">
        Upload a photo of your official Guide ID card. Verified guides show a verified tick next to
        their name.
      </p>

      {existing && (
        <div
          className={`mt-4 rounded-xl border p-3 text-sm flex items-start gap-2 ${
            existing.status === "approved"
              ? "bg-pine-tint border-pine/20 text-pine"
              : existing.status === "rejected"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          {existing.status === "approved" ? (
            <BadgeCheck className="w-4 h-4 mt-0.5 text-pine shrink-0" />
          ) : (
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <div>
            <p className="font-semibold capitalize">{existing.status}</p>
            {existing.status === "pending" && (
              <p>
                We're reviewing your submission. You can update details below until it's reviewed.
              </p>
            )}
            {existing.status === "approved" && (
              <p>You're verified. The blue tick will appear next to your name on guide cards.</p>
            )}
            {existing.status === "rejected" && (
              <p>
                {existing.review_note ||
                  "Your submission was rejected. Please correct the details and re-submit."}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field label="Full name">
          <input
            type="text"
            required
            maxLength={80}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={locked || submitting}
            className="input"
            placeholder="As shown on your ID card"
          />
        </Field>

        <Field label="Guide ID number">
          <input
            type="text"
            required
            maxLength={32}
            value={guideId}
            onChange={(e) => setGuideId(e.target.value)}
            disabled={locked || submitting}
            className="input"
            placeholder="e.g. NTB-12345"
          />
        </Field>

        <Field label="Working area / place">
          <input
            type="text"
            required
            maxLength={80}
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            disabled={locked || submitting}
            className="input"
            placeholder="e.g. Pokhara"
          />
        </Field>

        <Field label="Phone number">
          <input
            type="tel"
            required
            maxLength={20}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={locked || submitting}
            className="input"
            placeholder="+9779812345678"
          />
        </Field>

        <Field label={existing ? "Replace Guide ID card photo (optional)" : "Guide ID card photo"}>
          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-dashed border-stone-300 bg-stone-50 px-3 py-3 text-sm text-stone-600 hover:bg-stone-100">
            <Upload className="w-4 h-4" />
            <span className="truncate">
              {file
                ? file.name
                : existing
                  ? "Choose new image (JPG/PNG, ≤ 5 MB)"
                  : "Choose image (JPG/PNG, ≤ 5 MB)"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={locked || submitting}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {existing?.id_card_path && !file && (
            <p className="mt-1 text-[11px] text-stone-400">
              Current file: {existing.id_card_path.split("/").pop()}
            </p>
          )}
        </Field>

        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {success && <p role="status" className="text-sm text-pine">{success}</p>}

        <button
          type="submit"
          disabled={locked || submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta text-white font-semibold py-2.5 hover:bg-terracotta/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {locked
            ? "Already verified"
            : isPending
              ? "Update submission"
              : "Submit for verification"}
        </button>

        <p className="text-[11px] text-stone-400 text-center">
          Your ID image is stored privately. Only you and our reviewers can access it.
        </p>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-stone-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
