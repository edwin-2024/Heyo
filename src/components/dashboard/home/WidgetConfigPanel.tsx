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
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WidgetSettings } from "./types";

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

  const snippetCode = `<script\n  src="https://heyo.ai/widget.js"\n  data-workspace="${settings.workspaceId}"\n  async\n></script>`;

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(snippetCode);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
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

      {/* 3. Embed Code & Allowed Domains */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs">
        <CardHeader className="pb-4">
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
        <CardContent className="space-y-4 pt-0">
          {/* Embed Script Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">HTML Embed Snippet</Label>
              <span className="text-[10px] text-muted-foreground font-mono">&lt; 6KB iframe loader</span>
            </div>
            <div className="relative group">
              <pre className="p-3.5 rounded-xl bg-muted/70 border border-border text-[11px] font-mono text-foreground overflow-x-auto select-all leading-relaxed">
                {snippetCode}
              </pre>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopySnippet}
                className="absolute top-2 right-2 h-7 px-2.5 text-xs bg-background/90 hover:bg-background border-border shadow-xs cursor-pointer"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    <span>Copy Code</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Allowed Domains Input */}
          <div className="space-y-1.5">
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
