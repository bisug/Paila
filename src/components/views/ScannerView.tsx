import { useEffect as useScriptEffect } from "react";
function Script({ src }: { src: string; strategy?: string }) {
  useScriptEffect(() => {
    // Skip loading external CDN script if browser natively supports BarcodeDetector
    if (typeof window !== "undefined" && "BarcodeDetector" in window) return;
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.body.appendChild(s);
  }, [src]);
  return null;
}
import * as Dialog from "@radix-ui/react-dialog";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
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
    { label: "Kathmandu factory price", value: "50 NPR", pct: 25, color: "bg-stone-400" },
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
  const [qrData, setQrData] = useState<string | null>(null);

  // AI Scan state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraRequestRef = useRef(0);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastScanAtRef = useRef(0);
  const barcodeDetectorRef = useRef<any>(null);
  const isDetectingRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({
          formats: ["qr_code"],
        });
      } catch {
        barcodeDetectorRef.current = null;
      }
    }
  }, []);

  // Stop camera function
  function stopCamera() {
    cameraRequestRef.current += 1;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    requestRef.current = null;
    isDetectingRef.current = false;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setTorchOn(false);
    setHasTorch(false);
    contextRef.current = null;
  }

  async function tick() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const now = performance.now();
    if (now - lastScanAtRef.current < 80) {
      requestRef.current = requestAnimationFrame(() => {
        void tick();
      });
      return;
    }
    lastScanAtRef.current = now;

    if (video.readyState >= video.HAVE_CURRENT_DATA) {
      // 1. Native BarcodeDetector (hardware-accelerated, zero-dependency, works offline)
      if (barcodeDetectorRef.current && !isDetectingRef.current) {
        isDetectingRef.current = true;
        try {
          const barcodes = await barcodeDetectorRef.current.detect(video);
          if (barcodes && barcodes.length > 0 && barcodes[0]?.rawValue) {
            stopCamera();
            setSheetOpen(true);
            setAiResult(null);
            setQrData(barcodes[0].rawValue);
            isDetectingRef.current = false;
            return;
          }
        } catch (e) {
          console.warn("BarcodeDetector error", e);
        } finally {
          isDetectingRef.current = false;
        }
      }

      // 2. Fallback to jsQR via canvas if BarcodeDetector is unavailable
      if (!barcodeDetectorRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = contextRef.current ?? canvas.getContext("2d", { willReadFrequently: true });

        if (ctx && (window as any).jsQR) {
          contextRef.current = ctx;
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          const code = (window as any).jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            stopCamera();
            setSheetOpen(true);
            setAiResult(null);
            setQrData(code.data);
            return;
          }
        } else if (!ctx || !(window as any).jsQR) {
          setCameraError("QR scanner is still loading. Please try again.");
          return;
        }
      }
    }

    requestRef.current = requestAnimationFrame(() => {
      void tick();
    });
  }

  function startScanner(mode: "environment" | "user" = facingMode) {
    stopCamera();
    setCameraError("");
    setSheetOpen(false);
    setAiResult(null);
    setQrData(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera API not supported in this browser.");
      return;
    }

    const requestId = cameraRequestRef.current;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: mode } })
      .then((stream) => {
        if (requestId !== cameraRequestRef.current || !videoRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
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

        requestRef.current = requestAnimationFrame(() => {
          void tick();
        });
      })
      .catch((err) => {
        console.error("Error accessing camera", err);
        setCameraError(
          "Camera permission required. Please allow camera access in your browser settings.",
        );
      });
  }

  useEffect(() => {
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
    <div className="min-h-screen bg-stone-900 px-4 pt-6 pb-32 md:pb-12 flex flex-col">
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
      <div className="mb-5 shrink-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta mb-1">
            Identity & Heritage Scanner
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            Scan Sites & Badges
          </h1>
          <p className="mt-1 text-sm text-stone-300 max-w-xl">
            Point camera at a temple or stupa for AI heritage context, or scan a host's village
            council QR code.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-300 bg-stone-800/80 rounded-full px-3 py-1.5 w-fit border border-stone-700/60 shrink-0">
          <BadgeCheck size={14} className="text-pine" />
          <span>Offline QR supported</span>
        </div>
      </div>

      {/* Full-height Camera viewfinder */}
      <div className="relative flex-1 min-h-[300px] xs:min-h-[380px] sm:min-h-[460px] overflow-hidden rounded-sheet bg-stone-950 shadow-float border border-stone-800">
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
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
        )}

        {/* Error message / Fallback UI */}
        {cameraError && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 gap-4 bg-stone-950/85 backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-red-400 max-w-[260px]">{cameraError}</p>
            <button
              type="button"
              onClick={() => startScanner()}
              className="flex w-full max-w-[200px] items-center justify-center gap-2 rounded-xl bg-terracotta py-3 text-sm font-bold text-white shadow-sm hover:bg-terracotta/90 active:scale-95 transition-all"
            >
              <Camera size={16} /> Allow Camera
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full max-w-[200px] items-center justify-center gap-2 rounded-xl bg-stone-800 hover:bg-stone-700 py-3 text-sm font-bold text-white shadow-sm border border-stone-700 active:scale-95 transition-all"
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
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3.5 z-20 px-4">
            {/* Main AI Capture Button */}
            <button
              onClick={handleCaptureSite}
              className="flex items-center gap-2 bg-terracotta text-white px-6 py-3 rounded-full font-bold shadow-float hover:bg-terracotta/90 active:scale-95 transition-transform"
            >
              <Camera size={18} /> Identify Landmark
            </button>

            <div className="flex items-center justify-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 border border-white/15">
              {/* Gallery Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload photo"
                title="Upload photo"
                className="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <ImagePlus size={19} />
              </button>

              {/* Flashlight Toggle */}
              {hasTorch && (
                <button
                  onClick={toggleTorch}
                  aria-pressed={torchOn}
                  aria-label={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                  title={torchOn ? "Turn off flashlight" : "Turn on flashlight"}
                  className={`grid h-10 w-10 place-items-center rounded-full active:scale-95 transition-all ${torchOn ? "bg-white text-stone-900" : "text-white/90 hover:text-white hover:bg-white/10"}`}
                >
                  {torchOn ? <Zap size={19} className="fill-current" /> : <ZapOff size={19} />}
                </button>
              )}

              {/* Flip Camera */}
              <button
                onClick={toggleCamera}
                aria-label="Switch camera"
                title="Switch camera"
                className="grid h-10 w-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              >
                <SwitchCamera size={19} />
              </button>
            </div>
          </div>
        )}

        {/* Standby UI when not scanning */}
        {!isScanning && !cameraError && !isAnalyzing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-stone-950/60 backdrop-blur-xs">
            <div className="h-16 w-16 rounded-full bg-white/10 border border-white/20 grid place-items-center mb-4 text-white shadow-float">
              <Camera size={28} strokeWidth={1.8} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1.5">Viewfinder Standby</h3>
            <p className="text-xs text-stone-300 max-w-xs mb-5 leading-relaxed">
              Start camera to detect host QR codes or photograph temples and monuments for heritage
              insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 w-full max-w-xs">
              <button
                type="button"
                onClick={() => startScanner()}
                className="flex-1 flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-terracotta/90 active:scale-95 transition-all"
              >
                <Camera size={16} /> Start camera
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white active:scale-95 transition-all"
              >
                <ImagePlus size={16} /> Upload image
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Result bottom sheet (Radix: focus trap, Escape, aria-modal) ── */}
      <Dialog.Root
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSheetOpen(false);
            setAiResult(null);
            startScanner(); // restart camera when closing
          }
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm animate-fade-in" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-50 rounded-t-sheet bg-white px-4 pt-5 shadow-float animate-slide-up"
            style={{
              paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <Dialog.Title className="sr-only">Scan result</Dialog.Title>
            <div aria-live="polite">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-pine mb-1">
                    {aiResult ? "Heritage Identified" : "Village Council Match"}
                  </p>
                  <h3 className="text-xl font-bold text-stone-900">
                    {aiResult ? aiResult.name : "QR code scanned"}
                  </h3>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="h-11 w-11 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors shrink-0"
                    aria-label="Close scan result"
                  >
                    <X size={16} />
                  </button>
                </Dialog.Close>
              </div>

              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-terracotta mb-4"></div>
                  <p className="text-stone-500 font-medium">Analyzing image...</p>
                </div>
              ) : aiResult ? (
                <div className="space-y-4 pb-4">
                  <p className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] font-semibold text-amber-900 leading-snug">
                    Prototype recognition — this sample result is returned for every image.
                  </p>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <h4 className="font-bold text-stone-900 mb-1">History</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">{aiResult.history}</p>
                  </div>
                  <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
                    <h4 className="font-bold text-stone-900 mb-1">Cultural Significance</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {aiResult.significance}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 mb-2 px-1">Quick Facts</h4>
                    {aiResult.facts?.length > 0 ? (
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
                    ) : (
                      <p className="px-1 text-sm text-stone-500">No quick facts available.</p>
                    )}
                  </div>
                </div>
              ) : qrData ? (
                <>
                  <div className="mb-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
                    <h4 className="mb-2 font-bold text-stone-900">Scanned content</h4>
                    <p className="break-words text-sm text-stone-700">{qrData}</p>
                  </div>
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
              ) : null}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
