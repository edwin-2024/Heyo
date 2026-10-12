"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface FileTypeIconProps {
  fileName?: string;
  contentType?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FileTypeIcon({
  fileName = "",
  contentType = "",
  size = "md",
  className,
}: FileTypeIconProps) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const isPdf = ext === "pdf" || contentType.includes("pdf");
  const isMd = ext === "md" || contentType.includes("markdown");
  const isTxt = ext === "txt" || contentType.includes("text/plain");

  const sizeClasses = {
    sm: "h-6 w-6 text-[9px]",
    md: "h-8 w-8 text-[10px]",
    lg: "h-10 w-10 text-xs",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (isPdf) {
    return (
      <div
        className={cn(
          "rounded-lg flex flex-col items-center justify-center font-bold tracking-tight shrink-0 select-none border transition-transform shadow-2xs",
          "bg-gradient-to-br from-rose-500/15 via-rose-500/10 to-red-600/20 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/40",
          sizeClasses[size],
          className
        )}
        title="PDF Document"
      >
        <span className="font-mono font-extrabold uppercase leading-none">PDF</span>
      </div>
    );
  }

  if (isMd) {
    return (
      <div
        className={cn(
          "rounded-lg flex flex-col items-center justify-center font-bold tracking-tight shrink-0 select-none border transition-transform shadow-2xs",
          "bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-blue-600/20 text-sky-600 dark:text-sky-400 border-sky-500/30 dark:border-sky-500/40",
          sizeClasses[size],
          className
        )}
        title="Markdown Document"
      >
        <span className="font-mono font-extrabold uppercase leading-none">MD</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg flex flex-col items-center justify-center font-bold tracking-tight shrink-0 select-none border transition-transform shadow-2xs",
        "bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-slate-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/40",
        sizeClasses[size],
        className
      )}
      title="Plain Text Document"
    >
      <span className="font-mono font-extrabold uppercase leading-none">TXT</span>
    </div>
  );
}
