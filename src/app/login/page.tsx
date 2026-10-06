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
          <p className="text-xs text-muted-foreground">Sign in to your operator workspace</p>
        </div>

        {/* Card */}
        <Card className="border-border bg-card shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials or continue with Google to access your dashboard.
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
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
                <span className="bg-card px-2 text-muted-foreground">or with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
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
                />
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
              <Link href="/signup" className="text-foreground hover:underline font-medium">
                Create one now
              </Link>
            </p>
          </CardFooter>
        </Card>
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
