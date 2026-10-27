import { Activity, BookOpenCheck, CircleDollarSign, Lock } from "lucide-react";
import { impactBadges } from "@/lib/data";

const metrics = [
  {
    value: "Rs 14,500",
    label: "Sent directly to village wallets",
    icon: CircleDollarSign,
    color: "text-pine",
    bg: "bg-pine-tint",
  },
  {
    value: "88%",
    label: "Community economic retention",
    icon: Activity,
    color: "text-terracotta",
    bg: "bg-terracotta-tint",
  },
  {
    value: "3 sites",
    label: "Living heritage sites visited",
    icon: BookOpenCheck,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

// Badge unlock progress
const TOTAL_BADGES = 6;
const UNLOCKED = impactBadges.filter((b) => b.unlocked).length;

export function ImpactDashboard() {
  return (
    <div className="min-h-screen bg-stone-50 px-4 md:px-8 pt-5 pb-28 md:py-8">
      {/* ── Page heading ──────────────────────────────────────────────── */}
      <div className="mb-5 md:mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta mb-1">
          Personal Impact
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
          Your footsteps fund communities.
        </h2>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6 md:mb-10">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex items-center gap-4 rounded-card bg-white border border-stone-200/80 px-4 py-4 shadow-card hover:shadow-card-md transition-shadow"
            >
              <div
                className={`h-12 w-12 shrink-0 grid place-items-center rounded-2xl ${m.bg} border border-stone-100 shadow-xs`}
              >
                <Icon size={22} className={m.color} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold text-stone-900 tracking-tight leading-none">
                  {m.value}
                </p>
                <p className="mt-1.5 text-xs text-stone-600 leading-snug">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Badge progress ────────────────────────────────────────────── */}
      <div className="mb-6 md:mb-8 rounded-card bg-white border border-stone-200/80 px-5 md:px-6 py-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm md:text-base font-bold text-stone-900">Trail Stamps & Passport</h3>
          <span className="text-xs md:text-sm font-bold text-pine bg-pine-tint px-2.5 py-0.5 rounded-full border border-pine/20">
            {UNLOCKED} of {TOTAL_BADGES} unlocked
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden border border-stone-200/60">
          <div
            className="h-full rounded-full bg-linear-to-r from-pine to-emerald-600 transition-all duration-500"
            style={{ width: `${(UNLOCKED / TOTAL_BADGES) * 100}%` }}
          />
        </div>
        <p className="mt-2.5 text-xs md:text-sm text-stone-600">
          {TOTAL_BADGES - UNLOCKED} more stamps to complete your verified Paila trail passport.
        </p>
      </div>

      {/* ── Achievement badges grid ───────────────────────────────────── */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3.5">
        Unlocked Achievements
      </h3>
      {impactBadges.length === 0 ? (
        <p className="rounded-card border border-dashed border-stone-200 bg-white p-6 text-center text-sm text-stone-500">
          No trail stamps yet — start exploring to earn your first badge.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {impactBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.title}
                className={`rounded-card border p-4 transition-all ${
                  badge.unlocked
                    ? "bg-pine text-white border-pine/30 shadow-card hover:shadow-card-md"
                    : "bg-white border-stone-200/80 text-stone-500 shadow-xs opacity-75"
                }`}
              >
                {/* Icon */}
                <div
                  className={`mb-3 h-11 w-11 grid place-items-center rounded-xl ${
                    badge.unlocked ? "bg-white/20 shadow-xs" : "bg-stone-100 text-stone-400"
                  }`}
                >
                  {badge.unlocked ? (
                    <Icon size={22} className="text-white" />
                  ) : (
                    <Lock size={18} className="text-stone-400" />
                  )}
                </div>

                {/* Badge title */}
                <p
                  className={`text-[13px] font-bold leading-snug line-clamp-2 ${
                    badge.unlocked ? "text-white" : "text-stone-800"
                  }`}
                >
                  {badge.title}
                </p>

                {/* Status label */}
                <p
                  className={`mt-2 text-[11px] font-bold uppercase tracking-wider ${
                    badge.unlocked ? "text-emerald-200" : "text-stone-500"
                  }`}
                >
                  {badge.unlocked ? "✓ Earned" : "Locked"}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
