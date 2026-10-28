"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Mountain, AlertTriangle, HeartPulse, Info, X, Activity } from "lucide-react";
import { getAltitudeSafetyProfile } from "@/lib/altitude-safety";

type AltitudeAdvisoryBadgeProps = {
  altitudeMeters: number;
  locationName?: string;
  size?: "sm" | "md";
  className?: string;
  onOpenAmsScore?: () => void;
};

export function AltitudeAdvisoryBadge({
  altitudeMeters,
  locationName,
  size = "sm",
  className = "",
  onOpenAmsScore,
}: AltitudeAdvisoryBadgeProps) {
  const [open, setOpen] = useState(false);
  const profile = getAltitudeSafetyProfile(altitudeMeters);

  const isHigh = altitudeMeters >= 2500;
  const isExtreme = altitudeMeters >= 5000;

  const toneClasses = isExtreme
    ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300"
    : isHigh
      ? "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300"
      : "bg-muted text-muted-foreground border-border";

  return (
    <>
      <button
        type="button"
        onClick={() => isHigh && setOpen(true)}
        disabled={!isHigh}
        title={isHigh ? "Click to view Himalayan Acclimatization Advisory" : undefined}
        className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-all ${toneClasses} ${
          size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1"
        } ${isHigh ? "cursor-pointer hover:opacity-90 active:scale-95" : "cursor-default"} ${className}`}
      >
        <Mountain size={size === "sm" ? 12 : 14} className="shrink-0" />
        <span className="tabular-nums">{altitudeMeters.toLocaleString()}m</span>
        {isHigh && <span className="opacity-80">· {profile.label}</span>}
      </button>

      {/* Advisory Modal */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-tactile animate-in fade-in zoom-in-95 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
                  <Mountain size={18} />
                </div>
                <div>
                  <Dialog.Title className="text-base font-bold text-foreground leading-tight">
                    Altitude Advisory
                  </Dialog.Title>
                  <p className="text-xs text-muted-foreground">
                    {locationName ? `${locationName} · ` : ""}
                    {altitudeMeters.toLocaleString()}m ({profile.altitudeFeet.toLocaleString()}ft)
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-8 w-8 grid place-items-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close advisory"
                >
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {/* Oxygen level & Physiology */}
            <div className="rounded-xl bg-muted/60 border border-border p-3.5 my-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={14} className="text-terracotta" />
                  Effective Oxygen
                </span>
                <span className="text-sm font-extrabold text-foreground tabular-nums">
                  ~{profile.oxygenPercentage}% of sea level
                </span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full bg-terracotta transition-all"
                  style={{ width: `${profile.oxygenPercentage}%` }}
                />
              </div>
            </div>

            {/* Warnings */}
            {profile.warnings.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {profile.warnings.map((w, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-snug"
                  >
                    <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Clinical Recommendations */}
            <div className="space-y-2 mb-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Info size={12} />
                Clinical Himalayan Guidelines
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-600 dark:text-stone-300">
                {profile.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 leading-relaxed">
                    <span className="h-1.5 w-1.5 rounded-full bg-pine shrink-0 mt-1.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-border space-y-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (onOpenAmsScore) {
                    onOpenAmsScore();
                  } else {
                    // Open SOS panel via custom event
                    window.dispatchEvent(new CustomEvent("paila_open_sos_ams"));
                  }
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-terracotta text-white py-2.5 px-3 text-xs font-bold hover:bg-terracotta/90 transition-all shadow-xs"
              >
                <HeartPulse size={15} />
                <span>Take Lake Louise AMS Self-Assessment</span>
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
