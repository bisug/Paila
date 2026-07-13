"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Footprints,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { supabase } from "@/integrations/supabase/client";

type AuthMode = "login" | "signup";
type IdentifierMode = "email" | "phone";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

function normalizePhone(value: string) {
  return value.replace(/[^\d+]/g, "");
}

function getSafeRedirectPath(value: string | null, fallback = "/profile") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (value.startsWith("/auth/") || value.startsWith("/login")) return fallback;
  return value;
}

function getPasswordIssues(password: string) {
  const issues = [];
  if (password.length < 8) issues.push("Use at least 8 characters.");
  if (!/[A-Za-z]/.test(password)) issues.push("Add at least one letter.");
  if (!/\d/.test(password)) issues.push("Add at least one number.");
  return issues;
}

export default function LoginPage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [identifierMode, setIdentifierMode] = useState<IdentifierMode>("email");
  const [nextPath] = useState(() => {
    if (typeof window === "undefined") return "/profile";
    const params = new URLSearchParams(window.location.search);
    return getSafeRedirectPath(params.get("next"));
  });
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [resendingPhone, setResendingPhone] = useState(false);

  const passwordIssues = useMemo(() => getPasswordIssues(password), [password]);
  const isSignup = authMode === "signup";

  function resetFeedback() {
    setError("");
    setNotice("");
  }

  function authRedirectTo(targetPath: string) {
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(targetPath)}`;
  }

  function validateForm() {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = normalizePhone(phone);

    if (identifierMode === "email" && !EMAIL_PATTERN.test(trimmedEmail)) {
      return "Enter a valid email address.";
    }

    if (identifierMode === "phone" && !PHONE_PATTERN.test(trimmedPhone)) {
      return "Enter a phone number in E.164 format, for example +9779800000000.";
    }

    if (isSignup && fullName.trim().length < 2) {
      return "Enter your full name.";
    }

    if (!password) {
      return "Enter your password.";
    }

    if (isSignup && passwordIssues.length > 0) {
      return passwordIssues[0];
    }

    if (isSignup && password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  }

  async function submitPasswordAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = normalizePhone(phone);
    const signupNextPath = "/onboarding/account-type";
    const trimmedFullName = fullName.trim();
    const userMetadata = {
      ...(trimmedFullName ? { full_name: trimmedFullName } : {}),
      auth_method: identifierMode,
    };

    try {
      if (isSignup && identifierMode === "email") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: authRedirectTo(signupNextPath),
            data: userMetadata,
          },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.refresh();
          router.replace(signupNextPath);
          return;
        }

        setNotice("Check your email to confirm your account, then continue to onboarding.");
        return;
      }

      if (isSignup && identifierMode === "phone") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          phone: trimmedPhone,
          password,
          options: { data: userMetadata },
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          router.refresh();
          router.replace(signupNextPath);
          return;
        }

        setPendingPhone(trimmedPhone);
        setNotice("Enter the verification code sent by SMS to finish signup.");
        return;
      }

      const { error: signInError } =
        identifierMode === "email"
          ? await supabase.auth.signInWithPassword({ email: trimmedEmail, password })
          : await supabase.auth.signInWithPassword({ phone: trimmedPhone, password });

      if (signInError) throw signInError;

      router.refresh();
      router.replace(nextPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function continueWithGoogle() {
    resetFeedback();
    setOauthLoading(true);
    const redirectPath = isSignup ? "/onboarding/account-type" : nextPath;

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: authRedirectTo(redirectPath),
          queryParams: { prompt: "select_account" },
        },
      });

      if (oauthError) throw oauthError;
    } catch (err) {
      setOauthLoading(false);
      setError(err instanceof Error ? err.message : "Could not start Google sign-in.");
    }
  }

  async function verifyPhoneOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetFeedback();

    const token = phoneOtp.replace(/\D/g, "");
    if (!pendingPhone || token.length !== 6) {
      setError("Enter the 6-digit SMS verification code.");
      return;
    }

    setVerifyingPhone(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token,
        type: "sms",
      });

      if (verifyError) throw verifyError;

      if (data.session) {
        router.refresh();
        router.replace("/onboarding/account-type");
        return;
      }

      setNotice("Phone verified. You can now sign in.");
      setAuthMode("login");
      setPhone(pendingPhone);
      setPendingPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify the SMS code.");
    } finally {
      setVerifyingPhone(false);
    }
  }

  async function resendPhoneOtp() {
    resetFeedback();
    if (!pendingPhone) return;

    setResendingPhone(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "sms",
        phone: pendingPhone,
      });

      if (resendError) throw resendError;
      setNotice("A new verification code was sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the verification code.");
    } finally {
      setResendingPhone(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 xs:px-6">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-center">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-card bg-terracotta shadow-float">
            <Footprints size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-stone-900">Welcome to Paila</h1>
          <p className="mt-2 text-sm font-medium text-stone-500">
            Secure access for bookings, checkpoints, and travel profiles.
          </p>
        </div>

        <div className="rounded-card border border-stone-100 bg-white p-4 shadow-card md:p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
            {(["login", "signup"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-pressed={authMode === mode}
                onClick={() => {
                  setAuthMode(mode);
                  resetFeedback();
                }}
                className={`rounded-lg px-3 py-2 text-sm font-bold transition ${
                  authMode === mode
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-500 hover:text-stone-800"
                }`}
              >
                {mode === "login" ? "Log in" : "Sign up"}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={continueWithGoogle}
            disabled={oauthLoading || submitting}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-800 shadow-sm hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {oauthLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <ShieldCheck size={16} className="text-pine" />
            )}
            Continue with Google
          </button>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={identifierMode === "email"}
              onClick={() => {
                setIdentifierMode("email");
                setPendingPhone("");
                resetFeedback();
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                identifierMode === "email"
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-stone-200 text-stone-500 hover:text-stone-800"
              }`}
            >
              <Mail size={14} />
              Email
            </button>
            <button
              type="button"
              aria-pressed={identifierMode === "phone"}
              onClick={() => {
                setIdentifierMode("phone");
                resetFeedback();
              }}
              className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                identifierMode === "phone"
                  ? "border-terracotta bg-terracotta/10 text-terracotta"
                  : "border-stone-200 text-stone-500 hover:text-stone-800"
              }`}
            >
              <Phone size={14} />
              Number
            </button>
          </div>

          <form onSubmit={submitPasswordAuth} className="space-y-3">
            {isSignup && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">
                  Full name
                </span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">
                {identifierMode === "email" ? "Email" : "Phone number"}
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/30">
                {identifierMode === "email" ? (
                  <Mail size={16} className="shrink-0 text-stone-400" />
                ) : (
                  <Phone size={16} className="shrink-0 text-stone-400" />
                )}
                <input
                  type={identifierMode === "email" ? "email" : "tel"}
                  value={identifierMode === "email" ? email : phone}
                  onChange={(event) =>
                    identifierMode === "email"
                      ? setEmail(event.target.value)
                      : setPhone(event.target.value)
                  }
                  placeholder={identifierMode === "email" ? "you@example.com" : "+9779800000000"}
                  autoComplete={identifierMode === "email" ? "email" : "tel"}
                  inputMode={identifierMode === "email" ? "email" : "tel"}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">
                Password
              </span>
              <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm transition focus-within:border-terracotta focus-within:ring-2 focus-within:ring-terracotta/30">
                <LockKeyhole size={16} className="shrink-0 text-stone-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className="min-w-0 flex-1 bg-transparent text-sm font-medium text-stone-900 outline-none placeholder:text-stone-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {isSignup && (
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-stone-500">
                  Confirm password
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-medium text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-terracotta focus:ring-2 focus:ring-terracotta/30"
                />
              </label>
            )}

            {isSignup && password.length > 0 && (
              <div className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                {passwordIssues.length === 0 ? (
                  <p className="flex items-center gap-2 text-xs font-semibold text-pine">
                    <CheckCircle2 size={14} />
                    Password meets the minimum requirements.
                  </p>
                ) : (
                  <ul className="space-y-1 text-xs font-semibold text-stone-500">
                    {passwordIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {error && (
              <p className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-700">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-xl border border-pine/15 bg-pine-tint p-3 text-xs font-semibold text-pine">
                {notice}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting || oauthLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowRight size={14} />
              )}
              {isSignup ? "Create secure account" : "Log in securely"}
            </button>
          </form>

          {pendingPhone && (
            <form
              onSubmit={verifyPhoneOtp}
              className="mt-4 rounded-xl border border-pine/15 bg-pine-tint p-3"
            >
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-pine">
                  SMS code
                </span>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={(event) =>
                    setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="123456"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full rounded-xl border border-pine/20 bg-white px-3 py-2.5 text-center text-lg font-bold tracking-[0.35em] text-stone-900 outline-none focus:border-pine"
                />
              </label>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={resendPhoneOtp}
                  disabled={resendingPhone || verifyingPhone}
                  className="rounded-xl border border-pine/20 bg-white px-3 py-2.5 text-xs font-bold text-pine disabled:opacity-60"
                >
                  {resendingPhone ? "Sending..." : "Resend"}
                </button>
                <button
                  type="submit"
                  disabled={verifyingPhone || resendingPhone}
                  className="flex items-center justify-center gap-2 rounded-xl bg-pine px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  {verifyingPhone && <Loader2 size={13} className="animate-spin" />}
                  Verify
                </button>
              </div>
            </form>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-xs font-bold text-stone-500 hover:bg-stone-100 hover:text-stone-800"
        >
          Browse without account
        </button>
      </div>
    </div>
  );
}
