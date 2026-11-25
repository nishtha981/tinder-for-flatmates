import { useState } from "react";
import { startOtp, verifyOtp } from "../api";
import type { User } from "../types";
import { HeroArt, Wordmark } from "./Art";
import Icon from "./Icon";

type Step = "phone" | "otp";

export default function OnboardingRegister({
  onDone,
}: {
  onDone: (user: User) => void;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const mobileValid = /^[6-9]\d{9}$/.test(mobile);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!mobileValid) return setError("Enter a valid 10-digit mobile number.");
    setError("");
    setBusy(true);
    try {
      const { registered } = await startOtp(mobile);
      setRegistered(registered);
      setOtp("");
      setStep("otp");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setError("");
    setBusy(true);
    try {
      await startOtp(mobile);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submitOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      onDone(await verifyOtp(mobile, otp.trim()));
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
              {step === "phone"
                ? "Enter your mobile number"
                : registered
                ? "Welcome back"
                : "Verify your number"}
            </h2>
          </div>

          {step === "phone" ? (
            <form onSubmit={sendCode} className="space-y-5 p-6">
              <p className="text-sm text-ink/70">
                We'll text you a one-time code to sign in or create your account.
              </p>
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

              {error && <p className="text-sm font-semibold text-coral">{error}</p>}

              <button type="submit" disabled={!mobileValid || busy} className="btn btn-coral w-full">
                {busy ? "Sending…" : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="space-y-5 p-6">
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-ink/60 hover:text-ink"
              >
                <Icon name="back" size={16} /> Change number
              </button>
              <p className="text-sm text-ink/70">
                Enter the code we texted to <strong className="text-ink">+91 {mobile}</strong>.
              </p>

              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="● ● ● ● ● ●"
                className="field py-4 text-center text-2xl font-bold tracking-[0.4em]"
              />

              {error && <p className="text-sm font-semibold text-coral">{error}</p>}

              <button type="submit" disabled={otp.trim().length < 4 || busy} className="btn btn-coral w-full">
                {busy ? "Verifying…" : registered ? "Log in" : "Verify & continue"}
              </button>

              <button
                type="button"
                onClick={resend}
                disabled={busy}
                className="btn-ghost w-full text-sm"
              >
                Didn't get it? Resend code
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
