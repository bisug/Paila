export type EmergencyContactTone = "police" | "medical" | "fire" | "mountain" | "support";

export type EmergencyContact = {
  id: string;
  label: string;
  number: string;
  description: string;
  tone: EmergencyContactTone;
};

export type SafetyCheckIn = {
  lastCheckedInAt: string;
  windowHours: number;
  originLabel: string;
  nextCheckpointLabel: string;
};

export type SosLocation = {
  label: string;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
};

export type SosIncidentStatus = "queued-offline" | "ready-to-send";

export type SosIncident = {
  id: string;
  createdAt: string;
  mode: "offline" | "online";
  status: SosIncidentStatus;
  contactId: string;
  contactLabel: string;
  contactNumber: string;
  locationLabel: string;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
  message: string;
};

export const SOS_STORAGE_KEYS = {
  checkIn: "paila:sos:check-in",
  incidents: "paila:sos:incidents",
} as const;

export const SAFETY_CHECKIN_WINDOW_HOURS = 24;

const HOUR_MS = 60 * 60 * 1000;

export const emergencyContacts: EmergencyContact[] = [
  {
    id: "tourist-police",
    label: "Tourist Police",
    number: "1144",
    description: "Tourist emergencies, disputes, and visitor safety support",
    tone: "police",
  },
  {
    id: "police",
    label: "Police Control",
    number: "100",
    description: "General police emergency assistance",
    tone: "police",
  },
  {
    id: "ambulance",
    label: "Ambulance",
    number: "102",
    description: "Medical emergencies and ambulance dispatch",
    tone: "medical",
  },
  {
    id: "fire",
    label: "Fire Brigade",
    number: "101",
    description: "Fire and rescue emergencies",
    tone: "fire",
  },
  {
    id: "traffic",
    label: "Traffic Police",
    number: "103",
    description: "Road incidents and traffic assistance",
    tone: "police",
  },
  {
    id: "hra",
    label: "Himalayan Rescue Association",
    number: "+977 1 4440292",
    description: "Mountain rescue and altitude illness support",
    tone: "mountain",
  },
  {
    id: "women-helpline",
    label: "Women's Helpline",
    number: "1145",
    description: "Support for women in distress",
    tone: "support",
  },
];

export function sanitizePhoneNumber(number: string) {
  return number.replace(/[^\d+]/g, "");
}

export function createDefaultSafetyCheckIn(now = Date.now()): SafetyCheckIn {
  return {
    lastCheckedInAt: new Date(now).toISOString(),
    windowHours: SAFETY_CHECKIN_WINDOW_HOURS,
    originLabel: "Current stop",
    nextCheckpointLabel: "Next safe checkpoint",
  };
}

export function getCheckInStatus(checkIn: SafetyCheckIn, now = Date.now()) {
  const startedAt = Date.parse(checkIn.lastCheckedInAt);
  const safeStartedAt = Number.isFinite(startedAt) ? startedAt : now;
  const expiresAt = safeStartedAt + checkIn.windowHours * HOUR_MS;
  const remainingMs = Math.max(0, expiresAt - now);
  const elapsedMs = Math.max(0, now - safeStartedAt);
  const totalMs = Math.max(HOUR_MS, checkIn.windowHours * HOUR_MS);
  const progress = Math.min(1, elapsedMs / totalMs);
  const overdue = now >= expiresAt;

  return {
    overdue,
    expiresAt,
    remainingMs,
    progress,
    label: overdue
      ? "Checkpoint overdue - check in now"
      : `${formatDuration(remainingMs)} remaining`,
  };
}

export function createSosIncident({
  isOffline,
  contact,
  location,
  checkIn,
  now = Date.now(),
}: {
  isOffline: boolean;
  contact: EmergencyContact;
  location: SosLocation;
  checkIn: SafetyCheckIn;
  now?: number;
}): SosIncident {
  const createdAt = new Date(now).toISOString();
  const mode = isOffline ? "offline" : "online";
  const status: SosIncidentStatus = isOffline ? "queued-offline" : "ready-to-send";

  return {
    id: `sos-${now}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt,
    mode,
    status,
    contactId: contact.id,
    contactLabel: contact.label,
    contactNumber: contact.number,
    locationLabel: location.label,
    lat: location.lat,
    lng: location.lng,
    accuracyMeters: location.accuracyMeters,
    message: buildSosMessage({ contact, location, checkIn, createdAt, mode }),
  };
}

export function buildSosMessage({
  contact,
  location,
  checkIn,
  createdAt,
  mode,
}: {
  contact: EmergencyContact;
  location: SosLocation;
  checkIn: SafetyCheckIn;
  createdAt: string;
  mode: "offline" | "online";
}) {
  const parts = [
    "Paila SOS: I need emergency help.",
    `Target contact: ${contact.label} (${contact.number}).`,
    `Created: ${createdAt}.`,
    `Mode: ${mode === "offline" ? "offline queue" : "online ready"}.`,
    `Location: ${location.label}.`,
  ];

  if (typeof location.accuracyMeters === "number") {
    parts.push(`GPS accuracy: about ${location.accuracyMeters} m.`);
  }

  if (typeof location.lat === "number" && typeof location.lng === "number") {
    parts.push(
      `Coordinates: ${location.lat}, ${location.lng}.`,
      `Map: https://maps.google.com/?q=${location.lat},${location.lng}`,
    );
  }

  parts.push(
    `Last check-in: ${checkIn.lastCheckedInAt}.`,
    `Next checkpoint: ${checkIn.nextCheckpointLabel}.`,
  );

  return parts.join(" ");
}

export function parseSafetyCheckIn(value: string | null): SafetyCheckIn | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isRecord(parsed)) return null;
    const lastCheckedInAt = parsed.lastCheckedInAt;
    const windowHours = parsed.windowHours;
    const originLabel = parsed.originLabel;
    const nextCheckpointLabel = parsed.nextCheckpointLabel;

    if (
      typeof lastCheckedInAt !== "string" ||
      typeof windowHours !== "number" ||
      typeof originLabel !== "string" ||
      typeof nextCheckpointLabel !== "string" ||
      Number.isNaN(Date.parse(lastCheckedInAt)) ||
      windowHours <= 0
    ) {
      return null;
    }

    return {
      lastCheckedInAt,
      windowHours,
      originLabel,
      nextCheckpointLabel,
    };
  } catch {
    return null;
  }
}

export function parseSosIncidents(value: string | null): SosIncident[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSosIncident).slice(0, 10);
  } catch {
    return [];
  }
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSosIncident(value: unknown): value is SosIncident {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.createdAt === "string" &&
    (value.mode === "offline" || value.mode === "online") &&
    (value.status === "queued-offline" || value.status === "ready-to-send") &&
    typeof value.contactId === "string" &&
    typeof value.contactLabel === "string" &&
    typeof value.contactNumber === "string" &&
    typeof value.locationLabel === "string" &&
    typeof value.message === "string"
  );
}
