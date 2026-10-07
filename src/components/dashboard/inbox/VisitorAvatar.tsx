import React from "react";
import { cn } from "@/lib/utils";

interface VisitorAvatarProps {
  seed: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  className?: string;
}

const PALETTES = [
  { bg: "#f97316", stroke: "#1c1917" }, // Orange (like Visitor 4a8c & 8bab in mockup)
  { bg: "#0284c7", stroke: "#0f172a" }, // Sky/Deep blue (like Visitor 305a & 7440)
  { bg: "#fef08a", stroke: "#1c1917" }, // Soft cream yellow (like Visitor 2634 & 161d)
  { bg: "#38bdf8", stroke: "#0f172a" }, // Light azure (like Visitor cf46)
  { bg: "#fed7aa", stroke: "#431407" }, // Peach (like Visitor a32a)
  { bg: "#10b981", stroke: "#064e3b" }, // Emerald
];

const SIZE_CLASSES = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-11 w-11",
  xl: "h-16 w-16",
};

const BADGE_SIZES = {
  sm: "h-2 w-2 ring-1",
  md: "h-2.5 w-2.5 ring-2",
  lg: "h-3 w-3 ring-2",
  xl: "h-3.5 w-3.5 ring-2",
};

export const VisitorAvatar = React.memo(function VisitorAvatar({
  seed,
  name,
  size = "md",
  isOnline,
  className,
}: VisitorAvatarProps) {
  const charCode = seed.charCodeAt(0) || 65;
  const palette = PALETTES[charCode % PALETTES.length];
  const faceVariant = charCode % 4;

  return (
    <div className={cn("relative inline-block shrink-0 select-none", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center shadow-xs overflow-hidden transition-transform duration-160 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 active:scale-95",
          SIZE_CLASSES[size]
        )}
        style={{ backgroundColor: palette.bg }}
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1"
        >
          {faceVariant === 0 && (
            // Heart eyes / loving face (exact match to Visitor 4a8c in mockup 1)
            <>
              {/* Left heart eye */}
              <path
                d="M12.5 12.8C11.6 11.5 9.7 11.6 9.1 12.8C8.5 14.1 9.6 15.6 12.5 17.5C15.4 15.6 16.5 14.1 15.9 12.8C15.3 11.6 13.4 11.5 12.5 12.8Z"
                fill={palette.stroke}
              />
              {/* Right heart eye */}
              <path
                d="M23.5 12.8C22.6 11.5 20.7 11.6 20.1 12.8C19.5 14.1 20.6 15.6 23.5 17.5C26.4 15.6 27.5 14.1 26.9 12.8C26.3 11.6 24.4 11.5 23.5 12.8Z"
                fill={palette.stroke}
              />
              {/* Happy smile */}
              <path
                d="M14 21C15.5 23.5 20.5 23.5 22 21"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          )}

          {faceVariant === 1 && (
            // Closed happy smiling eyes (exact match to Visitor 305a & 7440 in mockup 1)
            <>
              {/* Left closed eye */}
              <path
                d="M10 15C11.2 13 14.8 13 16 15"
                stroke={palette.stroke}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Right closed eye */}
              <path
                d="M20 15C21.2 13 24.8 13 26 15"
                stroke={palette.stroke}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Open grin */}
              <path
                d="M13 20C14.5 24 21.5 24 23 20"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          )}

          {faceVariant === 2 && (
            // Big open dots with wink or cheerful expression (Visitor 2634 / 8bab)
            <>
              {/* Left eye dot */}
              <circle cx="13" cy="14" r="2.2" fill={palette.stroke} />
              {/* Right eye dot */}
              <circle cx="23" cy="14" r="2.2" fill={palette.stroke} />
              {/* Wide smile */}
              <path
                d="M13 20.5C14.5 23.5 21.5 23.5 23 20.5"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          )}

          {faceVariant === 3 && (
            // Relaxed happy face (Visitor 161d / cf46 / a32a)
            <>
              <circle cx="12.5" cy="14" r="2" fill={palette.stroke} />
              <path
                d="M20.5 14C21.5 13 24 13 25 14"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M14 21C16 23 20 23 22 21"
                stroke={palette.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
      </div>

      {/* Online presence badge */}
      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full ring-background",
            isOnline ? "bg-blue-600 dark:bg-blue-400" : "bg-neutral-400 dark:bg-neutral-600",
            BADGE_SIZES[size]
          )}
          title={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
});
