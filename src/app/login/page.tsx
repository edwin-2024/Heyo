"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "account_not_linked") {
      setErrorMessage(
        "An account with this email already exists using email & password. Please log in using your password below."
      );
    } else if (error) {
      setErrorMessage(`Authentication notice: ${error}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn.email({
        email,
        password,
      });

      if (res.error) {
        if (
          res.error.code === "EMAIL_NOT_VERIFIED" ||
          res.error.message?.toLowerCase().includes("email not verified")
        ) {
          setErrorMessage(
            "Email not verified. Please check your inbox for the OTP verification code or re-register to get a fresh code."
          );
        } else if (
          res.error.message?.toLowerCase().includes("invalid email or password") ||
          res.error.code === "INVALID_EMAIL_OR_PASSWORD"
        ) {
          setErrorMessage(
            "Invalid email or password. If you originally signed up with Google, please click 'Continue with Google' above."
          );
        } else {
          setErrorMessage(res.error.message || "Invalid credentials. Please try again.");
        }
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initiate Google sign in.";
      setErrorMessage(message);
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-background text-foreground transition-colors selection:bg-primary/20 selection:text-foreground overflow-x-hidden">
      {/* Background grain texture */}
      <div className="grain dark:opacity-[0.035] opacity-[0.015]" aria-hidden="true" />

      {/* Top back navigation */}
      <div className="absolute top-6 left-6 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors bg-card/60 backdrop-blur-md border border-border px-3 py-1.5 rounded-full shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Heyo</span>
        </Link>
      </div>

      {/* LEFT COLUMN: Auth Form Area */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between px-6 sm:px-12 lg:px-16 py-12 z-20">
        {/* Top Spacer / Brand */}
        <div className="pt-8 sm:pt-4">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <svg
                className="w-4 h-4 shrink-0 fill-current"
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
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">
              Heyo<span className="font-normal text-muted-foreground">.ai</span>
            </span>
          </Link>
        </div>

        {/* Center Card */}
        <div className="w-full max-w-md mx-auto my-8">
          <Card className="border-border bg-card/90 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Subtle top edge liquid shine reflection */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />

            <CardHeader className="space-y-1.5 pb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-pixel text-muted-foreground uppercase tracking-wider">
                  AUTH // OPERATOR GATE
                </span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <CardTitle className="text-2xl font-medium tracking-tight">
                Welcome back
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Sign in to your operator workspace to manage autonomous AI agents and live chats.
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
                className="w-full h-10 border-input bg-background/80 hover:bg-accent text-foreground transition flex items-center justify-center gap-2.5 text-xs font-medium cursor-pointer shadow-sm"
                onClick={handleGoogleSignIn}
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
                <span>Continue with Google</span>
              </Button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                  <span className="bg-card px-2.5 text-muted-foreground font-mono">
                    or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="operator@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-10 text-xs bg-background/60"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    disabled={isLoading}
                    className="h-10 text-xs bg-background/60"
                  />
                </div>

                <Button
                  type="submit"
                  variant="default"
                  size="btn"
                  className="w-full mt-2 font-medium shadow-md"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 border-t border-border pt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Don&apos;t have a workspace yet?{" "}
                <Link
                  href="/signup"
                  className="text-foreground hover:underline font-semibold"
                >
                  Create one now
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>

        {/* Footer info */}
        <div className="text-center sm:text-left text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border/50 pt-4">
          <span>&copy; {new Date().getFullYear()} Heyo Technologies Inc.</span>
          <span className="font-pixel text-[9px] uppercase tracking-wider text-muted-foreground/80">
            SECURE NEON TLS 1.3
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Cinematic Video Stage & Pixel Font Telemetry */}
      <div className="hidden lg:flex lg:w-1/2 relative min-h-screen overflow-hidden border-l border-border bg-black items-center justify-center p-12">
        {/* Looping video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          aria-hidden="true"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260818_072341_50851634-bbc3-4c33-9acc-7647d4db44aa.mp4"
            type="video/mp4"
          />
        </video>

        {/* Radial vignette scrim overlay */}
        <div
          className="absolute inset-0 bg-radial-[circle_at_50%_50%] from-black/20 via-black/60 to-black/90 pointer-events-none"
          aria-hidden="true"
        />

        {/* Floating Atmospheric Telemetry Overlay */}
        <div className="relative z-10 w-full max-w-lg space-y-6">
          {/* Top Pixel Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-pixel text-[11px] text-emerald-300 tracking-wider">
              HEYO CORE // v1.0 ONLINE
            </span>
          </div>

          {/* Editorial Display Heading */}
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-medium tracking-tight text-white leading-tight">
              Deploy <span className="font-serif italic text-neutral-300">AI agents</span> grounded in your docs.
            </h2>
            <p className="text-sm text-neutral-300 leading-relaxed max-w-md">
              Sub-second vector retrieval with Step 3 intent classification and instantaneous PartyKit operator handoffs.
            </p>
          </div>

          {/* Pixel Font Terminal Widget / Telemetry Panel */}
          <div className="rounded-2xl border border-white/15 bg-black/70 backdrop-blur-xl p-5 space-y-3 shadow-2xl text-xs font-pixel text-neutral-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5 text-[10px] text-neutral-400">
              <span className="tracking-widest">// SYSTEM TELEMETRY</span>
              <span className="text-emerald-400 font-mono">LATENCY &lt; 400MS</span>
            </div>

            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <div className="flex justify-between">
                <span className="text-neutral-400">VECTOR EMBED:</span>
                <span className="text-cyan-300">384-DIM BGE-SMALL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">INTENT CLASSIFIER:</span>
                <span className="text-amber-300">GROQ LLAMA-3.1-8B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">SYNTHESIS ENGINE:</span>
                <span className="text-purple-300">LLAMA-3.3-70B</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">HANDOFF GATE:</span>
                <span className="text-emerald-300">DUAL-GUARDRAIL (&gt;=0.65)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-400">
              <span>STATUS: READY</span>
              <span className="text-neutral-300">ROOM: default_live</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
