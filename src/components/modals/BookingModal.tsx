import { useState, useEffect } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  WalletCards,
  X,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
} from "lucide-react";
import { type Experience } from "@/lib/data";

type CheckoutStep = "form" | "select_method" | "auth_wallet" | "processing" | "success";
type PaymentMethod = "esewa" | "khalti" | "bank";

export function BookingModal({
  experience,
  onClose,
}: {
  experience: Experience;
  onClose: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [step, setStep] = useState<CheckoutStep>("form");
  const [method, setMethod] = useState<PaymentMethod>("esewa");

  // Wallet login state
  const [phone, setPhone] = useState("98");
  const [pin, setPin] = useState("");
  const [loginError, setLoginError] = useState("");

  // Processing delay simulation
  useEffect(() => {
    if (step === "processing") {
      const timer = setTimeout(() => {
        setStep("success");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleWalletSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || !/^9[78]\d{8}$/.test(phone)) {
      setLoginError("Please enter a valid 10-digit Nepalese mobile number.");
      return;
    }
    if (pin.length < 4) {
      setLoginError("Please enter a valid 4-digit wallet PIN.");
      return;
    }
    setLoginError("");
    setStep("processing");
  };

  // ── 1. Success confirmation screen ───────────────────────────────────────
  if (step === "success") {
    return (
      <div className="absolute inset-0 z-50 flex items-end p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-h-[90vh] overflow-y-auto rounded-modal bg-white p-6 shadow-float text-center animate-slide-up"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-pine-tint relative">
            <CheckCircle2 size={36} className="text-pine" strokeWidth={2} />
            <span className="absolute -top-1 -right-1 bg-terracotta text-white rounded-full p-1 shadow-sm animate-bounce">
              <Sparkles size={10} />
            </span>
          </div>

          <p className="text-[11px] font-bold uppercase tracking-widest text-pine mb-1">
            Booking Confirmed
          </p>
          <h2 className="text-xl font-bold text-stone-900 mb-1">{experience.title}</h2>
          <p className="text-sm text-stone-500">{experience.place}</p>

          <div className="mt-4 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 text-left">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Date</span>
              <span className="font-semibold text-stone-800">{selectedDate}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-stone-500">Host</span>
              <span className="font-semibold text-stone-800 flex items-center gap-1">
                {experience.host}
                {experience.verified && <BadgeCheck size={13} className="text-pine" />}
              </span>
            </div>
            <div className="flex justify-between text-sm mb-2 pb-2 border-b border-stone-200/50">
              <span className="text-stone-500">Method</span>
              <span className="font-bold text-stone-700 capitalize">{method} wallet</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-stone-500">Directly transferred</span>
              <span className="font-bold text-pine">{experience.price} NPR</span>
            </div>
          </div>

          {/* Stamp Notification */}
          <div className="mt-4 p-3 bg-terracotta-tint rounded-xl border border-terracotta/10 flex items-center gap-3 text-left">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-terracotta">
                Stamp Unlocked
              </p>
              <h4 className="text-xs font-bold text-stone-900 leading-snug">
                "Direct Booking" stamp added to your passport!
              </h4>
            </div>
          </div>

          <p className="mt-4 text-xs text-stone-400">
            100% goes directly to {experience.host}'s eSewa wallet. No commission.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-pine py-3 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── 2. Processing Screen ─────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="absolute inset-0 z-50 flex items-end p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-h-[90vh] overflow-y-auto rounded-modal bg-white px-5 py-12 shadow-float text-center flex flex-col items-center justify-center animate-slide-up"
          style={{ paddingBottom: "max(3rem, env(safe-area-inset-bottom))" }}
        >
          <Loader2 size={42} className="animate-spin text-terracotta mb-4" />
          <h3 className="text-lg font-bold text-stone-950">Directing eSewa Wire</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-[200px] leading-relaxed">
            Securing bypass channel to transfer 100% to {experience.host}...
          </p>
        </div>
      </div>
    );
  }

  // ── 3. Wallet Login Screen ───────────────────────────────────────────────
  if (step === "auth_wallet") {
    const isEsewa = method === "esewa";
    const brandColor = isEsewa
      ? "text-green-600 border-green-200 bg-green-50"
      : "text-purple-600 border-purple-200 bg-purple-50";
    const btnColor = isEsewa
      ? "bg-green-600 hover:bg-green-700"
      : "bg-purple-600 hover:bg-purple-700";

    return (
      <div className="absolute inset-0 z-50 flex items-end p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-h-[90vh] overflow-y-auto rounded-modal bg-white shadow-float animate-slide-up"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto pt-3 pb-1 w-10">
            <div className="h-1 w-full rounded-full bg-stone-200" />
          </div>
          <div className="px-5 pb-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4 pt-3">
              <div>
                <span
                  className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${brandColor}`}
                >
                  {isEsewa ? "eSewa Direct" : "Khalti Checkout"}
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-1.5">Direct Transfer Login</h2>
                <p className="text-xs text-stone-500 mt-0.5">Amount: Rs. {experience.price}</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("select_method")}
                aria-label="Go back"
                className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200"
              >
                ←
              </button>
            </div>

            {loginError && (
              <p className="mb-4 text-xs font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl p-3">
                {loginError}
              </p>
            )}

            <form onSubmit={handleWalletSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  maxLength={10}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600">
                  Wallet Password/PIN
                </label>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold tracking-[0.5em] outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                />
              </div>

              <div className="flex gap-2.5 p-3 rounded-xl bg-blue-50 border border-blue-100 text-[10px] text-blue-800 font-medium leading-normal">
                <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                <span>
                  Simulation: This is a safe checkout mockup. Do not enter actual credentials. Mock
                  values are approved.
                </span>
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-all ${btnColor}`}
              >
                Pay Rs. {experience.price}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── 4. Method Selection Screen ───────────────────────────────────────────
  if (step === "select_method") {
    return (
      <div className="absolute inset-0 z-50 flex items-end p-4 bg-stone-950/50 backdrop-blur-sm animate-fade-in">
        <div
          className="w-full max-h-[90vh] overflow-y-auto rounded-modal bg-white shadow-float animate-slide-up"
          style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto pt-3 pb-1 w-10">
            <div className="h-1 w-full rounded-full bg-stone-200" />
          </div>
          <div className="px-5 pb-6">
            {/* Header */}
            <div className="mb-5 flex items-start justify-between gap-4 pt-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1">
                  Step 2 of 3
                </p>
                <h2 className="text-lg font-bold text-stone-900">Choose Payment Method</h2>
                <p className="text-xs text-stone-500 mt-0.5">Pay 100% direct to the host</p>
              </div>
              <button
                type="button"
                onClick={() => setStep("form")}
                aria-label="Go back"
                className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200"
              >
                ←
              </button>
            </div>

            {/* Methods list */}
            <div className="space-y-3 mb-6">
              {[
                {
                  id: "esewa",
                  name: "eSewa Direct Wallet",
                  desc: "Instantly wire funds directly",
                  tag: "RECOMMENDED",
                  color: "border-green-300 bg-green-50/30 text-green-700 text-[10px] font-bold",
                },
                {
                  id: "khalti",
                  name: "Khalti digital wallet",
                  desc: "Direct wallet-to-wallet transfer",
                  tag: "",
                  color: "border-purple-300",
                },
                {
                  id: "bank",
                  name: "Direct Bank Link",
                  desc: "Wire using IPS Connect / Fonepay",
                  tag: "",
                  color: "border-teal-300",
                },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMethod(m.id as PaymentMethod);
                    setStep("auth_wallet");
                  }}
                  className={`w-full flex items-center justify-between p-4 border rounded-2xl text-left hover:bg-stone-50 transition-colors shadow-sm ${
                    method === m.id
                      ? "border-primary ring-2 ring-primary/10"
                      : "border-stone-200/80"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm text-stone-900">{m.name}</p>
                      {m.tag && (
                        <span className="bg-green-100 text-green-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {m.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-stone-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 5. Standard Booking Form (Step 1) ──────────────────────────────────
  return (
    <div className="absolute inset-0 z-50 flex items-end p-4 bg-stone-950/50 backdrop-blur-sm">
      <div
        className="w-full max-h-[90vh] overflow-y-auto rounded-modal bg-white shadow-float"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* Sheet handle */}
        <div className="mx-auto pt-3 pb-1 w-10">
          <div className="h-1 w-full rounded-full bg-stone-200" />
        </div>

        <div className="px-5 pb-6">
          {/* Header */}
          <div className="mb-5 flex items-start justify-between gap-4 pt-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-terracotta mb-1">
                Step 1 of 3: Direct Booking
              </p>
              <h2 className="text-lg font-bold text-stone-900 leading-tight">{experience.title}</h2>
              <p className="mt-0.5 text-sm text-stone-500">{experience.place}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-stone-100 text-stone-500 hover:bg-stone-200 transition-colors"
              aria-label="Close booking"
            >
              <X size={16} />
            </button>
          </div>

          {/* Date picker */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-semibold text-stone-600">Select Date</label>
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/15 transition-all">
              <CalendarDays size={16} className="text-terracotta shrink-0" />
              <input
                type="date"
                value={selectedDate}
                min={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-stone-800 outline-none"
              />
            </div>
          </div>

          {/* Pricing transparency */}
          <div className="mb-5 rounded-xl bg-pine-tint border border-pine/10 px-4 py-3">
            <div className="flex items-center justify-between text-sm font-semibold text-stone-700">
              <span>Host receives</span>
              <span className="text-pine font-bold">
                100% — {experience.price} {experience.priceUnit}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
              <div className="h-1.5 w-full rounded-full bg-pine" />
            </div>
            <p className="mt-2 text-xs text-pine/70">No middlemen. No platform fee.</p>
          </div>

          {/* Confirm CTA */}
          <button
            type="button"
            onClick={() => setStep("select_method")}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-terracotta py-3.5 text-sm font-bold text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <WalletCards size={18} />
            Proceed to Checkout — {experience.price} NPR
          </button>
        </div>
      </div>
    </div>
  );
}
