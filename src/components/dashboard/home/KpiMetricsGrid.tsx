"use client";

import React from "react";
import {
  Sparkles,
  Zap,
  ShieldAlert,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function KpiMetricsGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. AI Deflection Rate */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs transition-all hover:border-border/80 hover:shadow-md">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">AI Deflection Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              68.4%
            </span>
            <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3 mr-0.5" />
              +4.2%
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>Target: &ge; 55%</span>
            <Badge variant="outline" className="text-[10px] font-medium border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
              Above target
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. First Response Time (FRT) */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs transition-all hover:border-border/80 hover:shadow-md">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">First Response Time (FRT)</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              420ms
            </span>
            <span className="text-xs text-muted-foreground font-mono">Groq LPU</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span>vs. 1m 45s human avg</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-[10px]">
              -99.6% latency
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Step 3 Off-Topic Declinations */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs transition-all hover:border-border/80 hover:shadow-md">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Step 3 Declinations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              99.1%
            </span>
            <span className="text-xs font-medium text-muted-foreground">precision</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
            <span className="truncate">Attacks & chit-chat filtered</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Conversations */}
      <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs transition-all hover:border-border/80 hover:shadow-md">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Active Conversations</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground font-mono">
              14
            </span>
            <span className="text-xs text-muted-foreground">total active</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              6 AI
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              2 Waiting
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
              6 Closed
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
