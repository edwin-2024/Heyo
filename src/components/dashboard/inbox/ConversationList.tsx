"use client";

import React, { useEffect, memo, useCallback } from "react";
import { Search, Check, X, Inbox, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VisitorAvatar } from "./VisitorAvatar";
import { ConversationItem, FilterTab } from "./types";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onResolveDirectly: (id: string, e: React.MouseEvent) => void;
  onDismissDirectly: (id: string, e: React.MouseEvent) => void;
  activeFilter: FilterTab;
  onFilterChange: (filter: FilterTab) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  counts: {
    all: number;
    waiting: number;
    ai: number;
    you: number;
    closed: number;
  };
}

// O(1) individual row component to prevent re-rendering entire list on selection change
interface ConversationRowProps {
  item: ConversationItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onResolveDirectly: (id: string, e: React.MouseEvent) => void;
  onDismissDirectly: (id: string, e: React.MouseEvent) => void;
}

const ConversationRow = memo(function ConversationRow({
  item,
  isSelected,
  onSelect,
  onResolveDirectly,
  onDismissDirectly,
}: ConversationRowProps) {
  const visitorMessage =
    item.messages.find((m) => m.sender === "visitor")?.text || item.lastMessageSnippet;

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={cn(
        "w-full text-left p-3.5 transition-all duration-150 ease-out cursor-pointer group flex items-start gap-3 relative border-b border-border/40 select-none",
        isSelected
          ? "bg-blue-500/10 dark:bg-blue-950/40 border-l-3 border-l-blue-600 shadow-xs"
          : "bg-transparent hover:bg-muted/40 active:scale-[0.99] border-l-3 border-l-transparent"
      )}
    >
      <VisitorAvatar
        seed={item.visitor.avatarSeed}
        name={item.visitor.name}
        isOnline={item.visitor.isOnline}
        size="md"
        className="mt-0.5 shrink-0"
      />

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          <span className="font-semibold text-xs text-foreground truncate">
            {item.visitor.name}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-muted-foreground font-medium group-hover:hidden">
              {item.relativeTime}
            </span>

            <div className="hidden group-hover:flex items-center gap-1">
              {item.status !== "CLOSED" && (
                <button
                  type="button"
                  onClick={(e) => onResolveDirectly(item.id, e)}
                  className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-emerald-600 hover:bg-background border border-border/70 active:scale-95 transition-transform cursor-pointer"
                  title="Quick resolve chat"
                >
                  <Check className="h-3 w-3" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => onDismissDirectly(item.id, e)}
                className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-background border border-border/70 active:scale-95 transition-transform cursor-pointer"
                title="Close / archive chat"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-[12px] text-foreground font-medium line-clamp-1 leading-snug">
          {visitorMessage}
        </p>

        <div className="pt-0.5 flex items-center flex-wrap gap-1.5">
          {item.status === "WAITING_HUMAN" && (
            <div className="inline-flex items-center gap-1.5 text-[11px]">
              <Badge variant="waiting" className="text-[10px] py-0 px-2 rounded-full">
                Waiting
              </Badge>
              {item.handoffReason && (
                <span className="text-muted-foreground text-[11px] truncate max-w-[170px]">
                  {item.handoffReason}
                </span>
              )}
            </div>
          )}

          {item.status === "AI_ANSWERING" && (
            <Badge variant="agent" className="text-[10px] py-0 px-2 rounded-full">
              Agent
            </Badge>
          )}

          {item.status === "HUMAN_ACTIVE" && (
            <div className="inline-flex items-center gap-1.5 text-[11px]">
              <Badge variant="operator" className="text-[10px] py-0 px-2 rounded-full">
                You
              </Badge>
              <span className="text-muted-foreground text-[11px]">Operator replying</span>
            </div>
          )}

          {item.status === "CLOSED" && (
            <Badge variant="closed" className="text-[10px] py-0 px-2 rounded-full">
              Closed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
});

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onResolveDirectly,
  onDismissDirectly,
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  counts,
}: ConversationListProps) {
  // Arrow key up/down list navigation
  useEffect(() => {
    const handleListKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const currentIndex = conversations.findIndex((c) => c.id === selectedId);
        if (currentIndex < conversations.length - 1) {
          const nextConv = conversations[currentIndex + 1];
          if (nextConv) onSelect(nextConv.id);
        }
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const currentIndex = conversations.findIndex((c) => c.id === selectedId);
        if (currentIndex > 0) {
          const prevConv = conversations[currentIndex - 1];
          if (prevConv) onSelect(prevConv.id);
        }
      }
    };

    window.addEventListener("keydown", handleListKeyDown);
    return () => window.removeEventListener("keydown", handleListKeyDown);
  }, [conversations, selectedId, onSelect]);

  const FILTER_TABS: Array<{ id: FilterTab; label: string; count?: number }> = [
    { id: "all", label: "All open" },
    { id: "waiting", label: "Waiting", count: counts.waiting },
    { id: "ai", label: "Agent" },
    { id: "you", label: "You" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="flex flex-col h-full bg-background border-r border-border select-none">
      {/* Top Header / Inbox Title & Filter Tabs */}
      <div className="p-4 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">Inbox</h2>
            <Badge variant="waiting" className="rounded-full text-xs font-semibold px-2 py-0.5">
              {counts.waiting} waiting
            </Badge>
          </div>

          <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
            {conversations.length} total
          </span>
        </div>

        {/* Clean pill tabs using Button variant="filterTab" */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs font-medium scrollbar-none">
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab.id}
              variant="filterTab"
              size="pill"
              data-active={activeFilter === tab.id}
              onClick={() => onFilterChange(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[11px] opacity-80 font-mono ml-1">{tab.count}</span>
              )}
            </Button>
          ))}
        </div>

        {/* Search input with rounded pill border */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search visitors and last messages..."
            className="pl-9 pr-8 h-9 text-xs rounded-full bg-muted/40 border-border focus-visible:bg-background placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-2.5 h-4 w-4 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations Scrollable List */}
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          searchQuery || activeFilter !== "all" ? (
            <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">No matching conversations</p>
              <p className="text-[11px]">Try selecting another tab or clear your search.</p>
            </div>
          ) : (
            <div className="p-6 text-center space-y-3.5 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="h-12 w-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground shadow-xs">
                <Inbox className="h-6 w-6 text-neutral-400 dark:text-neutral-500" />
              </div>
              <div className="space-y-1 max-w-[220px]">
                <p className="font-semibold text-foreground text-sm">Inbox is empty</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  When visitors send a message via your chat widget, conversations will appear here in real time.
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="text-xs gap-1.5 shadow-xs cursor-pointer">
                <a href="/demo" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 text-primary" />
                  <span>Test on Demo Website</span>
                </a>
              </Button>
            </div>
          )
        ) : (
          <div className="divide-y divide-border/40">
            {conversations.map((item) => (
              <ConversationRow
                key={item.id}
                item={item}
                isSelected={item.id === selectedId}
                onSelect={onSelect}
                onResolveDirectly={onResolveDirectly}
                onDismissDirectly={onDismissDirectly}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
