import { useEffect, useState } from "react";
import { ChevronRight, PhoneCall, X, Activity, AlertTriangle, ShieldAlert } from "lucide-react";
import { terracotta } from "@/lib/data";

// Simulate a check-in that happened 2 hours ago with a 24-hour safety window.
// In a real app this would come from a persisted offline store.
const WINDOW_HOURS = 24;
const ELAPSED_MS = 2 * 60 * 60 * 1000; // 2 h already elapsed

function useCheckInCountdown() {
  const [remainingMs, setRemainingMs] = useState(() => WINDOW_HOURS * 60 * 60 * 1000 - ELAPSED_MS);

  useEffect(() => {
    const id = setInterval(() => setRemainingMs((prev) => Math.max(0, prev - 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const overdue = remainingMs === 0;
  const h = Math.floor(remainingMs / 3_600_000);
  const m = Math.floor((remainingMs % 3_600_000) / 60_000);
  const s = Math.floor((remainingMs % 60_000) / 1000);
  const label = overdue
    ? "Checkpoint overdue — check in now!"
    : `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s remaining`;

  return { label, overdue };
}

export function SosPanel({ onClose }: { onClose: () => void }) {
  const { label, overdue } = useCheckInCountdown();
  const [amsOpen, setAmsOpen] = useState(false);

  // AMS symptom states
  const [headache, setHeadache] = useState<number>(0);
  const [gi, setGi] = useState<number>(0);
  const [fatigue, setFatigue] = useState<number>(0);
  const [dizziness, setDizziness] = useState<number>(0);
  const [sleep, setSleep] = useState<number>(0);

  const amsScore = headache + gi + fatigue + dizziness + sleep;
  const hasAms = headache >= 1 && amsScore >= 3;
  const isSevere = amsScore >= 6;

  const links = [
    { label: "Himalayan Rescue Association", value: "+977 1 4440292" },
    { label: "Regional Health Post", value: "+977 9840000000" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div
        className="w-full md:max-w-md max-h-[90vh] overflow-y-auto rounded-[34px] border border-white/50 bg-white/[0.92] p-5 shadow-2xl backdrop-blur-2xl no-scrollbar"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              {amsOpen ? "AMS Medical Check" : "Offline SOS"}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {amsOpen ? "Lake Louise Score" : "Safety checkpoint panel"}
            </h2>
          </div>
          <button
            type="button"
            onClick={amsOpen ? () => setAmsOpen(false) : onClose}
            className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-200 text-slate-700 font-bold hover:bg-slate-300 transition-colors"
            aria-label="Back or Close"
          >
            {amsOpen ? "←" : <X />}
          </button>
        </div>

        {/* ── AMS Tracker Sheet Tab ────────────────────────────────────────── */}
        {amsOpen ? (
          <div className="space-y-4 pb-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <p className="text-xs text-stone-500 font-semibold leading-relaxed">
              Answer the questions below based on how you have felt in the past 12-24 hours. The
              clinical consensus requires a headache for diagnosis.
            </p>

            {/* Scorecard Alert Box */}
            <div
              className={`p-4 rounded-[22px] text-white shadow-md flex items-start gap-3 transition-colors ${
                isSevere ? "bg-red-600" : hasAms ? "bg-amber-500" : "bg-green-600"
              }`}
            >
              {isSevere ? (
                <ShieldAlert size={24} className="shrink-0 mt-0.5 animate-bounce" />
              ) : hasAms ? (
                <AlertTriangle size={24} className="shrink-0 mt-0.5" />
              ) : (
                <CheckCircleIcon size={24} />
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-wider opacity-85">
                  Lake Louise Score: {amsScore}
                </p>
                <h4 className="font-bold text-base mt-0.5">
                  {isSevere
                    ? "Severe AMS Detected!"
                    : hasAms
                      ? "Mild AMS Detected"
                      : "Clear: No AMS Detected"}
                </h4>
                <p className="text-xs mt-1 leading-snug font-medium opacity-90">
                  {isSevere
                    ? "DO NOT ascend. Descend to a lower altitude immediately. Contact Himalayan Rescue."
                    : hasAms
                      ? "Warning: Do not ascend further today. Rest and re-evaluate in 24 hours."
                      : "You are currently below the diagnostic threshold for AMS. Continue ascending slowly and stay hydrated."}
                </p>
              </div>
            </div>

            {/* Questions list */}
            <div className="space-y-4">
              {[
                {
                  title: "1. Headache",
                  value: headache,
                  setter: setHeadache,
                  desc: ["None", "Mild", "Moderate", "Severe / Incapacitating"],
                },
                {
                  title: "2. GI Symptoms (Appetite/Nausea)",
                  value: gi,
                  setter: setGi,
                  desc: [
                    "Normal",
                    "Poor appetite / Mild nausea",
                    "Moderate nausea / Vomiting",
                    "Severe / Vomiting often",
                  ],
                },
                {
                  title: "3. Fatigue / Weakness",
                  value: fatigue,
                  setter: setFatigue,
                  desc: [
                    "Normal energy",
                    "Mild fatigue / weakness",
                    "Moderate fatigue",
                    "Severe / Can barely walk",
                  ],
                },
                {
                  title: "4. Dizziness / Lightheadedness",
                  value: dizziness,
                  setter: setDizziness,
                  desc: ["None", "Mild", "Moderate", "Severe / Fall down"],
                },
                {
                  title: "5. Difficulty Sleeping",
                  value: sleep,
                  setter: setSleep,
                  desc: [
                    "Slept as well as usual",
                    "Did not sleep as well",
                    "Woke up many times",
                    "Could not sleep at all",
                  ],
                },
              ].map((q) => (
                <div
                  key={q.title}
                  className="bg-white border border-stone-200/60 rounded-2xl p-4 shadow-sm"
                >
                  <h4 className="text-sm font-bold text-stone-900 mb-1">{q.title}</h4>
                  <p className="text-[11px] text-stone-400 mb-3 font-semibold">{q.desc[q.value]}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => q.setter(val)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                          q.value === val
                            ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                            : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ── Main SOS Panel Tab ────────────────────────────────────────── */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div
              className={`rounded-[28px] p-4 text-white shadow-xl ${
                overdue ? "bg-slate-900 animate-soft-pulse" : "bg-red-600"
              }`}
            >
              <p className="text-sm font-black uppercase tracking-[0.12em] text-white/80">
                Offline Check-In Status
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums">{label}</p>
              <p className="mt-1 text-sm font-bold text-white/85">
                {overdue
                  ? "Alert your emergency contact immediately."
                  : "Reach the next safe checkpoint node before timeout."}
              </p>
            </div>

            {/* AMS Shortcut Card */}
            <button
              onClick={() => setAmsOpen(true)}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-200 active:bg-amber-100 transition-colors text-left shadow-sm animate-in slide-in-from-bottom-2 duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 grid place-items-center shrink-0">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-stone-900">AMS Symptom Checker</p>
                  <p className="text-xs text-stone-500 mt-0.5">Calculate your Lake Louise Score</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-amber-700" />
            </button>

            {/* Emergency Contacts */}
            <div className="grid gap-3">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={`tel:${link.value.replaceAll(" ", "")}`}
                  className="flex min-h-14 items-center justify-between rounded-2xl bg-white px-4 text-sm font-black text-slate-900 shadow-md border border-stone-100 active:scale-[0.98] transition-transform"
                >
                  <span className="flex items-center gap-3">
                    <PhoneCall color={terracotta} /> {link.label}
                  </span>
                  <ChevronRight size={20} />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckCircleIcon({ size }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 mt-0.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
