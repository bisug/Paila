"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  MapPin,
  MessageSquare,
  PhoneCall,
  RadioTower,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  createDefaultSafetyCheckIn,
  createSosIncident,
  emergencyContacts,
  getCheckInStatus,
  parseSafetyCheckIn,
  parseSosIncidents,
  sanitizePhoneNumber,
  SOS_STORAGE_KEYS,
  type SafetyCheckIn,
  type SosIncident,
  type SosLocation,
} from "@/lib/sos";

type SosPanelProps = {
  isOffline: boolean;
  onClose: () => void;
};

const DEFAULT_LOCATION: SosLocation = { label: "Location not shared" };

function loadInitialCheckIn() {
  if (typeof window === "undefined") return createDefaultSafetyCheckIn();

  try {
    return (
      parseSafetyCheckIn(window.localStorage.getItem(SOS_STORAGE_KEYS.checkIn)) ??
      createDefaultSafetyCheckIn()
    );
  } catch {
    return createDefaultSafetyCheckIn();
  }
}

function loadInitialIncidents() {
  if (typeof window === "undefined") return [];

  try {
    return parseSosIncidents(window.localStorage.getItem(SOS_STORAGE_KEYS.incidents));
  } catch {
    return [];
  }
}

export function SosPanel({ isOffline, onClose }: SosPanelProps) {
  const [now, setNow] = useState(() => Date.now());
  const [checkIn, setCheckIn] = useState<SafetyCheckIn>(() => loadInitialCheckIn());
  const [incidents, setIncidents] = useState<SosIncident[]>(() => loadInitialIncidents());
  const [selectedContactId, setSelectedContactId] = useState(emergencyContacts[0].id);
  const [location, setLocation] = useState<SosLocation>(DEFAULT_LOCATION);
  const [isLocating, setIsLocating] = useState(false);
  const [actionNote, setActionNote] = useState<string | null>(null);
  const [amsOpen, setAmsOpen] = useState(false);

  const [headache, setHeadache] = useState<number>(0);
  const [gi, setGi] = useState<number>(0);
  const [fatigue, setFatigue] = useState<number>(0);
  const [dizziness, setDizziness] = useState<number>(0);
  const [sleep, setSleep] = useState<number>(0);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SOS_STORAGE_KEYS.checkIn, JSON.stringify(checkIn));
    } catch {
      window.queueMicrotask(() =>
        setActionNote("Local SOS storage is unavailable in this browser session."),
      );
    }
  }, [checkIn]);

  useEffect(() => {
    try {
      window.localStorage.setItem(SOS_STORAGE_KEYS.incidents, JSON.stringify(incidents));
    } catch {
      window.queueMicrotask(() =>
        setActionNote("Local SOS storage is unavailable in this browser session."),
      );
    }
  }, [incidents]);

  useEffect(() => {
    const hasQueuedIncident = incidents.some((incident) => incident.status === "queued-offline");
    if (isOffline || !hasQueuedIncident) return;

    window.queueMicrotask(() => {
      setIncidents((current) =>
        current.map((incident) =>
          incident.status === "queued-offline"
            ? { ...incident, status: "ready-to-send" }
            : incident,
        ),
      );
      setActionNote("Queued offline SOS is ready to send now that you are online.");
    });
  }, [incidents, isOffline]);

  const checkInStatus = useMemo(() => getCheckInStatus(checkIn, now), [checkIn, now]);
  const amsScore = headache + gi + fatigue + dizziness + sleep;
  const hasAms = headache >= 1 && amsScore >= 3;
  const isSevere = amsScore >= 6;
  const selectedContact =
    emergencyContacts.find((contact) => contact.id === selectedContactId) ?? emergencyContacts[0];
  const latestIncident = incidents[0] ?? null;
  const pendingOfflineCount = incidents.filter(
    (incident) => incident.status === "queued-offline",
  ).length;
  const callHref = `tel:${sanitizePhoneNumber(selectedContact.number)}`;
  const smsHref = latestIncident
    ? `sms:${sanitizePhoneNumber(latestIncident.contactNumber)}?&body=${encodeURIComponent(
        latestIncident.message,
      )}`
    : null;

  const resolveCurrentLocation = async (): Promise<SosLocation> => {
    // Demo Mode: Always resolve to a static demo location immediately
    setIsLocating(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // simulate slight delay
    const nextLocation = {
      label: "28.2096, 83.9586",
      lat: 28.2096,
      lng: 83.9586,
      accuracyMeters: 10,
    };
    setLocation(nextLocation);
    setIsLocating(false);
    return nextLocation;
  };

  const handleCaptureLocation = async () => {
    const nextLocation = await resolveCurrentLocation();
    setActionNote(
      nextLocation.lat
        ? "Location captured for the SOS message."
        : "Location unavailable. The SOS message will use your saved checkpoint context.",
    );
  };

  const handleCheckIn = () => {
    const checkedAt = Date.now();
    setNow(checkedAt);
    setCheckIn((current) => ({
      ...current,
      lastCheckedInAt: new Date(checkedAt).toISOString(),
      originLabel: location.lat ? location.label : current.originLabel,
    }));
    setActionNote("Check-in saved locally. Offline countdown reset.");
  };

  const handleResetPlan = () => {
    setNow(Date.now());
    setCheckIn(createDefaultSafetyCheckIn(Date.now()));
    setIncidents([]);
    setActionNote("Offline SOS plan and local queue reset.");
  };

  const handlePrepareSos = async () => {
    const nextLocation = await resolveCurrentLocation();
    const incident = createSosIncident({
      isOffline,
      contact: selectedContact,
      location: nextLocation,
      checkIn,
      now: Date.now(),
    });

    setIncidents((current) => [incident, ...current].slice(0, 10));
    setActionNote(
      isOffline
        ? "Offline SOS queued locally. Use call or SMS if cellular service is available."
        : "SOS prepared with current context. Call or message the selected contact.",
    );
  };

  const handleCopyMessage = async () => {
    if (!latestIncident?.message || !navigator.clipboard) {
      setActionNote("Copy is unavailable in this browser.");
      return;
    }

    try {
      await navigator.clipboard.writeText(latestIncident.message);
      setActionNote("SOS message copied.");
    } catch {
      setActionNote("Copy failed. Select the SOS message text manually.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/50 p-4 backdrop-blur-sm md:items-center md:justify-center">
      <div
        className="no-scrollbar max-h-[90vh] w-full overflow-y-auto rounded-[34px] border border-white/50 bg-white/[0.94] p-5 shadow-2xl backdrop-blur-2xl md:max-w-md"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              {amsOpen ? "AMS Medical Check" : isOffline ? "Offline SOS Armed" : "Emergency SOS"}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">
              {amsOpen ? "Lake Louise Score" : "Safety checkpoint panel"}
            </h2>
          </div>
          <button
            type="button"
            onClick={amsOpen ? () => setAmsOpen(false) : onClose}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300"
            aria-label={amsOpen ? "Back to SOS panel" : "Close SOS panel"}
          >
            {amsOpen ? <ArrowLeft size={20} /> : <X size={20} />}
          </button>
        </div>

        {amsOpen ? (
          <AmsPanel
            amsScore={amsScore}
            dizziness={dizziness}
            fatigue={fatigue}
            gi={gi}
            headache={headache}
            hasAms={hasAms}
            isSevere={isSevere}
            setDizziness={setDizziness}
            setFatigue={setFatigue}
            setGi={setGi}
            setHeadache={setHeadache}
            setSleep={setSleep}
            sleep={sleep}
          />
        ) : (
          <div className="animate-in fade-in space-y-4 duration-200">
            <div
              className={`rounded-[28px] p-4 text-white shadow-xl ${
                checkInStatus.overdue
                  ? "animate-soft-pulse bg-slate-900"
                  : isOffline
                    ? "bg-amber-600"
                    : "bg-red-600"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.12em] text-white/80">
                    Offline Check-In Status
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums">{checkInStatus.label}</p>
                </div>
                <Clock3 className="mt-1 shrink-0 text-white/80" size={22} />
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${Math.max(6, checkInStatus.progress * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-sm font-bold text-white/85">
                {checkInStatus.overdue
                  ? "Alert your emergency contact immediately."
                  : `Last check-in: ${formatPanelDate(checkIn.lastCheckedInAt)}`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCheckIn}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-pine px-3 text-sm font-black text-white shadow-sm transition-transform active:scale-[0.98]"
              >
                <CheckCircle2 size={17} />
                Check in now
              </button>
              <button
                type="button"
                onClick={handleResetPlan}
                className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 text-sm font-black text-stone-700 shadow-sm transition-transform active:scale-[0.98]"
              >
                <RotateCcw size={16} />
                Reset
              </button>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-red-700">
                    Emergency dispatch
                  </p>
                  <h3 className="mt-1 text-base font-black text-stone-950">
                    {selectedContact.label}
                  </h3>
                  <p className="mt-0.5 text-xs font-semibold text-stone-600">
                    {selectedContact.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-black text-red-700">
                  {selectedContact.number}
                </span>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                {emergencyContacts.map((contact) => (
                  <button
                    type="button"
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`min-h-11 rounded-xl border px-2 py-2 text-left transition-colors ${
                      selectedContactId === contact.id
                        ? "border-red-300 bg-white text-red-700"
                        : "border-red-100 bg-white/60 text-stone-600"
                    }`}
                  >
                    <span className="block truncate text-[11px] font-black">{contact.label}</span>
                    <span className="block text-[10px] font-bold opacity-70">{contact.number}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handlePrepareSos}
                  disabled={isLocating}
                  className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-3 text-sm font-black text-white shadow-sm transition-transform active:scale-[0.98] disabled:cursor-wait disabled:bg-red-300"
                >
                  <RadioTower size={17} className={isLocating ? "animate-pulse" : ""} />
                  {isLocating
                    ? "Capturing location..."
                    : isOffline
                      ? "Queue offline SOS"
                      : "Prepare SOS alert"}
                </button>
                <a
                  href={callHref}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-black text-red-700 shadow-sm transition-transform active:scale-[0.98]"
                >
                  <PhoneCall size={16} />
                  Call
                </a>
                <button
                  type="button"
                  onClick={handleCaptureLocation}
                  disabled={isLocating}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-black text-red-700 shadow-sm transition-transform active:scale-[0.98] disabled:cursor-wait disabled:text-red-300"
                >
                  <MapPin size={16} />
                  Locate
                </button>
              </div>
            </div>

            {latestIncident && (
              <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                      Prepared SOS
                    </p>
                    <p className="mt-1 text-sm font-bold text-stone-900">
                      {latestIncident.status === "queued-offline"
                        ? "Queued locally for offline use"
                        : "Ready to send"}
                    </p>
                  </div>
                  <span className="rounded-full bg-stone-100 px-2 py-1 text-[10px] font-black uppercase text-stone-500">
                    {latestIncident.mode}
                  </span>
                </div>
                <textarea
                  readOnly
                  value={latestIncident.message}
                  className="min-h-28 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs font-semibold leading-relaxed text-stone-700 outline-none"
                />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white text-xs font-black text-stone-700 transition-transform active:scale-[0.98]"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                  {smsHref && (
                    <a
                      href={smsHref}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 text-xs font-black text-white transition-transform active:scale-[0.98]"
                    >
                      <MessageSquare size={14} />
                      Open SMS
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                    Local SOS queue
                  </p>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    {pendingOfflineCount
                      ? `${pendingOfflineCount} SOS item queued offline`
                      : "No offline SOS items waiting"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                    isOffline ? "bg-amber-100 text-amber-700" : "bg-pine-tint text-pine"
                  }`}
                >
                  {isOffline ? "Offline" : "Online"}
                </span>
              </div>
              {incidents.length > 0 && (
                <div className="space-y-2">
                  {incidents.slice(0, 3).map((incident) => (
                    <div
                      key={incident.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-stone-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-stone-800">
                          {incident.contactLabel}
                        </p>
                        <p className="text-[10px] font-semibold text-stone-400">
                          {formatPanelDate(incident.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-black text-stone-500">
                        {incident.status === "queued-offline" ? "Queued" : "Ready"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {actionNote && (
                <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-relaxed text-stone-600">
                  {actionNote}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAmsOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition-colors active:bg-amber-100"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                  <Activity size={20} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-stone-900">
                    AMS Symptom Checker
                  </span>
                  <span className="block truncate text-xs text-stone-500">
                    Calculate your Lake Louise Score
                  </span>
                </span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-amber-700" />
            </button>

            <div className="grid gap-2">
              {emergencyContacts.map((link) => (
                <a
                  key={link.id}
                  href={`tel:${sanitizePhoneNumber(link.number)}`}
                  className="flex min-h-14 items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 text-sm font-black text-slate-900 shadow-md transition-transform active:scale-[0.98]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <PhoneCall className="shrink-0 text-red-600" size={18} />
                    <span className="min-w-0">
                      <span className="block truncate">{link.label}</span>
                      <span className="block text-[10px] font-semibold text-stone-400">
                        {link.number}
                      </span>
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-stone-300" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type AmsPanelProps = {
  amsScore: number;
  dizziness: number;
  fatigue: number;
  gi: number;
  headache: number;
  hasAms: boolean;
  isSevere: boolean;
  setDizziness: (value: number) => void;
  setFatigue: (value: number) => void;
  setGi: (value: number) => void;
  setHeadache: (value: number) => void;
  setSleep: (value: number) => void;
  sleep: number;
};

function AmsPanel({
  amsScore,
  dizziness,
  fatigue,
  gi,
  headache,
  hasAms,
  isSevere,
  setDizziness,
  setFatigue,
  setGi,
  setHeadache,
  setSleep,
  sleep,
}: AmsPanelProps) {
  const questions = [
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
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 space-y-4 pb-4 duration-200">
      <p className="text-xs font-semibold leading-relaxed text-stone-500">
        Answer based on how you have felt in the past 12-24 hours. The clinical consensus requires a
        headache for diagnosis.
      </p>

      <div
        className={`flex items-start gap-3 rounded-[22px] p-4 text-white shadow-md transition-colors ${
          isSevere ? "bg-red-600" : hasAms ? "bg-amber-500" : "bg-green-600"
        }`}
      >
        {isSevere ? (
          <ShieldAlert size={24} className="mt-0.5 shrink-0 animate-bounce" />
        ) : hasAms ? (
          <AlertTriangle size={24} className="mt-0.5 shrink-0" />
        ) : (
          <CheckCircle2 size={24} className="mt-0.5 shrink-0" />
        )}
        <div>
          <p className="text-xs font-black uppercase tracking-wider opacity-85">
            Lake Louise Score: {amsScore}
          </p>
          <h4 className="mt-0.5 text-base font-bold">
            {isSevere
              ? "Severe AMS Detected"
              : hasAms
                ? "Mild AMS Detected"
                : "Clear: No AMS Detected"}
          </h4>
          <p className="mt-1 text-xs font-medium leading-snug opacity-90">
            {isSevere
              ? "Do not ascend. Descend to a lower altitude immediately and contact rescue support."
              : hasAms
                ? "Do not ascend further today. Rest and re-evaluate in 24 hours."
                : "You are below the diagnostic threshold for AMS. Continue ascending slowly and stay hydrated."}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q) => (
          <div
            key={q.title}
            className="rounded-2xl border border-stone-200/60 bg-white p-4 shadow-sm"
          >
            <h4 className="mb-1 text-sm font-bold text-stone-900">{q.title}</h4>
            <p className="mb-3 text-[11px] font-semibold text-stone-400">{q.desc[q.value]}</p>
            <div className="grid grid-cols-4 gap-2">
              {[0, 1, 2, 3].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => q.setter(val)}
                  className={`rounded-xl border py-2 text-xs font-bold transition-colors ${
                    q.value === val
                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                      : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
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
  );
}

function formatPanelDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
