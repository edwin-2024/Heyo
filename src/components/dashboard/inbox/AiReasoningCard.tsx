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
    <div className="w-full my-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden text-xs shadow-xs transition-all">
      {/* Header Bar / Collapsible Toggle matching mockup 1 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors text-left cursor-pointer"
      >
        <Sparkles className="h-4 w-4 text-neutral-500 shrink-0" />
        <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
          How the agent handled this
        </span>
        <div className="ml-auto text-neutral-400">
          {isOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </button>

      {/* Expanded Reasoning & Chunk Retrieval Inspector matching mockup 1 */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3.5 border-t border-neutral-100 dark:border-neutral-800/80">
          {/* Tag & Heading matching mockup 1: [Support question] + "Answered from the knowledge base" */}
          <div className="space-y-1.5 pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              {reasoning.classificationLabel}
            </span>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              {reasoning.statusBadge}
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
              {reasoning.thresholdNote}
            </p>
          </div>

          {/* Chunk Match List with Progress Bars & Scores (account-help.md: 0.70 Used) */}
          <div className="space-y-2 pt-1">
            {reasoning.retrievedChunks.map((chunk, idx) => {
              const isUsed = chunk.status === "USED";

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 items-center gap-2 text-xs py-0.5"
                >
                  {/* Document Name (5 cols) */}
                  <span className="col-span-5 font-mono text-[11px] text-neutral-800 dark:text-neutral-200 truncate">
                    {chunk.documentName}
                  </span>

                  {/* Horizontal Bar (4 cols) matching mockup 1: blue for Used, grey for below */}
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-16 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          isUsed ? "bg-blue-600" : "bg-neutral-400 dark:bg-neutral-600"
                        )}
                        style={{ width: `${Math.round(chunk.similarity * 100)}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-neutral-600 dark:text-neutral-400">
                      {chunk.similarity.toFixed(2)}
                    </span>
                  </div>

                  {/* Used / Below threshold status (3 cols) */}
                  <div className="col-span-3 text-right">
                    <span
                      className={cn(
                        "text-[11px] font-medium",
                        isUsed
                          ? "text-neutral-900 dark:text-white font-semibold"
                          : "text-neutral-400 dark:text-neutral-500"
                      )}
                    >
                      {isUsed ? "Used" : "Below threshold"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Model Metrics Footer matching mockup 1: gpt-5-4-nano · First word in 2.9s · Done in 3.6s · 1,081 tokens in, 84 out */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
            {reasoning.modelsUsed} · First word in {(reasoning.latencyFirstWordMs / 1000).toFixed(1)} s · Done in {reasoning.latencyTotalSeconds} s · {reasoning.tokensIn.toLocaleString()} tokens in, {reasoning.tokensOut} out
          </div>
        </div>
      )}
    </div>
  );
}
