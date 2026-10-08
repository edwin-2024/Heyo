"use client";

import React, { useState } from "react";
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Cpu,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AiReasoning } from "./types";
import { cn } from "@/lib/utils";

interface AiReasoningCardProps {
  reasoning: AiReasoning;
}

export function AiReasoningCard({ reasoning }: AiReasoningCardProps) {
  // Open by default to match Mockup 1 exactly
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full my-3 rounded-2xl border border-amber-500/30 dark:border-amber-500/25 bg-amber-500/5 dark:bg-amber-950/20 overflow-hidden text-xs shadow-xs transition-all">
      {/* Header Bar / Collapsible Toggle matching competitor screenshot */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-foreground text-xs">
            Heyo AI Copilot · Autonomous Reasoning
          </span>
          <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold">
            Step 1
          </span>
        </div>
        <div className="text-muted-foreground">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Reasoning & Chunk Retrieval Inspector matching competitor reference */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-amber-500/20 dark:border-amber-500/15">
          {/* Tag & Heading: [Support question] + "Answered from the knowledge base" */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-background border border-border text-foreground font-mono">
                {reasoning.classificationLabel}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Cosine &ge; 0.65 Grounded
              </span>
            </div>
            <h4 className="text-xs font-bold text-foreground pt-0.5">
              {reasoning.statusBadge}
            </h4>
            <p className="text-[11px] text-muted-foreground leading-normal">
              {reasoning.thresholdNote}
            </p>
          </div>

          {/* Chunk Match List with Progress Bars & Scores (account-help.md: 0.70 Used) */}
          <div className="space-y-2 p-3 rounded-xl bg-background/60 dark:bg-black/30 border border-border/80">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground font-mono pb-1 border-b border-border/50">
              Vector Retrieval Telemetry (pgvector 384d)
            </div>
            {reasoning.retrievedChunks.map((chunk, idx) => {
              const isUsed = chunk.status === "USED";

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 text-xs py-1"
                >
                  {/* Document Name (5 cols) */}
                  <span className="col-span-5 font-mono text-[11px] text-foreground truncate font-medium">
                    {chunk.documentName}
                  </span>

                  {/* Horizontal Bar (4 cols) */}
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isUsed ? "bg-amber-500 dark:bg-amber-400" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${Math.round(chunk.similarity * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                      {chunk.similarity.toFixed(2)}
                    </span>
                  </div>

                  {/* Used / Below threshold status (3 cols) */}
                  <div className="col-span-3 text-right">
                    <span
                      className={cn(
                        "text-[10px] font-mono uppercase px-1.5 py-0.5 rounded",
                        isUsed
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isUsed ? "Grounded" : "Below 0.65"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Metrics Footer */}
          <div className="pt-2 border-t border-amber-500/20 text-[10px] text-muted-foreground font-mono flex items-center justify-between flex-wrap gap-2">
            <span>{reasoning.modelsUsed} · Groq LPU</span>
            <span>First token {(reasoning.latencyFirstWordMs / 1000).toFixed(1)}s · Done in {reasoning.latencyTotalSeconds}s · {reasoning.tokensIn.toLocaleString()} in / {reasoning.tokensOut} out</span>
          </div>
        </div>
      )}
    </div>
  );
}
