"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ShieldCheck,
  X,
  Copy,
  Check,
  MapPin,
  Calendar,
  User,
  PhoneCall,
  History,
} from "lucide-react";
import {
  type TrekkingPermit,
  generatePermitQrPayload,
  getCheckpointPassageLogs,
  type CheckpointPassageLog,
} from "@/lib/permits";
import { QrCodeSvg } from "@/components/ui/QrCodeSvg";
import { toast } from "sonner";

type PermitQrModalProps = {
  permit: TrekkingPermit;
  open: boolean;
  onClose: () => void;
};

export function PermitQrModal({ permit, open, onClose }: PermitQrModalProps) {
  const [qrPayload, setQrPayload] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState<CheckpointPassageLog[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const payload = await generatePermitQrPayload(permit);
      if (mounted) {
        setQrPayload(payload);
        setLogs(getCheckpointPassageLogs(permit.id));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [permit]);

  const handleCopy = () => {
    if (!qrPayload) return;
    navigator.clipboard.writeText(qrPayload);
    setCopied(true);
    toast.success("Permit cryptographic token copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-tactile animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-pine/10 text-pine border border-pine/30 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck size={13} />
                Cryptographically Signed Pass
              </span>
              <Dialog.Title className="text-xl font-bold text-foreground mt-2 leading-tight">
                {permit.title}
              </Dialog.Title>
              <p className="text-xs text-muted-foreground mt-0.5">
                Official permit issued by {permit.issuedBy}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="h-9 w-9 grid place-items-center rounded-xl bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          {/* ── High-Contrast QR Code Card ────────────────────── */}
          <div className="rounded-2xl bg-white p-5 border border-stone-200 shadow-sm flex flex-col items-center text-center my-4">
            <div className="bg-white p-2 rounded-xl shadow-xs">
              <QrCodeSvg value={qrPayload || permit.permitNumber} size={190} />
            </div>
            <p className="mt-3 font-mono font-bold text-sm tracking-widest text-stone-900">
              {permit.permitNumber}
            </p>
            <p className="text-[11px] font-medium text-stone-500 mt-0.5">
              Scan at checkpoint · 100% Offline Verifiable
            </p>
          </div>

          {/* ── Permit Details ─────────────────────────────────── */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <User size={14} className="text-terracotta" /> Trekker Name
              </span>
              <span className="font-bold text-foreground">{permit.trekkerName}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <Calendar size={14} className="text-terracotta" /> Validity
              </span>
              <span className="font-bold text-foreground">
                {permit.validFrom} → {permit.validTo}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <span className="flex items-center gap-2 text-muted-foreground font-medium mb-1">
                <MapPin size={14} className="text-terracotta" /> Authorized Route
              </span>
              <p className="font-semibold text-foreground leading-relaxed pl-6">{permit.route}</p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <span className="flex items-center gap-2 text-muted-foreground font-medium">
                <PhoneCall size={14} className="text-pine" /> Emergency Contact
              </span>
              <span className="font-bold text-foreground">
                {permit.emergencyContact.name} ({permit.emergencyContact.phone})
              </span>
            </div>
          </div>

          {/* ── Passage Logs History ───────────────────────────── */}
          {logs.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                <History size={13} className="text-pine" /> Checkpoint Passage History
              </h4>
              <div className="space-y-1.5">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-pine-tint/40 border border-pine/20 text-[11px]"
                  >
                    <div>
                      <p className="font-bold text-pine">{log.checkpointName}</p>
                      <p className="text-muted-foreground">
                        Elevation {log.altitudeMeters}m · Verified by {log.verifierRole}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Token Copy Action for Testing / Scanners ───────── */}
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-stone-200 py-2.5 px-4 text-xs font-bold transition-all"
            >
              {copied ? <Check size={14} className="text-pine" /> : <Copy size={14} />}
              <span>{copied ? "Token Copied!" : "Copy Offline Token"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-terracotta hover:bg-terracotta/90 text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all"
            >
              Done
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
