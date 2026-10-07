"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      "relative flex w-1.5 hover:w-1.5 items-center justify-center bg-border/60 hover:bg-primary/50 active:bg-primary transition-colors cursor-col-resize select-none z-20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[separator=active]:bg-primary",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-30 flex h-6 w-3.5 items-center justify-center rounded-sm border border-border bg-card shadow-xs">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

