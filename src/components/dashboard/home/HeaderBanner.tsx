"use client";

import React from "react";
import { Sparkles, Radio, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HeaderBannerProps {
  userName?: string | null;
  workspaceName?: string;
}

export function HeaderBanner({
  userName = "Operator",
  workspaceName = "Primary Org (v1)",
}: HeaderBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card/95 to-accent/20 p-6 md:p-7 shadow-xs">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground font-mono">
              Workspace Overview
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span className="text-xs text-muted-foreground font-mono">{workspaceName}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">
            Welcome back, {userName || "Alex"} 👋
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Your autonomous AI agent is actively answering customer queries grounded in your docs.
            Configure widget branding, test live simulations, and monitor edge guardrails below.
          </p>
        </div>

        {/* Live operational badges */}
        <div className="flex flex-wrap md:flex-col lg:flex-row items-start md:items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium shadow-2xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Heyo Guardrails Active</span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 text-xs text-blue-700 dark:text-blue-400 font-medium shadow-2xs">
            <Radio className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span>PartyKit Edge Synced</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono bg-background/50 border-blue-500/30">
              room_live
            </Badge>
          </div>
        </div>
      </div>

      {/* Decorative ambient background blur */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl"
        aria-hidden="true"
      />
    </div>
  );
}
