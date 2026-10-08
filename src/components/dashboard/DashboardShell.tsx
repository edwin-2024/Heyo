"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import {
  Home,
  Inbox,
  Radio,
  ExternalLink,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeft,
  User,
} from "lucide-react";
import { EditProfileModal } from "@/components/dashboard/EditProfileModal";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const SIDEBAR_STORAGE_KEY = "heyo_sidebar_collapsed";

export function DashboardShell({
  children,
  initialTab = "home",
  initialSession = null,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: clientSession, isPending } = useSession();
  const session = clientSession || initialSession;
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileOverride, setProfileOverride] = useState<{
    name?: string;
    avatarUrl?: string | null;
  }>({});

  // Sync isCollapsed and operator profile from localStorage on mount
  useEffect(() => {
    try {
      const storedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (storedCollapsed !== null) {
        setIsCollapsed(storedCollapsed === "true");
      }
      const storedProfile = localStorage.getItem("heyo_operator_profile");
      if (storedProfile) {
        setProfileOverride(JSON.parse(storedProfile));
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, []);

  // Listen to popstate for browser back/forward buttons
  useEffect(() => {
    const onPopState = () => {
      if (window.location.pathname.startsWith("/dashboard/inbox")) {
        setActiveTab("inbox");
      } else {
        setActiveTab("home");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore storage errors
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    const targetUrl = tab === "home" ? "/dashboard" : "/dashboard/inbox";
    if (typeof window !== "undefined" && window.location.pathname !== targetUrl) {
      window.history.pushState(null, "", targetUrl);
    }
  };

  const handleSaveProfile = (updated: { name: string; avatarUrl?: string | null }) => {
    setProfileOverride(updated);
    try {
      localStorage.setItem("heyo_operator_profile", JSON.stringify(updated));
    } catch {
      // Storage quota or restricted iframe
    }
  };

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
  const userName = profileOverride.name || user?.name || "Operator";
  const userAvatar = profileOverride.avatarUrl || (user as { image?: string | null })?.image || null;
  const userEmail = user?.email || "operator@heyo.ai";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-foreground">
        {/* Background subtle grain */}
        <div className="grain dark:opacity-[0.035] opacity-[0.015]" aria-hidden="true" />

        {/* 1. Left Sidebar Navigation - Collapsible (w-64 expanded, w-[68px] collapsed) */}
        <aside
          className={cn(
            "flex flex-col shrink-0 border-r border-border bg-card/85 backdrop-blur-xl z-20 select-none transition-[width] duration-200 ease-out",
            isCollapsed ? "w-[68px]" : "w-64"
          )}
        >
          {/* Workspace Brand / Header */}
          <div
            className={cn(
              "h-16 flex items-center border-b border-border shrink-0",
              isCollapsed ? "justify-center px-2" : "justify-between px-4"
            )}
          >
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2.5 group overflow-hidden",
                isCollapsed && "justify-center"
              )}
              title="Heyo.ai"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <svg
                  className="w-4.5 h-4.5 shrink-0 fill-current"
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

              {!isCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm tracking-tight text-foreground group-hover:text-foreground/80 transition truncate">
                    Heyo<span className="font-normal text-muted-foreground">.ai</span>
                  </span>
                  <span className="text-[10px] text-muted-foreground tracking-wider uppercase font-mono truncate">
                    Operator Workspace
                  </span>
                </div>
              )}
            </Link>

            {/* Collapse toggle button */}
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => handleToggleCollapse(true)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Collapsed expand trigger or Workspace pill */}
          {isCollapsed ? (
            <div className="p-2 flex justify-center shrink-0">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(false)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    aria-label="Expand sidebar"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Expand sidebar</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="px-3 py-3 shrink-0">
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <div className="truncate">
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono">
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
          )}

          {/* Primary Navigation Links (EXACTLY TWO LINKS: Home and Inbox) */}
          <nav className={cn("flex-1 space-y-1.5 overflow-y-auto", isCollapsed ? "px-2 py-2" : "px-3 py-2")}>
            {/* 1. Home */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("home")}
                    className={cn(
                      "w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      activeTab === "home"
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                    aria-label="Home Overview"
                  >
                    <Home className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Home (Overview)</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectTab("home")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] transition-all cursor-pointer",
                  activeTab === "home"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    activeTab === "home" ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  Overview
                </span>
              </button>
            )}

            {/* 2. Inbox */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("inbox")}
                    className={cn(
                      "w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      activeTab === "inbox"
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                    aria-label="Inbox"
                  >
                    <Inbox className="h-5 w-5" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Inbox</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectTab("inbox")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] transition-all cursor-pointer",
                  activeTab === "inbox"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Inbox className="h-4 w-4" />
                  <span>Inbox</span>
                </div>
                <span className="flex h-5 items-center justify-center rounded-full bg-emerald-500/15 px-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  Live
                </span>
              </button>
            )}

          </nav>

          {/* Real-time Connection Indicator */}
          {!isCollapsed ? (
            <div className="p-3 mx-3 mb-2 rounded-xl bg-muted/40 border border-border text-[11px] space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium">
                  <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  PartyKit Edge
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold font-mono">
                  Synced
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground font-mono truncate">
                Edge WebSockets Active
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 border border-border text-emerald-500 cursor-default">
                    <Radio className="h-4 w-4 animate-pulse" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">PartyKit Edge: Synced</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Operator Profile Dropdown & Sign Out */}
          <div className={cn("border-t border-border", isCollapsed ? "p-2" : "p-3")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {isCollapsed ? (
                  <button
                    type="button"
                    className="w-10 h-10 mx-auto rounded-full flex items-center justify-center bg-card border-2 border-border hover:border-primary/60 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring shadow-sm overflow-hidden"
                    title={userName}
                  >
                    {userAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary font-mono">
                        {isPending ? "…" : userInitials || "OP"}
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-border/80 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-xs overflow-hidden">
                        {userAvatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={userAvatar} alt={userName} className="h-full w-full object-cover" />
                        ) : (
                          isPending ? "…" : userInitials || "OP"
                        )}
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
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isCollapsed ? "right" : "top"}
                align={isCollapsed ? "end" : "start"}
                className="w-56 border-border bg-popover text-popover-foreground shadow-xl p-1.5 rounded-xl mb-1 ml-1"
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
                  onClick={() => setIsEditProfileOpen(true)}
                  className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted focus:bg-muted rounded-lg"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
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

          {/* Dynamic Content Views - Zero-lag instantaneous tab toggle */}
          <main className="flex-1 overflow-hidden relative">
            {children ? (
              children
            ) : (
              <>
                <div
                  className={cn(
                    "h-full w-full",
                    activeTab === "home" ? "block overflow-y-auto p-6 md:p-8" : "hidden"
                  )}
                >
                  <HomeDashboardOverview userName={userName} />
                </div>
                <div
                  className={cn(
                    "h-full w-full",
                    activeTab === "inbox" ? "block" : "hidden"
                  )}
                >
                  <LiveInbox />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <EditProfileModal
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        initialName={userName}
        initialEmail={userEmail}
        initialAvatar={userAvatar}
        onSave={handleSaveProfile}
      />
    </TooltipProvider>
  );
}
