"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp, signIn, emailOtp } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Mail,
  RotateCcw,
} from "lucide-react";
import { REGEXP_ONLY_DIGITS } from "input-otp";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] = useState<"form" | "verify">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await signUp.email({
        email,
        password,
        name: name.trim() || email.split("@")[0],
      });

      if (res.error) {
        setErrorMessage(
          res.error.message || "Failed to create account. Please try again."
        );
        setIsLoading(false);
        return;
      }

      // Explicitly request email OTP verification from Neon Auth
      const otpRes = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (otpRes.error) {
        setErrorMessage(
          otpRes.error.message || "Could not dispatch verification code. Please try again."
        );
        setIsLoading(false);
        return;
      }

      setStep("verify");
      setSuccessMessage(`We sent a 6-digit verification code to ${email}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const targetOtp = (codeToVerify || otp).trim();
    if (targetOtp.length < 6) {
      setErrorMessage("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      const res = await emailOtp.verifyEmail({
        email,
        otp: targetOtp,
      });

      if (res.error) {
        setErrorMessage(
          res.error.message || "Invalid or expired verification code."
        );
      } else {
        // Verification succeeded! Ensure active session and route to dashboard
        await signIn.email({ email, password }).catch(() => {});
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed.";
      setErrorMessage(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setIsResending(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (res.error) {
        setErrorMessage(res.error.message || "Failed to resend code.");
      } else {
        setSuccessMessage("A fresh 6-digit code has been sent to your email.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to resend code.";
      setErrorMessage(message);
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to initiate Google sign up.";
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4 py-12 transition-colors selection:bg-primary/20 selection:text-foreground">
      {/* Background grain */}
      <div className="grain dark:opacity-[0.035] opacity-[0.015]" aria-hidden="true" />

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Heyo
        </Link>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Logo and Brand */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <svg
              className="w-6 h-6 shrink-0 fill-current text-foreground"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <g transform="rotate(-30 12 12)">
                <circle cx="7.3" cy="3.2" r="1.45" />
                <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
                <circle cx="16.7" cy="20.8" r="1.45" />
              </g>
            </svg>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Heyo<span className="font-normal text-muted-foreground">.ai</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground">
            Create your operator account & workspace
          </p>
        </div>

        {/* Card */}
        <Card className="border-border bg-card shadow-2xl">
          {step === "form" ? (
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-xl">Create your workspace</CardTitle>
                <CardDescription>
                  Launch an autonomous, guardrailed AI support agent for your
                  website in minutes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {errorMessage && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition flex items-center justify-center gap-2 text-xs font-medium cursor-pointer shadow-sm"
                  onClick={handleGoogleSignUp}
                  disabled={isGoogleLoading || isLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  Sign up with Google
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                    <span className="bg-card px-2 text-muted-foreground">
                      or with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Jane Operator"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Work Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="operator@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Single-member workspace automatically provisioned</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Requires 6-digit email OTP verification</span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="default"
                    size="btn"
                    className="w-full mt-2 font-medium"
                    disabled={isLoading || isGoogleLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Sending verification code...
                      </span>
                    ) : (
                      "Create Workspace"
                    )}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 border-t border-border pt-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="text-foreground hover:underline font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </>
          ) : (
            <>
              {/* Step 2: Shadcn Input OTP Screen */}
              <CardHeader className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <KeyRound className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    Email Verification
                  </span>
                </div>
                <CardTitle className="text-xl">Check your inbox</CardTitle>
                <CardDescription>
                  Enter the 6-digit code sent by Neon Auth to{" "}
                  <strong className="text-foreground font-semibold">{email}</strong>.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {errorMessage && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-2 space-y-4">
                  <Label htmlFor="input-otp" className="text-xs text-muted-foreground text-center">
                    Enter one-time code
                  </Label>
                  <InputOTP
                    id="input-otp"
                    maxLength={6}
                    pattern={REGEXP_ONLY_DIGITS}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      if (val.length === 6) {
                        handleVerifyOtp(val);
                      }
                    }}
                    disabled={isVerifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                    </InputOTPGroup>
                    <InputOTPSeparator />
                    <InputOTPGroup>
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="button"
                  variant="default"
                  size="btn"
                  className="w-full font-medium"
                  onClick={() => handleVerifyOtp()}
                  disabled={isVerifying || otp.length < 6}
                >
                  {isVerifying ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying code...
                    </span>
                  ) : (
                    "Verify & Enter Dashboard"
                  )}
                </Button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setOtp("");
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-muted-foreground hover:text-foreground transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-foreground hover:opacity-80 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isResending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3 w-3" />
                    )}
                    Resend code
                  </button>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
