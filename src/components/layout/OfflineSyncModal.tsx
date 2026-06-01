"use client";

import { CheckCircle2, RefreshCw, Wifi, WifiOff, X } from "lucide-react";

type OfflineSyncModalProps = {
  forceOffline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  onClose: () => void;
  onForceOfflineToggle: () => void;
  onSyncNow: () => void;
};

const cachedItems = [
  {
    label: "Leaflet Topographical Map Tiles",
    desc: "Cached Syabrubesi-Langtang sector",
    size: "18.4 MB",
  },
  {
    label: "Real-time Currency Exchange Rates",
    desc: "Synced (USD/NPR rate stored)",
    size: "2 KB",
  },
  {
    label: "Language Translation Dictionaries",
    desc: "Nepali + 4 local dialects loaded",
    size: "120 KB",
  },
  {
    label: "Verified Host Register",
    desc: "Ama Sita & Council records stored",
    size: "15 KB",
  },
];

export function OfflineSyncModal({
  forceOffline,
  isOffline,
  isSyncing,
  onClose,
  onForceOfflineToggle,
  onSyncNow,
}: OfflineSyncModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full md:max-w-md max-h-[85vh] overflow-y-auto rounded-[30px] bg-white p-6 shadow-float animate-slide-up"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto w-10 h-1 bg-stone-200 rounded-full mb-5 md:hidden" />

        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold text-stone-900">Offline &amp; Sync</h3>
            <p className="text-xs text-stone-500 mt-0.5">Manage offline local storage</p>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200/60 mb-6">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
            {isOffline ? (
              <WifiOff className="text-amber-600 shrink-0" size={20} />
            ) : (
              <Wifi className="text-pine shrink-0" size={20} />
            )}
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-stone-900">Simulate Offline Mode</h4>
              <p className="text-[11px] text-stone-500 mt-0.5 truncate">
                Force local caching in mountains
              </p>
            </div>
          </div>
          <button
            onClick={onForceOfflineToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${forceOffline ? "bg-amber-600" : "bg-stone-200"}`}
            role="switch"
            aria-checked={forceOffline}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${forceOffline ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Offline Caching status
          </h4>
          {cachedItems.map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center px-3 py-2 bg-stone-50/50 rounded-xl border border-stone-100 text-xs gap-2"
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-800 flex items-center gap-1.5 min-w-0">
                  <CheckCircle2 size={12} className="text-pine shrink-0" />
                  <span className="truncate">{item.label}</span>
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5 truncate">{item.desc}</p>
              </div>
              <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md shrink-0">
                {item.size}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onSyncNow}
          disabled={isOffline || isSyncing}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm transition-all active:scale-[0.98] ${isOffline ? "bg-stone-300 cursor-not-allowed" : "bg-pine hover:bg-pine/90"}`}
        >
          <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          {isSyncing
            ? "Syncing data..."
            : isOffline
              ? "Cannot Sync in Offline Mode"
              : "Sync Datastores Now"}
        </button>
      </div>
    </div>
  );
}
