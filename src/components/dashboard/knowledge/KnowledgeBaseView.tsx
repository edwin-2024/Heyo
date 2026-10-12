"use client";

import React from "react";
import { BookOpen, Sparkles, Database, ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { KnowledgeBaseCard } from "@/components/dashboard/home/KnowledgeBaseCard";
import { Badge } from "@/components/ui/badge";

interface KnowledgeBaseViewProps {
  workspaceId: string;
}

export function KnowledgeBaseView({ workspaceId }: KnowledgeBaseViewProps) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-card via-card to-primary/[0.04] p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/25 font-mono text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
              >
                Grounded Knowledge Engine
              </Badge>
              <span className="text-xs text-muted-foreground font-mono">Neon pgvector 384d</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-primary" />
              <span>Knowledge Base & Documentation</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Upload customer guides, policy docs, and product manuals. Heyo AI chunks and indexes each passage into 384-dimensional vectors with cosine similarity guardrails to autonomously answer visitor queries.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-xl border border-border/70 bg-background/80 p-3 text-xs space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Dual Guardrails Active</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Cosine Cutoff: <span className="text-primary font-bold">0.65 similarity</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Knowledge Base Management Card */}
      {workspaceId ? (
        <KnowledgeBaseCard workspaceId={workspaceId} />
      ) : (
        <div className="p-12 text-center text-muted-foreground border border-dashed rounded-2xl">
          Loading workspace knowledge base...
        </div>
      )}
    </div>
  );
}
