import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "text-foreground border-border",
        // Heyo Status variants
        waiting:
          "border-transparent bg-blue-600 text-white shadow-xs font-semibold",
        agent:
          "border-border bg-muted text-foreground font-medium",
        operator:
          "border-transparent bg-purple-600 text-white shadow-xs font-semibold",
        closed:
          "border-border bg-muted/70 text-muted-foreground font-medium",
        // Liquid metal / glass design system variants
        liquidBadge:
          "border-0 rounded-[5px] text-[#f2f2f2] bg-[linear-gradient(90deg,#7d7d7d_0%,#2a2a2a_52%,#0a0a0a_100%)] tracking-[-0.01em]",
        pill:
          "rounded-full px-2 py-0.5 text-[10px] font-semibold border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
