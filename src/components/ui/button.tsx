import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-[background-color,border-color,color,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Operator & Inbox specific variants
        filterTab:
          "px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted data-[active=true]:bg-neutral-900 data-[active=true]:text-white dark:data-[active=true]:bg-white dark:data-[active=true]:text-neutral-900 data-[active=true]:font-semibold data-[active=true]:shadow-xs",
        iconRound:
          "h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-foreground hover:bg-muted border border-border",
        // Liquid-glass / liquid-metal design system variants for Heyo
        solid:
          "relative isolate overflow-hidden font-medium border border-white text-neutral-900 bg-[linear-gradient(180deg,#ffffff_0%,#e7e7e7_48%,#cfcfcf_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#f3f6ff_42%,#d5def2_100%)] hover:border-[#f2f6ff] hover:shadow-[inset_0_1px_0_#fff,0_0_26px_rgba(186,208,255,0.4),0_8px_18px_rgba(255,255,255,0.14)]",
        liquidGhost:
          "relative isolate overflow-hidden font-medium text-white border border-[rgba(198,198,198,0.55)] bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(0,0,0,0.5)_46%,rgba(150,170,200,0.1))] backdrop-blur-md hover:border-[rgba(220,230,255,0.8)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_24px_rgba(170,200,255,0.28)]",
        liquidPill:
          "relative isolate overflow-hidden font-normal text-[#f3f3f3] border border-[rgba(198,198,198,0.55)] bg-[linear-gradient(105deg,#050505_0%,#2a2a2a_48%,#4a4a4a_100%)] hover:border-[rgba(235,235,235,0.9)] hover:bg-[linear-gradient(105deg,#111_0%,#3a3a3a_45%,#6a6a6a_100%)] hover:shadow-[0_0_18px_rgba(200,210,230,0.18)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-8 w-8 p-0",
        pill: "h-auto px-3 py-1 text-xs rounded-full",
        btn: "h-[var(--btn-h,40px)] px-4 text-[length:var(--btn,13.5px)] tracking-[-0.02em]",
        heroBtn: "h-[var(--hero-btn-h,42px)] px-[18px] text-[length:var(--btn,13.5px)] tracking-[-0.02em]",
        nav: "h-[var(--nav-h,40px)] px-[18px] rounded-[7px] text-[length:var(--nav,14px)] tracking-[-0.01em]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
