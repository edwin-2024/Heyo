"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import {
  Home,
  Inbox,
  Radio,
  ExternalLink,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LiveInbox } from "@/components/dashboard/inbox/LiveInbox";
import { HomeDashboardOverview } from "@/components/dashboard/home/HomeDashboardOverview";
import { cn } from "@/lib/utils";

export type NavTab = "home" | "inbox";

interface DashboardShellProps {
  children?: React.ReactNode;
  initialTab?: NavTab;
  initialSession?: {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string | null;
      [key: string]: unknown;
    };
  } | null;
}

export function DashboardShell({
  children,
  initialTab = "home",
  initialSession = null,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: clientSession, isPending } = useSession();
  const session = clientSession || initialSession;
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const user = session?.user;
  const userName = user?.name || "Operator";
  const userEmail = user?.email || "operator@heyo.ai";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-foreground">
      {/* Background subtle grain */}
      <div className="grain dark:opacity-[0.035] opacity-[0.015]" aria-hidden="true" />

      {/* 1. Left Sidebar Navigation - Strictly 2 links: Home and Inbox */}
      <aside className="w-64 flex flex-col shrink-0 border-r border-border bg-card/80 backdrop-blur-xl z-20 transition-colors">
        {/* Workspace Brand */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border">
          <Link href="/" className="flex items-center gap-2.5 group">
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
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-foreground/80 transition">
                Heyo<span className="font-normal text-muted-foreground">.ai</span>
              </span>
              <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono">
                Operator Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Workspace pill */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <div className="truncate">
                <span className="block text-[11px] text-muted-foreground font-medium leading-none">
                  Workspace
                </span>
                <span className="font-semibold text-foreground truncate block text-xs mt-0.5">
                  Acme Support (v1)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-background border border-border text-muted-foreground px-1.5 py-0.5 rounded font-medium">
              Solo
            </span>
          </div>
        </div>

        {/* Primary Navigation Links (EXACTLY TWO LINKS: Home and Inbox) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("home");
              router.push("/dashboard");
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium active:scale-[0.98] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer ${
              activeTab === "home"
                ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">
              Overview
            </span>
          </button>

          {/* 2. Inbox */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("inbox");
              router.push("/dashboard/inbox");
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium active:scale-[0.98] transition-[background-color,color,transform] duration-150 ease-out cursor-pointer ${
              activeTab === "inbox"
                ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="h-4 w-4" />
              <span>Inbox</span>
            </div>
            <span className="flex h-5 items-center justify-center rounded-full bg-blue-500/15 px-2 text-[10px] font-bold text-blue-700 dark:text-blue-400 border border-blue-500/20">
              6 waiting
            </span>
          </button>
        </nav>

        {/* Real-time Connection Indicator */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-muted/40 border border-border text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              PartyKit Edge
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
              Synced
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            Room: room_default_live
          </div>
        </div>

        {/* Operator Profile Dropdown & Sign Out */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-border/80 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs">
                    {isPending ? "…" : userInitials || "OP"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate leading-none">
                      {isPending ? "Loading..." : userName}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {isPending ? "..." : userEmail}
                    </p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-56 border-border bg-popover text-popover-foreground shadow-xl p-1.5 rounded-xl mb-1"
            >
              <DropdownMenuLabel className="font-normal px-2 py-1.5">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold text-foreground leading-none">
                    {userName}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-none truncate">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 focus:text-destructive rounded-lg"
              >
                <LogOut className="h-3.5 w-3.5 text-destructive" />
                <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background z-10">
        {/* Top App Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-foreground capitalize">
              {activeTab === "home" ? "Home Dashboard & Widget Configuration" : "Live Conversation Inbox"}
            </h1>
            <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground font-mono">
              v1.0-live
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition bg-muted/60 border border-border px-3 py-1.5 rounded-lg"
            >
              <span>View Landing</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <main
          className={cn(
            "flex-1 overflow-hidden",
            activeTab === "inbox" ? "p-0" : "overflow-y-auto p-6 md:p-8"
          )}
        >
          {children ? (
            children
          ) : activeTab === "inbox" ? (
            <div className="h-full w-full">
              <LiveInbox />
            </div>
          ) : (
            <HomeDashboardOverview userName={userName} />
          )}
        </main>
      </div>
    </div>
  );
}
