import { useState } from "react";
import { register } from "../api";
import type { User } from "../types";
import { HeroArt, Wordmark } from "./Art";
import Icon from "./Icon";

const DEMO_OTP = "123456";

type Step = "details" | "otp";

export default function OnboardingRegister({
  onDone,
}: {
  onDone: (user: User) => void;
}) {
  const [step, setStep] = useState<Step>("details");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mobileValid = /^[6-9]\d{9}$/.test(mobile);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  function submitDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileValid) return setError("Enter a valid 10-digit mobile number.");
    if (!emailValid) return setError("Enter a valid email address.");
    setError("");
    setStep("otp");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (otp.trim() !== DEMO_OTP) {
      return setError("Incorrect OTP. (Hint: use 123456 for this demo.)");
    }
    setError("");
    setBusy(true);
    try {
      onDone(await register(mobile, email));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center px-5 py-8 sm:py-12">
      <div className="w-full max-w-5xl grid items-center gap-8 md:grid-cols-2 md:gap-14">
        {/* Hero */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <HeroArt className="w-64 sm:w-80 md:w-full md:max-w-md" />
          <div className="-mt-4 md:mt-2">
            <Wordmark />
          </div>
          <p className="mt-4 inline-block rounded-full border-2 border-ink bg-white px-4 py-1.5 text-sm font-semibold sm:text-base">
            Find your perfect Bangalore flatmate
          </p>
          <ul className="mt-6 hidden space-y-2 text-sm font-medium text-ink/70 md:block">
            <li className="flex items-center gap-2"><Icon name="rupee" size={18} className="text-coral" /> Only people within your budget</li>
            <li className="flex items-center gap-2"><Icon name="pin" size={18} className="text-coral" /> Only people looking in your areas</li>
            <li className="flex items-center gap-2"><Icon name="chat" size={18} className="text-coral" /> Match, then chat in real time</li>
          </ul>
        </div>

        {/* Form card */}
        <div className="card w-full max-w-md mx-auto overflow-hidden">
          <div className="bar px-6 py-4 text-center">
            <h2 className="text-xl font-bold">
              {step === "details" ? "Create your account" : "Verify it's you"}
            </h2>
          </div>

          {step === "details" ? (
            <form onSubmit={submitDetails} className="space-y-5 p-6">
              <label className="block">
                <span className="label">Mobile number</span>
                <div className="field flex items-center gap-2 py-0 pl-3">
                  <Icon name="phone" size={18} className="text-ink/50" />
                  <span className="border-r-2 border-ink/15 pr-2 text-sm font-semibold">+91</span>
                  <input
                    inputMode="numeric"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  />
                </div>
              </label>

              <label className="block">
                <span className="label">Email</span>
                <div className="field flex items-center gap-2 py-0 pl-3">
                  <Icon name="mail" size={18} className="text-ink/50" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 bg-transparent py-3 outline-none"
                  />
                </div>
              </label>

              {error && <p className="text-sm font-semibold text-coral">{error}</p>}

              <button type="submit" disabled={!mobileValid || !emailValid} className="btn btn-coral w-full">
                Send OTP
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5 p-6">
              <button
                type="button"
                onClick={() => { setStep("details"); setError(""); }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink"
              >
                <Icon name="back" size={16} /> Edit details
              </button>
              <p className="text-sm text-ink/70">
                We sent a code to <strong className="text-ink">+91 {mobile}</strong> and{" "}
                <strong className="text-ink">{email}</strong>.
              </p>
              <div className="rounded-2xl border-2 border-dashed border-violet bg-violet-tint px-4 py-2.5 text-sm">
                Demo mode — your OTP is <strong>123456</strong>
              </div>

              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="● ● ● ● ● ●"
                className="field py-4 text-center text-2xl font-bold tracking-[0.5em]"
              />

              {error && <p className="text-sm font-semibold text-coral">{error}</p>}

              <button type="submit" disabled={otp.length !== 6 || busy} className="btn btn-coral w-full">
                {busy ? "Verifying…" : "Verify & continue"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
