"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Palette,
  Shield,
  Sliders,
  Code2,
  Globe,
  HelpCircle,
  Sparkles,
  Info,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WidgetSettings } from "./types";
import { cn } from "@/lib/utils";
import { orpc } from "@/lib/orpc";

interface WidgetConfigPanelProps {
  settings: WidgetSettings;
  onChange: (next: WidgetSettings) => void;
}

const PRESET_COLORS = [
  { name: "Sky", value: "#0284c7" },
  { name: "Indigo", value: "#4f46e5" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Emerald", value: "#059669" },
  { name: "Rose", value: "#e11d48" },
  { name: "Amber", value: "#d97706" },
  { name: "Slate", value: "#0f172a" },
];

export function WidgetConfigPanel({ settings, onChange }: WidgetConfigPanelProps) {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const snippetCode = `<script\n  src="${origin}/widget.js"\n  data-workspace="${settings.workspaceId}"\n  data-position="${settings.position}"\n  async\n></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarUploadError(null);

    // Validate size (max 2MB per PRD)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAvatarUploadError("File size exceeds 2MB limit. Please choose a smaller image.");
      return;
    }

    // Validate mime type
    const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarUploadError("Invalid file type. Only PNG, JPEG, WEBP, and GIF are supported.");
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // 1. Request presigned PUT URL from Neon Auth authorized procedure
      const presign = await orpc.workspace.presignAvatarUpload({
        workspaceId: settings.workspaceId,
        contentType: file.type,
        fileSize: file.size,
      });

      // 2. Direct client upload to Neon Object Storage
      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Neon Storage upload failed with status ${uploadRes.status}`);
      }

      // 3. Update widget settings with direct public S3 URL
      onChange({
        ...settings,
        botAvatarType: "custom",
        customAvatarUrl: presign.publicUrl,
      });
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setAvatarUploadError(err.message || "Failed to upload avatar to Neon Object Storage.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Brand Customization */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Brand Customization</CardTitle>
              <CardDescription className="text-xs">
                Control the visual identity and styling of your embedded chat widget.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brandTitle" className="text-xs font-medium text-foreground">
                Widget Brand Title
              </Label>
              <Input
                id="brandTitle"
                value={settings.brandTitle}
                onChange={(e) => onChange({ ...settings, brandTitle: e.target.value })}
                placeholder="e.g. Heyo Support"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="botDisplayName" className="text-xs font-medium text-foreground">
                Bot Display Name
              </Label>
              <Input
                id="botDisplayName"
                value={settings.botDisplayName}
                onChange={(e) => onChange({ ...settings, botDisplayName: e.target.value })}
                placeholder="e.g. Heyo AI Agent"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Bot Avatar Selector & Custom Upload */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">Chatbot Avatar Style</Label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-muted-foreground capitalize">
                  {settings.botAvatarType === "glass"
                    ? "3D Liquid Glass"
                    : settings.botAvatarType === "bot"
                    ? "Classic Bot"
                    : settings.botAvatarType === "sparkle"
                    ? "AI Sparkle"
                    : "Custom Avatar"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => onChange({ ...settings, botAvatarType: "glass" })}
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                  settings.botAvatarType === "glass"
                    ? "border-primary bg-primary/10 shadow-xs font-semibold text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <div
                  className="h-8 w-8 rounded-full shrink-0 shadow-sm relative overflow-hidden"
                  style={{
                    background:
                      "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)",
                  }}
                >
                  <div className="absolute top-0.5 left-1 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/70 to-transparent" />
                </div>
                <span className="text-[11px]">3D Liquid Glass</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...settings, botAvatarType: "bot" })}
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                  settings.botAvatarType === "bot"
                    ? "border-primary bg-primary/10 shadow-xs font-semibold text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                  <span className="text-sm">🤖</span>
                </div>
                <span className="text-[11px]">Classic Bot</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...settings, botAvatarType: "sparkle" })}
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                  settings.botAvatarType === "sparkle"
                    ? "border-primary bg-primary/10 shadow-xs font-semibold text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                  <span className="text-sm">✨</span>
                </div>
                <span className="text-[11px]">AI Sparkle</span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ ...settings, botAvatarType: "custom" })}
                className={cn(
                  "p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1.5 transition-all cursor-pointer",
                  settings.botAvatarType === "custom"
                    ? "border-primary bg-primary/10 shadow-xs font-semibold text-foreground ring-1 ring-primary/30"
                    : "border-border bg-card/60 hover:bg-muted/50 text-muted-foreground"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center overflow-hidden">
                  {settings.customAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.customAvatarUrl}
                      alt="Custom avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs">🎨</span>
                  )}
                </div>
                <span className="text-[11px]">Custom Avatar</span>
              </button>
            </div>

            {/* Custom Avatar Configuration Panel (Visible when "custom" is active) */}
            {settings.botAvatarType === "custom" && (
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Custom Avatar Source
                  </span>
                  {settings.customAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => onChange({ ...settings, customAvatarUrl: "" })}
                      className="text-[10px] text-destructive hover:underline cursor-pointer"
                    >
                      Remove Avatar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border bg-background hover:bg-muted/60 text-xs text-foreground cursor-pointer transition disabled:opacity-50">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      disabled={isUploadingAvatar}
                      onChange={handleAvatarFileChange}
                    />
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Uploading to S3...</span>
                      </>
                    ) : (
                      <>
                        <span>📁 Upload Image File (Max 2MB)</span>
                      </>
                    )}
                  </label>

                  <div className="flex items-center gap-1.5">
                    <Input
                      type="url"
                      placeholder="Paste image URL..."
                      value={settings.customAvatarUrl || ""}
                      onChange={(e) =>
                        onChange({
                          ...settings,
                          botAvatarType: "custom",
                          customAvatarUrl: e.target.value,
                        })
                      }
                      className="h-8 text-xs bg-background"
                    />
                  </div>
                </div>

                {avatarUploadError && (
                  <p className="text-[11px] text-destructive font-medium animate-in fade-in">
                    {avatarUploadError}
                  </p>
                )}

                {/* Preset Avatars */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground shrink-0">Presets:</span>
                  {[
                    "https://api.dicebear.com/7.x/bottts/svg?seed=HeyoAI&backgroundColor=0284c7",
                    "https://api.dicebear.com/7.x/bottts/svg?seed=Spark&backgroundColor=7c3aed",
                    "https://api.dicebear.com/7.x/bottts/svg?seed=Nexus&backgroundColor=10b981",
                    "https://api.dicebear.com/7.x/adventurer/svg?seed=AgentNova&backgroundColor=f59e0b",
                  ].map((url, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...settings,
                          botAvatarType: "custom",
                          customAvatarUrl: url,
                        })
                      }
                      className={cn(
                        "h-7 w-7 rounded-full overflow-hidden border border-border hover:scale-105 transition cursor-pointer",
                        settings.customAvatarUrl === url && "ring-2 ring-primary border-primary"
                      )}
                      title={`Preset ${i + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Preset ${i + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Accent Color Palette */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">Primary Accent Color</Label>
              <span className="text-[11px] font-mono text-muted-foreground uppercase">
                {settings.primaryColor}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((color) => {
                const isSelected = settings.primaryColor.toLowerCase() === color.value.toLowerCase();
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => onChange({ ...settings, primaryColor: color.value })}
                    title={color.name}
                    className={`h-7 w-7 rounded-full transition-all flex items-center justify-center cursor-pointer border ${
                      isSelected
                        ? "ring-2 ring-ring ring-offset-2 scale-110 border-white dark:border-black"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}

              {/* Custom Color Input */}
              <div className="relative flex items-center ml-1">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => onChange({ ...settings, primaryColor: e.target.value })}
                  className="h-7 w-7 rounded-full border border-border cursor-pointer p-0 overflow-hidden bg-transparent"
                  title="Pick custom hex color"
                />
              </div>
            </div>
          </div>

          {/* Theme Mode Selector */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-medium text-foreground">Widget Theme Mode</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["system", "light", "dark"] as const).map((mode) => {
                const isSelected = settings.themeMode === mode;
                return (
                  <Button
                    key={mode}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onChange({ ...settings, themeMode: mode })}
                    className="capitalize"
                  >
                    {mode}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Launcher Screen Position Selector */}
          <div className="space-y-2 pt-1">
            <Label className="text-xs font-medium text-foreground">Widget Screen Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={settings.position !== "left" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...settings, position: "right" })}
                className="gap-1.5"
              >
                <span>Bottom Right</span>
                <span className="text-[10px] opacity-70 font-mono">(Default)</span>
              </Button>
              <Button
                type="button"
                variant={settings.position === "left" ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ ...settings, position: "left" })}
                className="gap-1.5"
              >
                <span>Bottom Left</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Behavior & Guardrails */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Behavior & Guardrails</CardTitle>
              <CardDescription className="text-xs">
                Configure greeting messages, handoff thresholds, and human fallback triggers.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1.5">
            <Label htmlFor="welcomeMessage" className="text-xs font-medium text-foreground">
              Welcome Greeting Message
            </Label>
            <Input
              id="welcomeMessage"
              value={settings.welcomeMessage}
              onChange={(e) => onChange({ ...settings, welcomeMessage: e.target.value })}
              placeholder="Hey there! How can we help?"
              className="h-9 text-xs"
            />
          </div>

          {/* Handoff Similarity Threshold Slider */}
          <div className="space-y-2 p-3.5 rounded-xl bg-muted/40 border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                <Label htmlFor="threshold" className="text-xs font-semibold text-foreground">
                  Auto-Handoff Similarity Threshold
                </Label>
              </div>
              <span className="text-xs font-mono font-bold text-primary">
                {settings.handoffThreshold.toFixed(2)}
              </span>
            </div>
            <input
              id="threshold"
              type="range"
              min="0.50"
              max="0.90"
              step="0.01"
              value={settings.handoffThreshold}
              onChange={(e) =>
                onChange({ ...settings, handoffThreshold: parseFloat(e.target.value) })
              }
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0.50 (Permissive)</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                0.65 (PRD ADR-0003 Default)
              </span>
              <span>0.90 (Strict)</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
              If chunk cosine similarity drops below{" "}
              <strong className="text-foreground">{settings.handoffThreshold.toFixed(2)}</strong>, the AI
              will bypass LLM generation and hand off to <code className="text-primary font-mono text-[10px]">WAITING_HUMAN</code>.
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  Allow visitor to request human
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Displays permanent &ldquo;Talk to a human&rdquo; button inside the widget chat footer.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.allowHumanEscalation}
                onClick={() =>
                  onChange({ ...settings, allowHumanEscalation: !settings.allowHumanEscalation })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.allowHumanEscalation ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.allowHumanEscalation ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/80">
              <div className="space-y-0.5 pr-2">
                <span className="text-xs font-semibold text-foreground block">
                  Offline email capture
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Prompts visitor for an email address if no human operators are online during handoff.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.offlineEmailCapture}
                onClick={() =>
                  onChange({ ...settings, offlineEmailCapture: !settings.offlineEmailCapture })
                }
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.offlineEmailCapture ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    settings.offlineEmailCapture ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Knowledge Base & Grounding Document Ingestion (PRD Flow A) */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Knowledge Base Ingestion</CardTitle>
                <CardDescription className="text-xs">
                  Upload support docs, guides, and policies to ground your AI agent (Flow A).
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono py-0.5 px-2 bg-background border-border">
              vector(384)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Drag & Drop Zone */}
          <div className="relative group border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-muted/20 hover:bg-muted/30 cursor-pointer">
            <input
              type="file"
              multiple
              accept=".pdf,.md,.txt"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={(e) => {
                if (e.target.files?.length) {
                  // Handled interactively or simulated
                }
              }}
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground group-hover:scale-105 group-hover:text-primary transition-all shadow-xs">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Click or drag documents to upload
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Supports <span className="font-mono text-foreground">.pdf</span>, <span className="font-mono text-foreground">.md</span>, <span className="font-mono text-foreground">.txt</span> up to 10MB each
                </p>
              </div>
              <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Auto-chunked (500 tokens) · Neon Object Storage presigned sync</span>
              </div>
            </div>
          </div>

          {/* Sample Active Indexed Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-foreground">
              <span>Indexed Documents (3 active)</span>
              <span className="text-[11px] text-muted-foreground font-mono">1,420 vectors</span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    MD
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate text-xs">api-reference.md</p>
                    <p className="text-[10px] text-muted-foreground font-mono">48 chunks · 42KB · 384d embedded</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Grounded
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    PDF
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate text-xs">billing-and-refunds.pdf</p>
                    <p className="text-[10px] text-muted-foreground font-mono">22 chunks · 185KB · 384d embedded</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Grounded
                </Badge>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-mono text-[10px] font-bold">
                    TXT
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-foreground truncate text-xs">security-faqs.txt</p>
                    <p className="text-[10px] text-muted-foreground font-mono">14 chunks · 12KB · 384d embedded</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                  Grounded
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Embed Code & Allowed Domains */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Code2 className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Embed Code & Domains</CardTitle>
              <CardDescription className="text-xs">
                Install the isolated iframe widget script on your website (ADR-0006 & ADR-0008).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Formatted Script Snippet with code window header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">HTML Embed Snippet</Label>
              <span className="text-[10px] text-muted-foreground font-mono">&lt; 6KB iframe script</span>
            </div>

            {/* Window Container */}
            <div className="rounded-xl border border-neutral-700/60 dark:border-neutral-800 bg-neutral-950 text-neutral-100 overflow-hidden shadow-md">
              {/* Top window bar */}
              <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-800/80 bg-neutral-900/70 text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                  </div>
                  <span className="font-mono text-[11px] text-neutral-400 ml-2">index.html</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    asChild
                    className="h-6 px-2 text-[11px] font-medium text-sky-400 hover:text-sky-300 hover:bg-neutral-800/80 cursor-pointer gap-1"
                  >
                    <a
                      href={`/demo?workspaceId=${settings.workspaceId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Test on Demo Site</span>
                    </a>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopySnippet}
                    className="h-6 px-2 text-[11px] font-medium text-neutral-300 hover:text-white hover:bg-neutral-800/80 cursor-pointer"
                  >
                    {copiedSnippet ? (
                      <>
                        <Check className="h-3 w-3 mr-1 text-emerald-400" />
                        <span className="text-emerald-400 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1 text-neutral-400" />
                        <span>Copy snippet</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Syntax Highlighted Code Block */}
              <div className="p-4 overflow-x-auto text-[12px] font-mono leading-relaxed select-all">
                <div className="text-neutral-500 italic pb-1">
                  &lt;!-- Place this snippet before closing &lt;/body&gt; tag --&gt;
                </div>
                <div>
                  <span className="text-rose-400">&lt;script</span>
                </div>
                <div className="pl-4">
                  <span className="text-amber-300">src</span>
                  <span className="text-neutral-400">=</span>
                  <span className="text-emerald-300">&quot;{origin}/widget.js&quot;</span>
                </div>
                <div className="pl-4">
                  <span className="text-amber-300">data-workspace</span>
                  <span className="text-neutral-400">=</span>
                  <span className="text-emerald-300">&quot;{settings.workspaceId}&quot;</span>
                </div>
                <div className="pl-4">
                  <span className="text-amber-300">data-position</span>
                  <span className="text-neutral-400">=</span>
                  <span className="text-emerald-300">&quot;{settings.position}&quot;</span>
                </div>
                <div className="pl-4">
                  <span className="text-sky-300">async</span>
                </div>
                <div>
                  <span className="text-rose-400">&gt;&lt;/script&gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Allowed Domains Input */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="allowedDomains" className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                Allowed Domains (CORS & CSP)
              </Label>
              <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono">
                ADR-0006 Security
              </Badge>
            </div>
            <Input
              id="allowedDomains"
              value={settings.allowedDomains}
              onChange={(e) => onChange({ ...settings, allowedDomains: e.target.value })}
              placeholder="https://example.com, localhost:3000"
              className="h-9 text-xs font-mono"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Comma-separated origins permitted to embed and run this workspace&apos;s widget.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
