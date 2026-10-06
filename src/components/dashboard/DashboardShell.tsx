"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth/client";
import {
  Inbox,
  BookOpen,
  Settings,
  Bot,
  Users,
  LogOut,
  Bell,
  Code2,
  ChevronDown,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Radio,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NavTab = "inbox" | "knowledge" | "widget" | "guardrails" | "settings";

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
  initialTab = "inbox",
  initialSession = null,
}: DashboardShellProps) {
  const router = useRouter();
  const { data: clientSession, isPending } = useSession();
  const session = clientSession || initialSession;
  const [activeTab, setActiveTab] = useState<NavTab>(initialTab);
  const [filter, setFilter] = useState<"all" | "ai" | "waiting" | "resolved">("all");
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
      {/* Background grain */}
      <div className="grain dark:opacity-[0.035] opacity-[0.015]" aria-hidden="true" />

      {/* 1. Left Sidebar Navigation */}
      <aside className="w-64 flex flex-col shrink-0 border-r border-border bg-card/80 backdrop-blur-xl z-20 transition-colors">
        {/* Workspace Brand / Selector */}
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

        {/* Workspace pill / Single-member status */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/60 border border-border text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <div className="truncate">
                <span className="block text-[11px] text-muted-foreground font-medium leading-none">
                  Workspace
                </span>
                <span className="font-semibold text-foreground truncate block text-xs mt-0.5">
                  Primary Org (v1)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono uppercase bg-background border border-border text-muted-foreground px-1.5 py-0.5 rounded font-medium">
              Solo
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "inbox"
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox className="h-4 w-4" />
              <span>Live Inbox</span>
            </div>
            <span className="flex h-5 items-center justify-center rounded-full bg-emerald-500/15 px-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              0 Active
            </span>
          </button>

          <button
            onClick={() => setActiveTab("knowledge")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "knowledge"
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Knowledge Base</span>
          </button>

          <button
            onClick={() => setActiveTab("guardrails")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "guardrails"
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4" />
              <span>AI Guardrails</span>
            </div>
            <span className="text-[9px] font-mono uppercase bg-muted border border-border text-muted-foreground px-1.5 py-0.5 rounded font-medium">
              Step 3
            </span>
          </button>

          <button
            onClick={() => setActiveTab("widget")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "widget"
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Widget Embed</span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-accent text-accent-foreground font-semibold shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Real-time Connection Indicator */}
        <div className="p-3 mx-3 mb-2 rounded-xl bg-muted/40 border border-border text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Radio className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              PartyKit Edge
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Synced</span>
          </div>
          <div className="text-[10px] text-muted-foreground font-mono">
            Room: room_default_live
          </div>
        </div>

        {/* Operator User Dropdown & Sign Out */}
        <div className="p-3 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/50 border border-border hover:bg-muted hover:border-border/80 transition cursor-pointer text-left focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
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
                onClick={() => setActiveTab("settings")}
                className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Account Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("widget")}
                className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg"
              >
                <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Widget Setup</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="cursor-pointer flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
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
              {activeTab === "inbox" && "Live Conversation Inbox"}
              {activeTab === "knowledge" && "Document Knowledge Base & Vector Store"}
              {activeTab === "guardrails" && "Step 3 Intent Classifier & Handoff Policy"}
              {activeTab === "widget" && "Website Embed Script & CORS Domains"}
              {activeTab === "settings" && "Workspace Settings"}
            </h1>
            <span className="rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground">
              v1.0-alpha
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
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activeTab === "inbox" && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border text-xs">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      filter === "all"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    All Chats (0)
                  </button>
                  <button
                    onClick={() => setFilter("ai")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      filter === "ai"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    AI Handled (0)
                  </button>
                  <button
                    onClick={() => setFilter("waiting")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      filter === "waiting"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Waiting Human (0)
                  </button>
                  <button
                    onClick={() => setFilter("resolved")}
                    className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                      filter === "resolved"
                        ? "bg-background text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Resolved (0)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {/* Empty State Banner */}
              <div className="rounded-2xl border border-border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted border border-border text-muted-foreground shadow-inner">
                  <Inbox className="h-6 w-6" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-semibold text-base text-foreground">
                    No active conversations
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Once visitors interact with your embedded widget, incoming conversations and AI answering streams will appear here in real time.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab("widget")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-xs hover:bg-primary/90 transition cursor-pointer shadow-sm"
                  >
                    <Code2 className="h-4 w-4" />
                    Get Widget Embed Code
                  </button>
                </div>
              </div>

              {/* Fast Status Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
                  <span className="text-xs text-muted-foreground">Autonomous Resolution Rate</span>
                  <p className="text-2xl font-bold text-foreground font-mono">100%</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Zero unhandled fallbacks
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
                  <span className="text-xs text-muted-foreground">Average AI First Response</span>
                  <p className="text-2xl font-bold text-foreground font-mono">&lt; 400ms</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Powered by Groq LPU Llama 3.3 70B
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 space-y-1 shadow-sm">
                  <span className="text-xs text-muted-foreground">Active Operators</span>
                  <p className="text-2xl font-bold text-foreground font-mono">1</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Single-member workspace mode (ADR-0001)
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Knowledge Base & RAG Ingestion</h2>
                <p className="text-xs text-muted-foreground">
                  Upload PDF, Markdown, or text documentation. Content is split into 500-token chunks and embedded into Neon Postgres with 384-dimensional vectors.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div className="rounded-2xl border-2 border-dashed border-border hover:border-border/80 bg-card p-10 text-center flex flex-col items-center justify-center space-y-3 transition shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Drop document files here, or browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports .pdf, .md, .txt up to 10MB (Stored in Cloudflare R2 / Neon Object Storage)
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-background border border-input text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition cursor-pointer shadow-sm"
                >
                  Select File
                </button>
              </div>

              {/* Indexed Documents Table */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Indexed Documents (0)
                  </h3>
                  <span className="text-[11px] text-muted-foreground">
                    Vector index: HNSW cosine (384d)
                  </span>
                </div>
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No documents indexed yet. Upload knowledge files to activate autonomous RAG answers.
                </div>
              </div>
            </div>
          )}

          {activeTab === "guardrails" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Step 3 Intent Classifier & Guardrails</h2>
                <p className="text-xs text-muted-foreground">
                  Every visitor query passes through a dedicated Groq LPU classifier before vector retrieval to prevent hallucinations, math puzzles, and prompt injections.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-sm font-bold text-foreground">Intent Classification Gate</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Evaluates 3 turns of conversational history via <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">llama-3.1-8b-instant</code> with zero-shot deterministic temperature.
                  </p>
                  <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono text-foreground space-y-1">
                    <div className="text-muted-foreground">// Rule 1: Off-Topic Filter</div>
                    <div>Status: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">ACTIVE</span></div>
                    <div>Action: Decline with polite branded fallback</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-foreground">Dual-Guardrail Handoff</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Conversations automatically transition to <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">WAITING_HUMAN</code> if top chunk similarity is &lt; 0.65 or if the synthesis model emits <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">[HANDOFF_REQUIRED]</code>.
                  </p>
                  <div className="p-3 rounded-xl bg-muted/60 border border-border text-xs font-mono text-foreground space-y-1">
                    <div className="text-muted-foreground">// Cosine Similarity Threshold</div>
                    <div>Threshold: <span className="text-cyan-600 dark:text-cyan-400 font-semibold">&gt;= 0.65</span></div>
                    <div>Handoff Chime: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Web Audio API</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "widget" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Website Embed & Script Snippet</h2>
                <p className="text-xs text-muted-foreground">
                  Embed the isolated Heyo chat widget on your web application. The loader script injects an iframe at <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded text-[11px]">/embed/[workspaceId]</code> to prevent CSS pollution.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">HTML Script Tag</span>
                  <span className="text-[11px] text-muted-foreground font-mono">&lt; 6KB bundle</span>
                </div>
                <div className="p-4 rounded-xl bg-muted/70 border border-border text-xs font-mono text-foreground overflow-x-auto select-all">
                  {`<script\n  src="http://localhost:3000/widget.js"\n  data-workspace-id="default"\n  async\n></script>`}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Paste this tag directly before the closing <code className="text-foreground font-mono bg-muted px-1 py-0.5 rounded">&lt;/body&gt;</code> tag of your website.
                </p>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-foreground">Workspace & Operator Settings</h2>
                <p className="text-xs text-muted-foreground">
                  Manage your business profile, Neon Auth credentials, and single-member workspace configuration.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-sm">
                <h3 className="text-sm font-semibold text-foreground">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium">Operator Name</label>
                    <input
                      type="text"
                      readOnly
                      value={userName}
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1 font-medium">Email</label>
                    <input
                      type="text"
                      readOnly
                      value={userEmail}
                      className="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-xs font-semibold text-foreground mb-2">Team Mode</h4>
                  <p className="text-xs text-muted-foreground">
                    Heyo is operating in Single-Member Workspace mode for v1 (ADR-0001). Team invites and operator seat management will be available in v2.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
