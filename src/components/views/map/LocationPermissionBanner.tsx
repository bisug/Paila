import { useState } from "react";
import { MapPinOff, X, RefreshCw, ChevronDown, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  onRetry: () => void;
  onDismiss: () => void;
}

const STEPS: { browser: string; steps: string[] }[] = [
  {
    browser: "Chrome / Edge",
    steps: [
      "Click the lock or tune icon to the left of the address bar",
      "Set Location to Allow, then reload the page",
    ],
  },
  {
    browser: "Safari (macOS)",
    steps: [
      "Open Safari → Settings → Websites → Location",
      "Find this site and choose Allow, then reload",
    ],
  },
  {
    browser: "Safari (iOS)",
    steps: [
      "Open Settings → Safari → Location → Allow",
      "Also enable Settings → Privacy & Security → Location Services → Safari Websites",
    ],
  },
  {
    browser: "Firefox",
    steps: [
      "Click the shield/lock icon in the address bar",
      "Clear the Blocked Location permission, then reload and allow",
    ],
  },
];

export function LocationPermissionBanner({ onRetry, onDismiss }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyOrigin = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      toast.success("Site URL copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="absolute left-3 right-3 top-3 z-10 rounded-xl border border-destructive/30 bg-destructive/10 backdrop-blur-sm shadow-card-md">
      <div className="flex items-start gap-3 p-3">
        <div className="mt-0.5 rounded-full bg-destructive/15 p-1.5">
          <MapPinOff className="h-4 w-4 text-destructive" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-900 leading-tight">Location is turned off</p>
          <p className="mt-0.5 text-xs text-stone-700 leading-snug">
            Enable location access to see where you are and pin your current spot.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onRetry}
              className="h-8 gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try again
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setExpanded((v) => !v)}
              className="h-8 gap-1 text-xs text-stone-700 hover:bg-destructive/10"
            >
              How to enable
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </Button>
          </div>

          {expanded && (
            <div className="mt-3 space-y-3 rounded-lg bg-white/70 p-3">
              {STEPS.map((b) => (
                <div key={b.browser}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-stone-600">
                    {b.browser}
                  </p>
                  <ol className="mt-1 ml-4 list-decimal text-xs text-stone-700 space-y-0.5">
                    {b.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
              ))}
              <button
                type="button"
                onClick={copyOrigin}
                className="flex w-full items-center justify-between rounded-md border border-stone-200 bg-white px-2.5 py-2 text-xs text-stone-700 hover:bg-stone-50"
              >
                <span className="truncate font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}
                </span>
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-pine" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-stone-500" />
                )}
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-stone-500 hover:bg-destructive/10 hover:text-stone-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
