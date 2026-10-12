"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import usePartySocket from "partysocket/react";
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
  BookOpen,
  Building2,
  Pencil,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LiveInbox } from "@/components/dashboard/inbox/LiveInbox";
import { HomeDashboardOverview } from "@/components/dashboard/home/HomeDashboardOverview";
import { KnowledgeBaseView } from "@/components/dashboard/knowledge/KnowledgeBaseView";
import { cn } from "@/lib/utils";
import { orpc } from "@/lib/orpc";

export type NavTab = "home" | "inbox" | "knowledge";

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
  initialSession,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: clientSession, isPending } = useSession();
  const session = clientSession || initialSession;

  // Active navigation tab (Home Overview vs Live Inbox vs Knowledge Base)
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileOverride, setProfileOverride] = useState<{
    name?: string;
    avatarUrl?: string | null;
  }>({});

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [workspaceName, setWorkspaceName] = useState<string>("My Workspace");
  const [workspaceId, setWorkspaceId] = useState<string>("");

  // Sync unread / waiting inbox conversation count and workspace name
  const refreshWaitingCount = useCallback((wsId: string) => {
    if (!wsId) return;
    orpc.conversation
      .listConversations({ workspaceId: wsId })
      .then((list) => {
        if (!list) return;
        // User rule: Only alert when a customer is actually asking for a human (WAITING_HUMAN)
        const waiting = list.filter((c) => c.status === "WAITING_HUMAN").length;
        setUnreadCount(waiting);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    orpc.workspace
      .getWorkspace()
      .then(async (ws) => {
        if (!mounted || !ws?.id) return;
        setWorkspaceId(ws.id);
        if (ws.name) {
          setWorkspaceName(ws.name);
        } else if (ws.widgetSettings?.brandTitle) {
          setWorkspaceName(ws.widgetSettings.brandTitle);
        }
        refreshWaitingCount(ws.id);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [activeTab, refreshWaitingCount]);

  // Connect to PartyKit Edge Room for real-time inbox alerts
  usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: workspaceId ? `inbox_${workspaceId}` : "dummy_inbox",
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (
          data.type === "conversation:status_changed" ||
          data.type === "conversation:updated"
        ) {
          if (workspaceId) refreshWaitingCount(workspaceId);
        }
      } catch {}
    },
  });

  // Local window event for instantaneous cross-component state synchronization (resolving, taking over)
  useEffect(() => {
    const handleLocalStatusChanged = () => {
      if (workspaceId) refreshWaitingCount(workspaceId);
    };
    window.addEventListener("heyo:conversation_status_changed", handleLocalStatusChanged);
    return () => {
      window.removeEventListener("heyo:conversation_status_changed", handleLocalStatusChanged);
    };
  }, [workspaceId, refreshWaitingCount]);

  // Sync isCollapsed and operator profile from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        const storedCollapsed = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (storedCollapsed !== null) {
          setIsCollapsed(storedCollapsed === "true");
        }
      }
      const storedProfile = localStorage.getItem("heyo_operator_profile");
      if (storedProfile) {
        setProfileOverride(JSON.parse(storedProfile));
      }
    } catch {
      // localStorage may fail in restricted iframes
    }
  }, []);

  const handleToggleCollapse = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Ignore
    }
  };

  // Instantaneous tab navigation without full page reload
  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    const targetUrl =
      tab === "inbox"
        ? "/dashboard/inbox"
        : tab === "knowledge"
        ? "/dashboard/knowledge"
        : "/dashboard";
    if (window.location.pathname !== targetUrl) {
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

  // Auto-redirect if session is lost/logged out
  useEffect(() => {
    if (!isPending && !clientSession && !initialSession) {
      window.location.href = "/login";
    }
  }, [clientSession, isPending, initialSession]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      localStorage.removeItem("heyo_operator_profile");
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      setIsLoggingOut(false);
      window.location.href = "/login";
    }
  };

  const handleSaveWorkspaceName = async () => {
    if (!newWorkspaceName.trim()) return;
    setIsRenaming(true);
    try {
      const updated = await orpc.workspace.createOrUpdateWorkspace({
        name: newWorkspaceName.trim(),
      });
      if (updated?.name) {
        setWorkspaceName(updated.name);
      }
      setIsRenameWorkspaceOpen(false);
    } catch (err) {
      console.error("Failed to rename workspace:", err);
    } finally {
      setIsRenaming(false);
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
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(true)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                    aria-label="Collapse sidebar"
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Collapse sidebar</TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Current Workspace Pill / Indicator */}
          {isCollapsed ? (
            <div className="py-3 flex justify-center border-b border-border/50">
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
              <button
                type="button"
                onClick={() => {
                  setNewWorkspaceName(workspaceName);
                  setIsRenameWorkspaceOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border hover:border-primary/50 hover:bg-muted/80 transition-all text-xs text-left cursor-pointer group"
                title="Click to rename workspace"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                  <div className="truncate">
                    <span className="block text-[10px] text-muted-foreground font-medium uppercase tracking-wider font-mono">
                      Workspace
                    </span>
                    <span className="font-semibold text-foreground truncate block text-xs mt-0.5" title={workspaceName}>
                      {workspaceName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-mono uppercase bg-background border border-border text-muted-foreground px-1.5 py-0.5 rounded font-medium">
                    Solo
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* Primary Navigation Links */}
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
                    {unreadCount > 0 && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
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
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-amber-950 animate-pulse font-mono">
                    {unreadCount} waiting
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground font-mono">0</span>
                )}
              </button>
            )}

            {/* 3. Knowledge Base */}
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => handleSelectTab("knowledge")}
                    className={cn(
                      "w-full h-11 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
                      activeTab === "knowledge"
                        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                    )}
                    aria-label="Knowledge Base"
                  >
                    <BookOpen className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Knowledge Base</TooltipContent>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => handleSelectTab("knowledge")}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium active:scale-[0.98] transition-all cursor-pointer",
                  activeTab === "knowledge"
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4" />
                  <span>Knowledge Base</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    activeTab === "knowledge" ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  RAG Docs
                </span>
              </button>
            )}
          </nav>

          {/* PartyKit Edge Synced Indicator */}
          {!isCollapsed ? (
            <div className="mx-3 mb-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                  <Radio className="h-3 w-3 text-emerald-500 animate-pulse" />
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
                className="w-56 p-1.5"
              >
                <DropdownMenuLabel className="font-normal px-2 py-1.5">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-semibold leading-none">{userName}</p>
                    <p className="text-[10px] leading-none text-muted-foreground font-mono truncate">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setNewWorkspaceName(workspaceName);
                    setIsRenameWorkspaceOpen(true);
                  }}
                  className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-muted focus:bg-muted rounded-lg"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Rename Workspace</span>
                </DropdownMenuItem>
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
                {activeTab === "home" ? "Home Dashboard & Widget Configuration" : activeTab === "knowledge" ? "Knowledge Base & RAG Ingestion" : "Live Conversation Inbox"}
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
                <div
                  className={cn(
                    "h-full w-full",
                    activeTab === "knowledge" ? "block overflow-y-auto p-6 md:p-8" : "hidden"
                  )}
                >
                  <KnowledgeBaseView workspaceId={workspaceId} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      <Dialog open={isRenameWorkspaceOpen} onOpenChange={setIsRenameWorkspaceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Rename Workspace</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update the name of your project or company workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="rename-ws" className="text-xs">Workspace Name</Label>
              <Input
                id="rename-ws"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp, Apex Cloud"
                className="h-9 text-xs"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRenameWorkspaceOpen(false)}
              className="text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isRenaming || !newWorkspaceName.trim()}
              onClick={handleSaveWorkspaceName}
              className="text-xs cursor-pointer"
            >
              {isRenaming ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
