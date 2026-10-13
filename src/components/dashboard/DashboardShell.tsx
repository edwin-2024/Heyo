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
import { toast } from "sonner";

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
  initialWorkspace?: {
    id: string;
    name: string;
    widgetSettings?: any;
  } | null;
}

const SIDEBAR_STORAGE_KEY = "heyo_sidebar_collapsed";

export function DashboardShell({
  children,
  initialTab = "home",
  initialSession,
  initialWorkspace,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: clientSession, isPending } = useSession();
  const session = clientSession || initialSession;

  // Active navigation tab (Home Overview vs Live Inbox vs Knowledge Base)
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isRenameWorkspaceOpen, setIsRenameWorkspaceOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState(
    initialWorkspace?.name || ""
  );
  const [isRenaming, setIsRenaming] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profileOverride, setProfileOverride] = useState<{
    name?: string;
    avatarUrl?: string | null;
  }>({});

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [workspaceName, setWorkspaceName] = useState<string>(
    initialWorkspace?.name || "My Workspace"
  );
  const [workspaceId, setWorkspaceId] = useState<string>(
    initialWorkspace?.id || ""
  );

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
    if (initialWorkspace?.id) {
      refreshWaitingCount(initialWorkspace.id);
    }
    orpc.workspace
      .getWorkspace({ workspaceId: workspaceId || initialWorkspace?.id || undefined })
      .then(async (ws) => {
        if (!mounted || !ws?.id) return;
        setWorkspaceId(ws.id);
        if (ws.name) {
          setWorkspaceName(ws.name);
          setNewWorkspaceName(ws.name);
        } else if (ws.widgetSettings?.brandTitle) {
          setWorkspaceName(ws.widgetSettings.brandTitle);
          setNewWorkspaceName(ws.widgetSettings.brandTitle);
        }
        refreshWaitingCount(ws.id);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [activeTab, refreshWaitingCount, initialWorkspace?.id, workspaceId]);

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
      toast.success("Profile updated");
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
        workspaceId: workspaceId || initialWorkspace?.id || undefined,
      });
      if (updated?.name) {
        setWorkspaceName(updated.name);
      }
      toast.success("Workspace updated successfully");
      setIsRenameWorkspaceOpen(false);
    } catch (err: any) {
      console.error("Failed to rename workspace:", err);
      toast.error(err?.message || "Failed to save workspace");
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
        <div className="grain dark:opacity-[0.035] opacity-[0.015]\" aria-hidden="true" />

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
                  viewBox="24 24"
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleCollapse(true)}
                className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Collapsed expand trigger */}
          {isCollapsed && (
            <div className="pt-2 px-2 flex justify-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleToggleCollapse(false)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Workspace Switcher / Name Pill */}
          {!isCollapsed && (
            <div className="p-3 border-b border-border/60">
              <div className="group flex items-center justify-between p-2 rounded-xl bg-muted/40 hover:bg-muted/70 transition border border-border/50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Building2 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {workspaceName}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate">
                      {workspaceId ? `${workspaceId.slice(0, 10)}...` : "Active"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNewWorkspaceName(workspaceName);
                    setIsRenameWorkspaceOpen(true);
                  }}
                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer opacity-70 group-hover:opacity-100 transition"
                  title="Rename Workspace"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {/* 1. Home Dashboard & Widget Config */}
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
                    aria-label="Home Dashboard & Widget Configuration"
                  >
                    <Home className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Dashboard & Widget</TooltipContent>
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
                  <span>Overview & Widget</span>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-mono",
                    activeTab === "home" ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  Config
                </span>
              </button>
            )}

            {/* 2. Live Conversation Inbox */}
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
                    aria-label="Live Inbox"
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
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </TooltipTrigger>
                <TooltipContent side="right">PartyKit Edge Synced</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Operator Profile Dropdown (Bottom pinned) */}
          <div className="p-3 border-t border-border/60">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/60 transition cursor-pointer text-left focus:outline-none",
                    isCollapsed && "justify-center p-1"
                  )}
                >
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs shadow-xs overflow-hidden">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{userInitials}</span>
                    )}
                    <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border-2 border-background" />
                  </div>

                  {!isCollapsed && (
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-semibold text-foreground truncate">
                        {userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        {userEmail}
                      </span>
                    </div>
                  )}

                  {!isCollapsed && <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56" side="top">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs font-medium leading-none text-foreground">{userName}</p>
                    <p className="text-[11px] leading-none text-muted-foreground truncate">{userEmail}</p>
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
                  <HomeDashboardOverview
                    userName={userName}
                    workspaceName={workspaceName}
                    initialWorkspace={initialWorkspace}
                  />
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
