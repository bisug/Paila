import { useEffect as useScriptEffect } from "react";
function Script({ src }: { src: string; strategy?: string }) {
  useScriptEffect(() => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }, [src]);
  return null;
}
import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  QrCode,
  X,
  SwitchCamera,
  Zap,
  ZapOff,
  ImagePlus,
} from "lucide-react";
import { toast } from "sonner";
import { type LedgerTab, pine } from "@/lib/data";

// ── Verified host profile tab ──────────────────────────────────────────────
function VerifiedProfile() {
  const features = [
    "Clean drinking water provided",
    "Secure door locks on all rooms",
    "Solo-female traveller approved",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 rounded-2xl bg-stone-50 border border-stone-100 p-4">
        <img
          src="https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=400&q=85"
          alt="Ama Sita, verified host"
          width={72}
          height={72}
          className="h-16 w-16 rounded-2xl object-cover shrink-0"
        />
        <div className="min-w-0">
          <h4 className="text-base font-bold text-stone-900">Ama Sita</h4>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-pine px-2.5 py-1 text-[11px] font-semibold text-white">
            <BadgeCheck size={12} />
            NTB Certified Host #0482
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {features.map((feature) => (
          <div
            key={feature}
            className="flex items-center gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3"
          >
            <CheckCircle2 size={16} color={pine} className="shrink-0" />
            <span className="text-sm font-medium text-stone-700">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Fair price ledger tab ──────────────────────────────────────────────────
function FairPriceLedger() {
  const rows = [
    { label: "Kathmandu factory price", value: "50 NPR", pct: 25, color: "bg-slate-400" },
    { label: "Mule & porter portage", value: "120 NPR", pct: 60, color: "bg-terracotta" },
    { label: "Host's tea house margin", value: "30 NPR", pct: 15, color: "bg-amber-400" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        {rows.map((r) => (
          <div key={r.label} className={r.color} style={{ width: `${r.pct}%` }} />
        ))}
      </div>
      <div className="rounded-2xl border border-stone-100 bg-white overflow-hidden">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-3 ${i < rows.length - 1 ? "border-b border-stone-50" : ""}`}
          >
            <div className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${row.color}`} />
              <span className="text-sm text-stone-600">{row.label}</span>
            </div>
            <span className="text-sm font-semibold text-stone-900">{row.value}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between rounded-2xl bg-pine px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-white/70">Total fair price</p>
          <p className="text-base font-bold text-white mt-0.5">200 NPR</p>
        </div>
        <p className="text-xs text-right font-medium text-white/80 max-w-[140px] leading-snug">
          Zero middleman commission. 100% direct.
        </p>
      </div>
    </div>
  );
}

// ── Scanner main view ──────────────────────────────────────────────────────
export function ScannerView() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tab, setTab] = useState<LedgerTab>("profile");

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  // AI Scan state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera function
  function stopCamera() {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchOn(false);
    setHasTorch(false);
  }

  function tick() {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx || !(window as any).jsQR) {
      requestRef.current = requestAnimationFrame(tick);
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        // QR Code detected
        stopCamera();
        setSheetOpen(true);
        setAiResult(null); // Ensure AI result is empty for QR
        return;
      }
    }

    requestRef.current = requestAnimationFrame(tick);
  }

  function startScanner(mode: "environment" | "user" = facingMode) {
    stopCamera();
    setCameraError("");
    setSheetOpen(false);
    setAiResult(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not supported in this browser.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: mode } })
      .then((stream) => {
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        setIsScanning(true);
        setFacingMode(mode);

        // Check for flashlight (torch) support
        const track = stream.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          if ((capabilities as any).torch) {
            setHasTorch(true);
          }
        }

        requestRef.current = requestAnimationFrame(() => tick());
      })
      .catch((err) => {
        console.error("Error accessing camera", err);
        setCameraError(
          "Camera permission required. Please allow camera access in your browser settings.",
        );
      });
  }

  // Auto-start camera on mount
  useEffect(() => {
    startScanner();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleCamera() {
    const newMode = facingMode === "environment" ? "user" : "environment";
    startScanner(newMode);
  }

  function toggleTorch() {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];

    if (track && track.applyConstraints) {
      const newTorchState = !torchOn;
      track
        .applyConstraints({
          advanced: [{ torch: newTorchState } as any],
        })
        .then(() => {
          setTorchOn(newTorchState);
        })
        .catch((err) => {
          console.error("Failed to toggle torch", err);
        });
    }
  }

  async function analyzeImage(blob: Blob) {
    setIsAnalyzing(true);
    setSheetOpen(true);
    stopCamera();

    try {
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");

      const response = await fetch("/api/scan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to analyze image");

      const data = await response.json();
      setAiResult(data);
    } catch (error) {
      console.error(error);
      toast.error("Couldn't analyze the image. Please try again.");
      setSheetOpen(false);
      startScanner();
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleCaptureSite() {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) analyzeImage(blob);
      },
      "image/jpeg",
      0.8,
    );
  }

  // Handle manual image upload
  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    analyzeImage(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="min-h-screen bg-stone-900 px-4 pt-6 pb-24 flex flex-col">
      <Script
        src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"
        strategy="lazyOnload"
      />
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Page header */}
      <div className="mb-5 shrink-0">
        <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta mb-1">
          Identity & Heritage Scanner
        </p>
        <h2 className="text-2xl font-bold text-white leading-tight">Scan Sites or Badges</h2>
        <p className="mt-1 text-sm text-stone-400">
          Point your camera at a heritage site to learn its history, or scan a host's QR badge.
        </p>
      </div>

      {/* Full-height Camera viewfinder */}
      <div className="relative flex-1 min-h-[260px] xs:min-h-[340px] sm:min-h-[420px] overflow-hidden rounded-sheet bg-stone-800 shadow-float">
        {/* Real video feed */}
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${isScanning ? "opacity-100" : "opacity-0"}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Fallback image when not scanning */}
        {!isScanning && (
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85"
            alt="Camera preview background"
            className="object-cover opacity-20"
          />
        )}

        {/* Error message / Fallback UI */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 gap-4 bg-stone-950/80 backdrop-blur-sm">
            <p className="text-sm font-semibold text-red-400 max-w-[250px]">{cameraError}</p>
            <button
              type="button"
              onClick={() => startScanner()}
              className="flex w-full max-w-[200px] items-center justify-center gap-2 rounded-xl bg-terracotta py-3 text-sm font-bold text-white shadow-sm"
            >
              <Camera size={16} /> Allow Camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full max-w-[200px] items-center justify-center gap-2 rounded-xl bg-stone-700 py-3 text-sm font-bold text-white shadow-sm border border-stone-600"
            >
              <ImagePlus size={16} /> Upload Image Instead
            </button>
          </div>
        )}

        {/* Scan corners (Only when scanning) */}
        {isScanning && (
          <div className="absolute inset-10 pointer-events-none animate-scan-corners">
            <span className="absolute left-0 top-0 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-white" />
            <span className="absolute right-0 top-0 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-white" />
            <span className="absolute bottom-0 left-0 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-white" />
            <span className="absolute bottom-0 right-0 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-white" />
          </div>
        )}

        {/* Toolbar (Only visible when scanning) */}
        {isScanning && (
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-4 z-20">
            {/* Main AI Capture Button */}
            <button
              onClick={handleCaptureSite}
              className="flex items-center gap-2 bg-terracotta text-white px-6 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
            >
              <Camera size={18} /> Identify Site
            </button>

            <div className="flex justify-center gap-6 px-6">
              {/* Gallery Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform"
              >
                <ImagePlus size={20} />
              </button>

              {/* Flashlight Toggle */}
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform ${torchOn ? "bg-white text-stone-900" : "bg-black/40 text-white"}`}
                >
                  {torchOn ? <Zap size={20} className="fill-current" /> : <ZapOff size={20} />}
                </button>
              )}

              {/* Flip Camera */}
              <button
                onClick={toggleCamera}
                className="grid h-12 w-12 place-items-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-lg active:scale-95 transition-transform"
              >
                <SwitchCamera size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Loading state message */}
        {!isScanning && !cameraError && !isAnalyzing && (
          <p className="absolute bottom-4 left-0 right-0 text-center text-xs font-semibold text-white/70 bg-stone-900/40 py-1 backdrop-blur-sm">
            Initializing camera...
          </p>
        )}
      </div>

      {/* ── Result bottom sheet ─────────────────────────────────────────── */}
      {sheetOpen && (
        <div
          className="absolute inset-x-0 bottom-0 z-50 rounded-t-[28px] bg-white px-4 pt-5 shadow-float"
          style={{
            paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-pine mb-1">
                {aiResult ? "Heritage Identified" : "Village Council Match"}
              </p>
              <h3 className="text-xl font-bold text-stone-900">
                {aiResult ? aiResult.name : "Ama Sita — Verified ✓"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(false);
                setAiResult(null);
                startScanner(); // restart camera when closing
              }}
              className="h-9 w-9 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors shrink-0"
              aria-label="Close scan result"
            >
              <X size={16} />
            </button>
          </div>

          {isAnalyzing ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terracotta mb-4"></div>
              <p className="text-stone-500 font-medium">Analyzing image...</p>
            </div>
          ) : aiResult ? (
            <div className="space-y-4 pb-4">
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <h4 className="font-bold text-stone-900 mb-1">History</h4>
                <p className="text-sm text-stone-600 leading-relaxed">{aiResult.history}</p>
              </div>
              <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                <h4 className="font-bold text-stone-900 mb-1">Cultural Significance</h4>
                <p className="text-sm text-stone-600 leading-relaxed">{aiResult.significance}</p>
              </div>
              <div>
                <h4 className="font-bold text-stone-900 mb-2 px-1">Quick Facts</h4>
                <div className="space-y-2">
                  {aiResult.facts.map((fact: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-stone-100 bg-white px-4 py-3"
                    >
                      <CheckCircle2 size={16} color={pine} className="shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-stone-700">{fact}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Legacy QR Code Result
            <>
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
                {(["profile", "ledger"] as LedgerTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-lg py-2 text-sm font-semibold transition-all ${
                      tab === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-500"
                    }`}
                  >
                    {t === "profile" ? "Verified ID" : "Fair Prices"}
                  </button>
                ))}
              </div>
              {tab === "profile" ? <VerifiedProfile /> : <FairPriceLedger />}
            </>
          )}
        </div>
      )}
    </div>
  );
}
