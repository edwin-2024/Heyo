"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ConversationList } from "./ConversationList";
import { ActiveThread } from "./ActiveThread";
import { VisitorInspector } from "./VisitorInspector";
import { initialMockConversations } from "./mock-data";
import { ConversationItem, FilterTab } from "./types";

export function LiveInbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>(
    initialMockConversations
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    initialMockConversations[0]?.id || null
  );
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInspector, setShowInspector] = useState(true);

  // Filter & Search logic
  const filteredConversations = useMemo(() => {
    return conversations.filter((item) => {
      // 1. Tab filter
      if (activeFilter === "waiting" && item.status !== "WAITING_HUMAN") {
        return false;
      }
      if (activeFilter === "ai" && item.status !== "AI_ANSWERING") {
        return false;
      }
      if (activeFilter === "you" && item.status !== "HUMAN_ACTIVE") {
        return false;
      }
      if (activeFilter === "closed" && item.status !== "CLOSED") {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.visitor.name.toLowerCase().includes(query);
        const matchesSnippet = item.lastMessageSnippet.toLowerCase().includes(query);
        const matchesPage = item.visitor.currentPage.toLowerCase().includes(query);
        const matchesLocation = item.visitor.location.toLowerCase().includes(query);

        return matchesName || matchesSnippet || matchesPage || matchesLocation;
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  // Status counts for tab badges
  const counts = useMemo(() => {
    return {
      all: conversations.filter((c) => c.status !== "CLOSED").length,
      waiting: conversations.filter((c) => c.status === "WAITING_HUMAN").length,
      ai: conversations.filter((c) => c.status === "AI_ANSWERING").length,
      you: conversations.filter((c) => c.status === "HUMAN_ACTIVE").length,
      closed: conversations.filter((c) => c.status === "CLOSED").length,
    };
  }, [conversations]);

  // Active selected conversation
  // O(1) conversation map for instant lookup without array scans
  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.id, c]));
  }, [conversations]);

  // Active selected conversation O(1)
  const selectedConversation = useMemo(() => {
    return selectedId ? conversationMap.get(selectedId) || null : null;
  }, [conversationMap, selectedId]);

  // Actions wrapped in useCallback for stable references
  const handleSelectConversation = useCallback((id: string) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: undefined } : c))
    );
  }, []);

  const handleSendMessage = useCallback((conversationId: string, text: string) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: "operator" as const,
      senderName: "Operator (You)",
      text,
      createdAt: "Just now",
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            status: "HUMAN_ACTIVE", // Takeover rule: replying switches status to HUMAN_ACTIVE
            lastMessageSnippet: text,
            relativeTime: "Just now",
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );
  }, []);

  const handleTakeOver = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            status: "HUMAN_ACTIVE",
            messages: [
              ...c.messages,
              {
                id: `msg-${Date.now()}`,
                conversationId,
                sender: "system" as const,
                senderName: "System",
                text: "Operator took over this conversation from the AI agent.",
                createdAt: "Just now",
              },
            ],
          };
        }
        return c;
      })
    );
  }, []);

  const handleResolve = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === conversationId) {
          return {
            ...c,
            status: "CLOSED",
            messages: [
              ...c.messages,
              {
                id: `msg-${Date.now()}`,
                conversationId,
                sender: "system" as const,
                senderName: "System",
                text: "Conversation marked as resolved by operator.",
                createdAt: "Just now",
              },
            ],
          };
        }
        return c;
      })
    );
  }, []);

  const handleDismiss = useCallback((conversationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setSelectedId((curr) => (curr === conversationId ? null : curr));
  }, []);

  const handleResolveDirectly = useCallback((conversationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    handleResolve(conversationId);
  }, [handleResolve]);

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {/* Left Column: Conversation List */}
        <ResizablePanel defaultSize="28%" minSize="20%" maxSize="40%">
          <ConversationList
            conversations={filteredConversations}
            selectedId={selectedId}
            onSelect={handleSelectConversation}
            onResolveDirectly={handleResolveDirectly}
            onDismissDirectly={handleDismiss}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            counts={counts}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Middle Column: Active Thread */}
        <ResizablePanel defaultSize={showInspector ? "47%" : "72%"} minSize="35%">
          <ActiveThread
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            onTakeOver={handleTakeOver}
            onResolve={handleResolve}
            onCloseThread={() => setSelectedId(null)}
            showInspector={showInspector}
            onToggleInspector={() => setShowInspector(!showInspector)}
          />
        </ResizablePanel>

        {/* Right Column: Visitor & Context Inspector */}
        {showInspector && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="25%" minSize="20%" maxSize="40%">
              <VisitorInspector
                conversation={selectedConversation}
                onClose={() => setShowInspector(false)}
              />
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  );
}
