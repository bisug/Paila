import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BadgeCheck,
  Mail,
  Mountain,
  Trophy,
  ArrowLeft,
  Edit2,
  Check,
  X,
  User as UserIcon,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function AccountClient({ user }: { user: User }) {
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const meta = user.user_metadata || {};

  const [firstName, setFirstName] = useState(meta.first_name || "");
  const [middleName, setMiddleName] = useState(meta.middle_name || "");
  const [lastName, setLastName] = useState(meta.last_name || "");
  const [age, setAge] = useState(meta.age?.toString() || "");
  const [avatarUrl, setAvatarUrl] = useState(meta.avatar_url || "");
  const [gender, setGender] = useState<"male" | "female">(
    meta.gender === "female" ? "female" : "male",
  );

  const displayName = meta.full_name || user.email || user.phone || "Traveller";

  // Use email initials as fallback avatar
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    supabase
      .from("profiles")
      .select("gender")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.gender === "male" || data?.gender === "female") {
          setGender(data.gender);
        }
      });
  }, [user.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const updatedFullName =
      `${firstName.trim()} ${middleName.trim() ? middleName.trim() + " " : ""}${lastName.trim()}`.trim();

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim(),
          middle_name: middleName.trim(),
          last_name: lastName.trim(),
          age: parseInt(age) || null,
          full_name: updatedFullName || meta.full_name, // keep old if empty
          avatar_url: avatarUrl.trim(),
          gender,
        },
      });

      if (error) throw error;

      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ gender })
        .eq("user_id", user.id);
      if (profileErr) throw profileErr;

      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 md:px-8 pt-5 pb-28 md:py-8">
      {/* Back button */}
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Menu
      </Link>

      {/* ── Avatar + name ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center mb-8 relative">
        <div className="relative h-24 w-24 rounded-full bg-terracotta grid place-items-center shadow-card-md mb-3 overflow-hidden border-2 border-white">
          {meta.avatar_url ? (
            <img
              src={meta.avatar_url}
              alt="Profile"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-white tracking-widest">{initials}</span>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-0 right-4 h-9 w-9 bg-white rounded-full shadow-sm border border-stone-200 grid place-items-center text-stone-600 hover:text-terracotta transition-colors"
          >
            <Edit2 size={16} />
          </button>
        )}

        <h1 className="text-xl font-bold text-stone-900">{displayName}</h1>
        <p className="text-sm text-stone-500 mt-0.5">{user.email || user.phone}</p>
        {!isEditing && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1.5">
            <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2.5 py-0.5 rounded-full capitalize">
              {gender}
            </span>
            {meta.age && (
              <span className="text-xs font-semibold text-pine bg-pine/10 px-2.5 py-0.5 rounded-full">
                {meta.age} years old
              </span>
            )}
          </div>
        )}
      </div>

      <div className="w-full md:max-w-xl md:mx-auto">
        {isEditing ? (
          <form
            onSubmit={handleSave}
            className="mb-8 rounded-card bg-white p-5 shadow-card border border-stone-100 animate-in fade-in"
          >
            <h2 className="text-sm font-bold text-stone-900 mb-4">Edit Profile</h2>

            {error && <p className="text-xs text-red-500 mb-3 font-medium">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-500 mb-1 block">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-terracotta"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-1 block">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-1 block">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-1 block">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={middleName}
                    onChange={(e) => setMiddleName(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-terracotta"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-stone-500 mb-1 block">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2.5 text-sm outline-none focus:border-terracotta"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 mb-1 block">Gender</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-stone-100 p-1">
                  <button
                    type="button"
                    onClick={() => setGender("male")}
                    className={`rounded-md py-2 text-xs font-bold transition ${gender === "male" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender("female")}
                    className={`rounded-md py-2 text-xs font-bold transition ${gender === "female" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"}`}
                  >
                    Female
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-sm font-semibold text-stone-600 flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg bg-pine text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  <Check size={16} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* ── Account card ──────────────────────────────────────────────── */}
            <div className="rounded-card bg-white border border-stone-100 shadow-card overflow-hidden mb-4">
              <div className="px-4 py-3 border-b border-stone-50 flex items-center gap-3">
                <div className="h-9 w-9 grid place-items-center rounded-xl bg-stone-50">
                  <Mail size={16} className="text-stone-500" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 font-medium">Contact info</p>
                  <p className="text-sm font-semibold text-stone-800">{user.email || user.phone}</p>
                </div>
                <BadgeCheck size={16} className="text-pine ml-auto" />
              </div>

              <div className="px-4 py-3 flex items-center gap-3">
                <div className="h-9 w-9 grid place-items-center rounded-xl bg-stone-50">
                  <Mountain size={16} className="text-stone-500" />
                </div>
                <div>
                  <p className="text-[11px] text-stone-400 font-medium">Traveller since</p>
                  <p className="text-sm font-semibold text-stone-800">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Quick stats ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-card bg-white border border-stone-100 shadow-card px-3 py-4 text-center">
                <p className="text-xl font-bold text-pine truncate">4</p>
                <p className="text-xs text-stone-500 mt-0.5">Stamps earned</p>
              </div>
              <div className="rounded-card bg-white border border-stone-100 shadow-card px-3 py-4 text-center">
                <p className="text-xl font-bold text-terracotta truncate">Rs 14,500</p>
                <p className="text-xs text-stone-500 mt-0.5">Sent to hosts</p>
              </div>
            </div>

            {/* ── Impact badge ─────────────────────────────────────────────── */}
            <div className="rounded-card bg-pine border border-pine/30 px-4 py-4 flex items-center gap-4 shadow-card">
              <div className="h-12 w-12 grid place-items-center rounded-xl bg-white/15 shrink-0">
                <Trophy size={24} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-0.5">
                  Highest Achievement
                </p>
                <p className="text-base font-bold text-white">Annapurna Guardian</p>
                <p className="text-xs text-white/70 mt-0.5">You've funded 3 community-led trails</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
