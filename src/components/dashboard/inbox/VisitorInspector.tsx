"use client";

import React from "react";
import { Sidebar } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { VisitorAvatar } from "./VisitorAvatar";
import { ConversationItem } from "./types";

interface VisitorInspectorProps {
  conversation: ConversationItem | null;
  onClose?: () => void;
}

export function VisitorInspector({ conversation, onClose }: VisitorInspectorProps) {
  if (!conversation) {
    return (
      <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-border select-none">
        <div className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0">
          <h3 className="text-sm font-bold text-foreground">Details</h3>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Close Details panel"
            >
              <Sidebar className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-muted-foreground">
          <div className="h-10 w-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center mb-3 text-muted-foreground">
            <Sidebar className="h-5 w-5" />
          </div>
          <p className="font-semibold text-foreground">No visitor selected</p>
          <p className="text-[11px] text-muted-foreground mt-1 max-w-[200px]">
            Visitor identity, browser telemetry, and conversation attributes appear here.
          </p>
        </div>
      </div>
    );
  }

  const { visitor } = conversation;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-neutral-900 border-l border-border select-none">
      {/* Inspector Header matching mockup 1 (Details + Sidebar toggle) */}
      <div className="h-14 px-5 border-b border-border flex items-center justify-between shrink-0">
        <h3 className="text-sm font-bold text-foreground">Details</h3>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Close Details panel"
          >
            <Sidebar className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-6">
          {/* Visitor Avatar & Name matching mockup 1 */}
          <div className="flex items-center gap-3.5 pb-2">
            <VisitorAvatar
              seed={visitor.avatarSeed}
              name={visitor.name}
              isOnline={visitor.isOnline}
              size="lg"
            />
            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-foreground">
                {visitor.name}
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {visitor.location}
              </p>
            </div>
          </div>

          {/* Visitor Attributes Section matching mockup 1 */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Visitor
            </h5>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-foreground">{visitor.location}</span>
              </div>

              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">Local time</span>
                <div className="text-right">
                  <div className="font-semibold text-foreground">
                    {visitor.localTime.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {visitor.localTime.includes("Europe") ? "Europe/Berlin" : "America/New_York"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Language</span>
                <span className="font-medium text-foreground">{visitor.language}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Device</span>
                <span className="font-medium text-foreground">{visitor.device}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Browser</span>
                <span className="font-medium text-foreground">{visitor.browser}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">System</span>
                <span className="font-medium text-foreground">{visitor.os}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Current page</span>
                <span className="font-mono text-xs text-foreground truncate max-w-[160px]">
                  {visitor.currentPage}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Came from</span>
                <span className="font-medium text-foreground">{visitor.cameFrom}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">First seen</span>
                <span className="font-medium text-foreground">{visitor.firstSeen}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last seen</span>
                <span className="font-medium text-foreground">{visitor.lastSeen}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Visits</span>
                <span className="font-medium text-foreground">{visitor.visitsCount}</span>
              </div>
            </div>
          </div>

          {/* Conversation Attributes Section matching mockup 1 */}
          <div className="space-y-3 pt-4 border-t border-border/60">
            <h5 className="text-xs font-bold text-foreground uppercase tracking-wider">
              Conversation
            </h5>

            <div className="space-y-3 text-xs">
              <div className="flex items-start justify-between">
                <span className="text-muted-foreground">State</span>
                <div className="text-right">
                  <div className="font-semibold text-foreground">
                    {conversation.status === "WAITING_HUMAN" ? "Agent" : conversation.status === "HUMAN_ACTIVE" ? "Operator" : "Agent"}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {conversation.status === "WAITING_HUMAN" ? "Waiting for human" : "The agent is replying"}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Handoff reason</span>
                <span className="font-medium text-foreground">
                  {conversation.handoffReason || "No handoff"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Started</span>
                <span className="font-medium text-foreground">{conversation.startedAt}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last message</span>
                <span className="font-medium text-foreground">{conversation.relativeTime} ago</span>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
