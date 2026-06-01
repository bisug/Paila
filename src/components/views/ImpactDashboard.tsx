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
        <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1">
          Personal Impact
        </p>
        <h2 className="text-2xl md:text-3xl font-bold text-stone-900 leading-tight">
          Your footsteps fund communities.
        </h2>
      </div>

      {/* ── Metric cards ──────────────────────────────────────────────── */}
      <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 mb-6 md:mb-10">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex items-center gap-4 rounded-card bg-white border border-stone-100 px-4 py-4 shadow-card"
            >
              <div className={`h-11 w-11 shrink-0 grid place-items-center rounded-xl ${m.bg}`}>
                <Icon size={20} className={m.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-stone-900 leading-none">{m.value}</p>
                <p className="mt-1 text-xs text-stone-500 leading-snug">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Badge progress ────────────────────────────────────────────── */}
      <div className="mb-5 md:mb-8 rounded-card bg-white border border-stone-100 px-4 md:px-6 py-4 md:py-6 shadow-card">
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-sm md:text-base font-bold text-stone-800">Trail Stamps</h3>
          <span className="text-xs md:text-sm font-semibold text-stone-500">
            {UNLOCKED} / {TOTAL_BADGES} unlocked
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-2 rounded-full bg-pine transition-all"
            style={{ width: `${(UNLOCKED / TOTAL_BADGES) * 100}%` }}
          />
        </div>
        <p className="mt-2 md:mt-3 text-xs md:text-sm text-stone-400">
          {TOTAL_BADGES - UNLOCKED} more stamps to complete your Paila passport.
        </p>
      </div>

      {/* ── Achievement badges grid ───────────────────────────────────── */}
      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 md:mb-4">
        Achievements
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {impactBadges.map((badge) => {
          const Icon = badge.icon;
          return (
            <div
              key={badge.title}
              className={`rounded-card border p-4 transition-all ${
                badge.unlocked
                  ? "bg-pine border-pine/20 text-white"
                  : "bg-white border-stone-100 text-stone-400"
              }`}
            >
              {/* Icon */}
              <div
                className={`mb-3 h-10 w-10 grid place-items-center rounded-xl ${
                  badge.unlocked ? "bg-white/15" : "bg-stone-50"
                }`}
              >
                {badge.unlocked ? (
                  <Icon size={20} className="text-white" />
                ) : (
                  <Lock size={16} className="text-stone-300" />
                )}
              </div>

              {/* Badge title */}
              <p
                className={`text-[13px] font-semibold leading-snug ${
                  badge.unlocked ? "text-white" : "text-stone-400"
                }`}
              >
                {badge.title}
              </p>

              {/* Status label */}
              <p
                className={`mt-2 text-[10px] font-bold uppercase tracking-wider ${
                  badge.unlocked ? "text-white/60" : "text-stone-300"
                }`}
              >
                {badge.unlocked ? "Earned" : "Locked"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
