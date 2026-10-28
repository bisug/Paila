// Digital Trekking Permits for Nepal (TIMS, ACAP, Sagarmatha, Langtang)
// Uses native Web Crypto API for zero-roundtrip offline cryptographic authentication.

export type PermitType = "TIMS_INDIVIDUAL" | "TIMS_GUIDED" | "ACAP" | "SNP" | "LNP";

export type TrekkingPermit = {
  id: string;
  permitNumber: string;
  permitType: PermitType;
  title: string;
  area: string;
  trekkerName: string;
  nationality: string;
  passportOrId: string;
  entryCheckpoint: string;
  exitCheckpoint: string;
  route: string;
  validFrom: string;
  validTo: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  issuedBy: string;
  signature?: string;
};

export type CheckpointPassageLog = {
  id: string;
  permitId: string;
  permitNumber: string;
  checkpointName: string;
  altitudeMeters: number;
  verifierRole: string;
  timestamp: string;
};

const AUTHORITY_SECRET = "PAILA_NEPAL_TOURISM_BOARD_ACAP_KEY_2026";
const PERMIT_PREFIX = "paila:permit:v1:";

function canonicalPermitString(permit: Omit<TrekkingPermit, "signature">): string {
  return [
    permit.id,
    permit.permitNumber,
    permit.permitType,
    permit.trekkerName,
    permit.passportOrId,
    permit.entryCheckpoint,
    permit.exitCheckpoint,
    permit.validFrom,
    permit.validTo,
  ].join("|");
}

// Convert string to Uint8Array
function strToBuf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to Hex String
function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Compute HMAC-SHA256 signature using native Web Crypto API
export async function signPermit(
  permit: Omit<TrekkingPermit, "signature"> | TrekkingPermit,
): Promise<string> {
  const canonical = canonicalPermitString(permit);
  const subtle: SubtleCrypto =
    globalThis.crypto?.subtle ??
    ((await import("crypto")).webcrypto.subtle as unknown as SubtleCrypto);

  const key = await subtle.importKey(
    "raw",
    strToBuf(AUTHORITY_SECRET) as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sigBuf = await subtle.sign("HMAC", key, strToBuf(canonical) as BufferSource);
  return bufToHex(sigBuf);
}

// Serialize signed permit to a compact verifiable string
export async function generatePermitQrPayload(
  permit: Omit<TrekkingPermit, "signature"> | TrekkingPermit,
): Promise<string> {
  const signature = await signPermit(permit);
  const fullPermit: TrekkingPermit = { ...permit, signature };
  const jsonStr = JSON.stringify(fullPermit);
  const b64 =
    typeof window !== "undefined"
      ? btoa(unescape(encodeURIComponent(jsonStr)))
      : Buffer.from(jsonStr).toString("base64");
  return `${PERMIT_PREFIX}${b64}`;
}

export type PermitVerificationResult = {
  valid: boolean;
  status: "authentic" | "expired" | "tampered" | "invalid_format";
  permit?: TrekkingPermit;
  reason?: string;
  isExpired?: boolean;
};

// Cryptographically verify a scanned permit token offline
export async function verifyPermitQrPayload(rawInput: string): Promise<PermitVerificationResult> {
  try {
    let jsonStr = "";
    if (rawInput.startsWith(PERMIT_PREFIX)) {
      const b64 = rawInput.slice(PERMIT_PREFIX.length);
      jsonStr =
        typeof window !== "undefined"
          ? decodeURIComponent(escape(atob(b64)))
          : Buffer.from(b64, "base64").toString("utf-8");
    } else {
      // Direct JSON payload
      jsonStr = rawInput;
    }

    const permit = JSON.parse(jsonStr) as TrekkingPermit;
    if (!permit.id || !permit.permitNumber || !permit.permitType || !permit.signature) {
      return {
        valid: false,
        status: "invalid_format",
        reason: "Missing required permit fields or signature.",
      };
    }

    const expectedSig = await signPermit(permit);
    if (expectedSig !== permit.signature) {
      return {
        valid: false,
        status: "tampered",
        permit,
        reason: "Cryptographic signature mismatch. Permit payload may have been altered.",
      };
    }

    // Check expiration date
    const now = new Date().toISOString().slice(0, 10);
    if (permit.validTo < now) {
      return {
        valid: false,
        status: "expired",
        permit,
        isExpired: true,
        reason: `Permit expired on ${permit.validTo}.`,
      };
    }

    return {
      valid: true,
      status: "authentic",
      permit,
      isExpired: false,
    };
  } catch (err) {
    return {
      valid: false,
      status: "invalid_format",
      reason: err instanceof Error ? err.message : "Unable to decode permit QR code.",
    };
  }
}

// ── Pre-seeded Demo Permits (For Aarav Sharma) ──────────────────────────────────
export const SEED_PERMITS: TrekkingPermit[] = [
  {
    id: "permit-acap-2026",
    permitNumber: "ACAP-2026-9812",
    permitType: "ACAP",
    title: "ACAP Entry Permit",
    area: "Annapurna Conservation Area",
    trekkerName: "Aarav Sharma",
    nationality: "Nepali",
    passportOrId: "NPL-8821903",
    entryCheckpoint: "Nayapul Checkpoint (1,070m)",
    exitCheckpoint: "Besisahar Checkpoint (760m)",
    route: "Nayapul → Ghorepani → Ghandruk → Annapurna Base Camp → Nayapul",
    validFrom: "2026-03-01",
    validTo: "2026-11-30",
    emergencyContact: {
      name: "Sita Sharma",
      phone: "+977-9841234567",
      relationship: "Spouse",
    },
    issuedBy: "National Trust for Nature Conservation (NTNC)",
    signature: "99636646295dea11482034cc10fee665059b5393bfa68b6daef25a6d592b5366",
  },
  {
    id: "permit-tims-2026",
    permitNumber: "TIMS-2026-4431",
    permitType: "TIMS_GUIDED",
    title: "TIMS Trekkers' Card",
    area: "Nepal Trekking Regions",
    trekkerName: "Aarav Sharma",
    nationality: "Nepali",
    passportOrId: "NPL-8821903",
    entryCheckpoint: "Nayapul",
    exitCheckpoint: "Besisahar",
    route: "Annapurna Sanctuary Trail",
    validFrom: "2026-03-01",
    validTo: "2026-11-30",
    emergencyContact: {
      name: "Sita Sharma",
      phone: "+977-9841234567",
      relationship: "Spouse",
    },
    issuedBy: "Trekking Agencies' Association of Nepal (TAAN) / NTB",
    signature: "f150b824010aeb4406c6ff42414ea74f8c6c0f6ba2cc400542b6c47baec9a603",
  },
];

// ── Checkpoint Passage Logging ───────────────────────────────────────────────
const CHECKPOINT_LOGS_KEY = "paila_checkpoint_logs";

export function logCheckpointPassage(
  log: Omit<CheckpointPassageLog, "id" | "timestamp">,
): CheckpointPassageLog {
  const entry: CheckpointPassageLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    if (typeof window !== "undefined") {
      const existing: CheckpointPassageLog[] = JSON.parse(
        localStorage.getItem(CHECKPOINT_LOGS_KEY) || "[]",
      );
      existing.unshift(entry);
      localStorage.setItem(CHECKPOINT_LOGS_KEY, JSON.stringify(existing.slice(0, 50)));
    }
  } catch (err) {
    console.warn("Could not save checkpoint log offline", err);
  }

  return entry;
}

export function getCheckpointPassageLogs(permitId?: string): CheckpointPassageLog[] {
  try {
    if (typeof window === "undefined") return [];
    const logs: CheckpointPassageLog[] = JSON.parse(
      localStorage.getItem(CHECKPOINT_LOGS_KEY) || "[]",
    );
    if (!permitId) return logs;
    return logs.filter((l) => l.permitId === permitId);
  } catch {
    return [];
  }
}
