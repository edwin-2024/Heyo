"use client";

import React, { useEffect, useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ExternalLink,
  RotateCcw,
  Sparkles,
  Bot,
  MessageSquare,
  Shield,
  Zap,
  Server,
  Database,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  HelpCircle,
  Radio,
  Layers,
  Globe,
  Code2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { orpc } from "@/lib/orpc";

function DemoContent() {
  const searchParams = useSearchParams();
  const paramWorkspaceId = searchParams.get("workspaceId");
  const autoInstall = searchParams.get("installed") === "1" || Boolean(paramWorkspaceId);

  const [workspaceId, setWorkspaceId] = useState<string>(paramWorkspaceId || "");
  const [position, setPosition] = useState<"right" | "left">("right");
  const [visitorToken, setVisitorToken] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const [showSnippetEditor, setShowSnippetEditor] = useState(false);
  const [snippetInput, setSnippetInput] = useState("");

  const hostOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

  // 1. Resolve workspace ID from param or default workspace
  useEffect(() => {
    if (paramWorkspaceId) {
      setWorkspaceId(paramWorkspaceId);
      setIsInstalled(true);
      return;
    }

    orpc.workspace
      .getWorkspace()
      .then((ws) => {
        if (ws?.id) {
          setWorkspaceId(ws.id);
        }
      })
      .catch((err) => {
        console.error("Failed to load workspace for demo page:", err);
      });
  }, [paramWorkspaceId]);

  // 2. Read or initialize visitor token
  useEffect(() => {
    try {
      const stored = localStorage.getItem("heyo_visitor_token");
      if (stored) {
        setVisitorToken(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  // 3. Inject /widget.js ONLY when isInstalled is true and workspaceId is available
  useEffect(() => {
    // Remove any previous widget script or container
    const existingScript = document.getElementById("heyo-demo-widget-script");
    if (existingScript) existingScript.remove();

    const existingContainer = document.getElementById("heyo-widget-container");
    if (existingContainer) existingContainer.remove();

    if (!isInstalled || !workspaceId) {
      setIsWidgetLoaded(false);
      return;
    }

    const script = document.createElement("script");
    script.id = "heyo-demo-widget-script";
    script.src = "/widget.js";
    script.setAttribute("data-workspace", workspaceId);
    script.setAttribute("data-position", position);
    script.setAttribute("data-host", window.location.origin);
    script.async = true;

    script.onload = () => {
      setIsWidgetLoaded(true);
      try {
        const token = localStorage.getItem("heyo_visitor_token");
        if (token) setVisitorToken(token);
      } catch {
        // ignore
      }
    };

    document.body.appendChild(script);

    return () => {
      const el = document.getElementById("heyo-demo-widget-script");
      if (el) el.remove();
      const container = document.getElementById("heyo-widget-container");
      if (container) container.remove();
    };
  }, [isInstalled, workspaceId, position]);

  const handleResetVisitor = () => {
    try {
      localStorage.removeItem("heyo_visitor_token");
    } catch {
      // ignore
    }
    window.location.reload();
  };

  const handleCopyWorkspaceId = () => {
    if (!workspaceId) return;
    navigator.clipboard.writeText(workspaceId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyHostOrigin = () => {
    navigator.clipboard.writeText(hostOrigin);
    setCopiedOrigin(true);
    setTimeout(() => setCopiedOrigin(false), 2000);
  };

  // Sync default snippet input text when workspaceId or position updates
  useEffect(() => {
    setSnippetInput(
      `<script\n  src="${hostOrigin}/widget.js"\n  data-workspace="${workspaceId || "YOUR_WORKSPACE_ID"}"\n  data-position="${position}"\n  async\n></script>`
    );
  }, [workspaceId, position, hostOrigin]);

  const handleApplyManualSnippet = () => {
    if (!snippetInput.trim()) return;

    // Parse data-workspace attribute from snippet text
    const wsMatch = snippetInput.match(/data-workspace=["']([^"']+)["']/);
    const posMatch = snippetInput.match(/data-position=["']([^"']+)["']/);

    if (wsMatch && wsMatch[1]) {
      setWorkspaceId(wsMatch[1].trim());
    }
    if (posMatch && posMatch[1]) {
      const p = posMatch[1].trim() === "left" ? "left" : "right";
      setPosition(p);
    }
    setIsInstalled(true);
    setShowSnippetEditor(false);
  };

  const handleUninstall = () => {
    setIsInstalled(false);
    const existingScript = document.getElementById("heyo-demo-widget-script");
    if (existingScript) existingScript.remove();
    const existingContainer = document.getElementById("heyo-widget-container");
    if (existingContainer) existingContainer.remove();
  };

  const handleQuickInstall = () => {
    setIsInstalled(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500/30 selection:text-white">
      {/* 1. TOP TESTING SANDBOX CONTROL BAR */}
      <aside aria-label="Testing Sandbox Toolbar" className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-xs px-4 py-2.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Test Ground Badge + Install Status */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold tracking-tight text-white bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              🧪 Heyo Live Test Sandbox
            </span>

            {/* Install Status Indicator */}
            {isInstalled ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Widget Installed & Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium text-[11px]">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Widget Not Installed
              </span>
            )}

            {isInstalled && (
              <div className="hidden sm:flex items-center gap-2 text-slate-300">
                <span className="text-slate-500">Workspace:</span>
                <button
                  type="button"
                  onClick={handleCopyWorkspaceId}
                  className="font-mono bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-[11px] text-slate-200 flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                  title="Click to copy Workspace ID"
                >
                  <span>{workspaceId || "Loading..."}</span>
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3 text-slate-400" />
                  )}
                </button>
              </div>
            )}

            {isInstalled && visitorToken && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400">
                Visitor: <code className="text-sky-300 font-mono">{visitorToken.slice(-8)}</code>
              </span>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isInstalled ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setShowSnippetEditor(true)}
                  className="h-7 text-xs bg-sky-500 hover:bg-sky-400 text-white font-semibold gap-1.5 cursor-pointer shadow-sm"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Install via Snippet</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQuickInstall}
                  className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  title="Quick-connect current workspace without manual paste"
                >
                  <span>1-Click Quick Connect</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={showSnippetEditor ? "default" : "outline"}
                  onClick={() => setShowSnippetEditor((s) => !s)}
                  className={`h-7 text-xs gap-1.5 cursor-pointer ${
                    showSnippetEditor
                      ? "bg-sky-500 text-white"
                      : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
                  }`}
                  title="Manually paste or edit the connection snippet"
                >
                  <Code2 className="h-3 w-3" />
                  <span>Edit Snippet</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPosition((p) => (p === "right" ? "left" : "right"))}
                  className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  title="Toggle widget corner position"
                >
                  Align: {position === "right" ? "Right ↘" : "Left ↙"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetVisitor}
                  className="h-7 text-xs bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 gap-1.5 cursor-pointer"
                  title="Clear visitor token and start a completely new visitor chat"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>New Visitor</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleUninstall}
                  className="h-7 text-xs bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                  title="Uninstall and remove chatbot from this website"
                >
                  <X className="h-3 w-3" />
                  <span>Uninstall</span>
                </Button>

                <Button
                  size="sm"
                  asChild
                  className="h-7 text-xs bg-sky-500 hover:bg-sky-400 text-white font-medium gap-1.5 cursor-pointer shadow-sm"
                >
                  <Link href="/dashboard/inbox" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    <span>Open Inbox</span>
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 1B. MANUAL SNIPPET INJECTOR & ALLOWED DOMAINS DRAWER */}
      {showSnippetEditor && (
        <div className="bg-slate-900 border-b border-slate-800 p-4 animate-in slide-in-from-top-2 text-xs">
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-sky-400" />
                <h3 className="font-semibold text-sm text-white">Manual Connection & Domain Setup</h3>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  — Paste your HTML embed script below to connect your Heyo chatbot to this website:
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowSnippetEditor(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Allowed Domains Security Notice */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-semibold text-white text-xs">ADR-0006 Allowed Domains Requirement:</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  This website runs at host origin:{" "}
                  <code className="text-sky-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {hostOrigin}
                  </code>
                  . Ensure this origin is added under{" "}
                  <strong className="text-white">Dashboard → Embed Code & Domains → Allowed Domains</strong>!
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyHostOrigin}
                  className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 cursor-pointer gap-1"
                >
                  {copiedOrigin ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">Copied Origin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-400" />
                      <span>Copy Origin</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-7 text-xs bg-slate-900 border-slate-700 text-sky-400 hover:text-sky-300 hover:bg-slate-800 cursor-pointer gap-1"
                >
                  <Link href="/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    <span>Open Dashboard</span>
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
              <div className="lg:col-span-8 space-y-1.5">
                <div className="text-[11px] text-slate-400 font-medium">
                  Paste Embed Snippet from Heyo Dashboard:
                </div>
                <textarea
                  value={snippetInput}
                  onChange={(e) => setSnippetInput(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-3 font-mono text-xs text-slate-200 focus:outline-hidden focus:border-sky-500 leading-relaxed"
                  placeholder="<script src='http://localhost:3000/widget.js' data-workspace='...' data-position='right' async></script>"
                />
              </div>

              <div className="lg:col-span-4 flex flex-col gap-2.5">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-[11px] text-slate-400">
                    Target Workspace:{" "}
                    <code className="text-sky-300 font-mono font-bold">
                      {workspaceId || "Not selected"}
                    </code>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Position: <code className="text-indigo-300 font-mono">{position}</code>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">
                    ✓ Real-time hot-reloading via PartyKit edge rooms
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleApplyManualSnippet}
                    className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-sm flex-1"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Apply Snippet & Install on Site</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSnippetEditor(false)}
                    className="bg-slate-800 border-slate-700 text-slate-200 text-xs hover:bg-slate-700 cursor-pointer"
                  >
                    <span>Cancel</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DEMO HOST WEBSITE NAVIGATION */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 font-bold text-base tracking-tight text-white">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                <Zap className="h-4 w-4" />
              </div>
              <span>NovaCloud</span>
              <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-800 ml-1">
                Demo Host Site
              </Badge>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300">
              <a href="#platform" className="hover:text-white transition">Platform</a>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#pricing" className="hover:text-white transition">Pricing</a>
              <a href="#faq" className="hover:text-white transition">FAQ</a>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs text-slate-400 hover:text-white transition hidden sm:inline"
            >
              Back to Heyo Dashboard
            </Link>
            <Button size="sm" variant="outline" className="text-xs border-slate-700 bg-slate-900 text-slate-200">
              Sign In
            </Button>
            <Button size="sm" className="text-xs bg-white text-slate-900 hover:bg-slate-200 font-semibold">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-sky-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-sky-400" />
            <span>Simulated Customer Website embedding Heyo Live Support</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Next-Generation Edge Cloud{" "}
            <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">
              Engineered for Speed
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Instant serverless compute, branchable Postgres databases, and real-time WebSocket state across 300+ edge locations worldwide.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" className="bg-sky-500 hover:bg-sky-400 text-white font-semibold gap-2 shadow-lg shadow-sky-500/20">
              <span>Deploy Cluster</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200">
              Documentation
            </Button>
          </div>

          {/* Test Instructions / Installation State Banner */}
          {!isInstalled ? (
            <div className="mt-12 p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-left max-w-3xl mx-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wide uppercase">
                  <Shield className="h-4 w-4" />
                  <span>Manual Installation & Domain Testing Flow</span>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                  Uninstalled State
                </Badge>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                As requested, this website starts with <strong>no chatbot installed</strong> so you can test the end-to-end embedding and domain security workflow manually:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="font-bold text-amber-400 block mb-1">Step 1: Allowed Domains</span>
                  In Dashboard, verify that <code className="text-sky-300 font-mono text-[10px]">{hostOrigin}</code> is listed in <strong>Allowed Domains</strong>.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="font-bold text-sky-400 block mb-1">Step 2: Copy Snippet</span>
                  In Dashboard, click <strong>Copy Snippet</strong> under Embed Code & Domains.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="font-bold text-emerald-400 block mb-1">Step 3: Paste & Install</span>
                  Click below to open the snippet modal, paste the script tag, and install it live on this site.
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <Button
                  size="sm"
                  onClick={() => setShowSnippetEditor(true)}
                  className="bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-md"
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Open Snippet Installer</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleQuickInstall}
                  className="bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200 text-xs cursor-pointer"
                >
                  <span>1-Click Quick Connect</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  asChild
                  className="text-xs text-sky-400 hover:text-sky-300 cursor-pointer"
                >
                  <Link href="/dashboard" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    <span>Go to Heyo Dashboard</span>
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-12 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left max-w-3xl mx-auto shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sky-400 font-semibold text-xs tracking-wide uppercase">
                  <MessageSquare className="h-4 w-4" />
                  <span>How to test Heyo live support right now</span>
                </div>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px]">
                  Connected
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-sky-400 block mb-1">1. Open Chat Widget</span>
                  Click the floating chat bubble in the {position === "right" ? "bottom-right" : "bottom-left"} corner of this page.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-sky-400 block mb-1">2. Send Visitor Message</span>
                  Type a test question (e.g. &quot;What are your pricing plans?&quot;). Message persists to Neon Postgres.
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="font-bold text-sky-400 block mb-1">3. Check Operator Inbox</span>
                  Open Operator Inbox in another tab to see real-time alert and reply live via PartyKit WebSockets!
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4. PLATFORM ARCHITECTURE & STATS */}
      <section id="platform" className="py-16 border-t border-slate-900 bg-slate-950/60">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-3xl font-extrabold text-white">&lt;10ms</div>
              <div className="text-xs text-slate-400 mt-1">P99 Edge Latency</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-3xl font-extrabold text-white">99.999%</div>
              <div className="text-xs text-slate-400 mt-1">Guaranteed SLA</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-3xl font-extrabold text-white">384d</div>
              <div className="text-xs text-slate-400 mt-1">Vector AI Search</div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/60">
              <div className="text-3xl font-extrabold text-white">Zero</div>
              <div className="text-xs text-slate-400 mt-1">CSS Leakage (Iframe)</div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. FEATURES GRID */}
      <section id="features" className="py-20 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Enterprise Cloud Capabilities
            </h2>
            <p className="text-sm text-slate-400">
              Everything required to run modern real-time applications with autonomous AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Serverless Edge Workers</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Deploy Node.js and TypeScript microservices distributed across worldwide edge locations with sub-millisecond cold starts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Branchable Lakebase Postgres</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instant database copy-on-write branching for preview environments, schema migrations, and zero-downtime testing.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Radio className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-white text-base">PartyKit Edge WebSockets</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hibernating edge WebSocket rooms maintaining state across multi-tab visitor browser sessions with instant synchronization.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="pricing" className="py-20 border-t border-slate-900 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Simple, Transparent Pricing
            </h2>
            <p className="text-sm text-slate-400">
              Pick the tier that fits your growth. Test asking the chat widget about plan details!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* Starter */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Starter</h3>
                  <p className="text-xs text-slate-400 mt-1">For side projects and prototypes</p>
                </div>
                <div className="text-3xl font-extrabold text-white">$0 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> 100K Edge Requests</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Single-branch Postgres</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> Community support</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full text-xs border-slate-700 bg-slate-800 text-slate-200">
                Start Free
              </Button>
            </div>

            {/* Pro (Highlighted) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-sky-950/40 to-slate-900/80 border border-sky-500/50 flex flex-col justify-between space-y-6 shadow-xl relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-[10px] uppercase font-bold py-0.5 px-3">
                Most Popular
              </Badge>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Pro</h3>
                  <p className="text-xs text-slate-400 mt-1">For fast-growing startups & SaaS</p>
                </div>
                <div className="text-3xl font-extrabold text-white">$49 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" /> 5M Edge Requests</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" /> Unlimited Database Branches</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" /> AI Support Agent with Guardrails</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0" /> Human Operator Handoff</li>
                </ul>
              </div>
              <Button className="w-full text-xs bg-sky-500 hover:bg-sky-400 text-white font-semibold">
                Upgrade to Pro
              </Button>
            </div>

            {/* Enterprise */}
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white">Enterprise</h3>
                  <p className="text-xs text-slate-400 mt-1">For high-throughput mission-critical teams</p>
                </div>
                <div className="text-3xl font-extrabold text-white">$299 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" /> Dedicated Edge Compute Clusters</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" /> 99.999% SLA Uptime Guarantee</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" /> 24/7 Priority Human Operator Escalation</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full text-xs border-slate-700 bg-slate-800 text-slate-200">
                Contact Enterprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 border-t border-slate-900">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-400">
              Sample questions visitors might ask your support bot.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-sky-400" />
                How do I reset or change my account password?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Go to the login screen and click &quot;Forgot password&quot;. Enter your registered email address and follow the instructions in the reset email.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-sky-400" />
                Can I speak to a human operator if the AI agent cannot help me?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                Yes! Heyo features dual-guardrail handoff. If the AI confidence falls below 0.65 or if you ask to speak with a person, the conversation automatically escalates to a live human operator in the inbox.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
              <h4 className="font-semibold text-sm text-white flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-sky-400" />
                What is your cancellation and refund policy?
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed pl-6">
                You can cancel your subscription at any time from your billing settings. We offer a full 14-day money-back guarantee for all Pro and Enterprise tiers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-slate-900 py-10 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">NovaCloud</span>
            <span>&copy; 2026 NovaCloud Inc. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/dashboard" className="hover:text-white transition">
              Heyo Dashboard
            </Link>
            <Link href="/dashboard/inbox" className="hover:text-white transition">
              Operator Inbox
            </Link>
            <span>Powered by Heyo AI Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading Demo Sandbox...
        </div>
      }
    >
      <DemoContent />
    </Suspense>
  );
}
