"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import usePartySocket from "partysocket/react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ConversationList } from "./ConversationList";
import { ActiveThread } from "./ActiveThread";
import { VisitorInspector } from "./VisitorInspector";
import { ConversationItem, FilterTab } from "./types";
import { orpc } from "@/lib/orpc";

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "Just now";
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  } catch {
    return "Just now";
  }
}

function parseVisitorMetadata(
  convId: string,
  visitorToken?: string | null,
  metadata?: Record<string, any> | null,
  createdAt?: string
) {
  const vShort = visitorToken ? visitorToken.slice(-4) : convId.slice(-4);
  const meta = (metadata || {}) as Record<string, any>;

  const ua = (meta.userAgent as string) || "";
  let browser = "Web Browser";
  let os = "Desktop";
  let device = "Desktop";

  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = "Chrome";
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = "Safari";
  else if (/firefox|fxios/i.test(ua)) browser = "Firefox";
  else if (/edg/i.test(ua)) browser = "Edge";

  if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
    device = "Mobile";
  } else if (/android/i.test(ua)) {
    os = "Android";
    device = "Mobile";
  } else if (/windows/i.test(ua)) {
    os = "Windows";
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = "macOS";
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  }

  const timeZone = (meta.timeZone as string) || "UTC";
  let localTime = "Active";
  try {
    localTime = new Date().toLocaleTimeString([], {
      timeZone: timeZone !== "UTC" ? timeZone : undefined,
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    localTime = "Active";
  }

  const origin = (meta.origin as string) || "External Website";
  const language = (meta.language as string) || "en-US";

  return {
    id: visitorToken || convId,
    name: `Visitor ${vShort}`,
    handle: `@visitor_${vShort}`,
    avatarSeed: visitorToken || convId,
    isOnline: true,
    email: (meta.email as string) || undefined,
    currentPage: origin,
    location: timeZone !== "UTC" ? timeZone.replace(/_/g, " ") : "Web Visitor",
    localTime,
    language,
    device,
    browser,
    os,
    cameFrom: origin !== "External Website" ? origin : "Direct",
    firstSeen: formatRelativeTime(createdAt),
    lastSeen: "Just now",
    visitsCount: 1,
  };
}

export function LiveInbox() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showInspector, setShowInspector] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVisitorTyping, setIsVisitorTyping] = useState(false);
  const visitorTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch workspace ID and real conversations from Postgres on mount
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    orpc.workspace
      .getWorkspace()
      .then(async (ws) => {
        if (!mounted || !ws?.id) return;
        setWorkspaceId(ws.id);

        try {
          const list = await orpc.conversation.listConversations({ workspaceId: ws.id });
          if (!mounted) return;

          if (list && list.length > 0) {
            const statusMap: Record<string, ConversationItem["status"]> = {
              AI_ANSWERING: "AI_ANSWERING",
              WAITING_HUMAN: "WAITING_HUMAN",
              OPERATOR_ANSWERED: "HUMAN_ACTIVE",
              RESOLVED: "CLOSED",
            };

            const formatted: ConversationItem[] = list.map((conv) => {
              const vShort = conv.visitorToken ? conv.visitorToken.slice(-4) : conv.id.slice(-4);
              return {
                id: conv.id,
                status: statusMap[conv.status] || "AI_ANSWERING",
                lastMessageSnippet: conv.lastMessage?.text || "Conversation started",
                lastMessageAt: conv.lastMessage?.createdAt || conv.updatedAt,
                startedAt: conv.createdAt,
                relativeTime: formatRelativeTime(conv.updatedAt),
                unreadCount: undefined,
                visitor: parseVisitorMetadata(
                  conv.id,
                  conv.visitorToken,
                  (conv.lastMessage as any)?.metadata,
                  conv.createdAt
                ),
                messages: conv.lastMessage
                  ? [
                      {
                        id: conv.lastMessage.id,
                        conversationId: conv.id,
                        sender:
                          conv.lastMessage.sender === "operator"
                            ? "operator"
                            : conv.lastMessage.sender === "bot"
                            ? "ai"
                            : "visitor",
                        senderName:
                          conv.lastMessage.sender === "operator"
                            ? "Operator (You)"
                            : conv.lastMessage.sender === "bot"
                            ? "Heyo Bot"
                            : `Visitor ${vShort}`,
                        text: conv.lastMessage.text,
                        createdAt: formatRelativeTime(conv.lastMessage.createdAt),
                      },
                    ]
                  : [],
              };
            });
            setConversations(formatted);
          } else {
            setConversations([]);
          }
        } catch (err) {
          console.error("Failed to load conversations from Postgres:", err);
          setConversations([]);
        } finally {
          if (mounted) setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load workspace ID in LiveInbox:", err);
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // 2. PartyKit Edge Room for operator inbox alerts: inbox_${workspaceId}
  usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: workspaceId ? `inbox_${workspaceId}` : "dummy_inbox",
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "conversation:updated" && data.payload) {
          const { conversationId, status, lastMessage } = data.payload;
          const statusMap: Record<string, ConversationItem["status"]> = {
            AI_ANSWERING: "AI_ANSWERING",
            WAITING_HUMAN: "WAITING_HUMAN",
            OPERATOR_ANSWERED: "HUMAN_ACTIVE",
            RESOLVED: "CLOSED",
          };
          const mappedStatus = (status ? statusMap[status] : undefined) || "AI_ANSWERING";

          setConversations((prev) => {
            const exists = prev.find((c) => c.id === conversationId);
            if (exists) {
              return prev.map((c) => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    status: mappedStatus,
                    lastMessageSnippet: lastMessage?.text || c.lastMessageSnippet,
                    lastMessageAt: lastMessage?.createdAt || new Date().toISOString(),
                    relativeTime: "Just now",
                    unreadCount: c.id === selectedId ? undefined : (c.unreadCount || 0) + 1,
                  };
                }
                return c;
              });
            } else {
              // Add newly initiated conversation to top
              const vShort = conversationId.slice(-4);
              const newConv: ConversationItem = {
                id: conversationId,
                status: mappedStatus,
                lastMessageSnippet: lastMessage?.text || "New conversation started",
                lastMessageAt: lastMessage?.createdAt || new Date().toISOString(),
                startedAt: new Date().toISOString(),
                relativeTime: "Just now",
                unreadCount: 1,
                visitor: parseVisitorMetadata(
                  conversationId,
                  null,
                  (lastMessage as any)?.metadata,
                  new Date().toISOString()
                ),
                messages: lastMessage
                  ? [
                      {
                        id: lastMessage.id,
                        conversationId,
                        sender: lastMessage.sender === "visitor" ? "visitor" : "ai",
                        senderName: lastMessage.sender === "visitor" ? `Visitor ${vShort}` : "Heyo Bot",
                        text: lastMessage.text,
                        createdAt: "Just now",
                      },
                    ]
                  : [],
              };
              return [newConv, ...prev];
            }
          });
        } else if (data.type === "conversation:status_changed" && data.payload) {
          const { conversationId, status } = data.payload;
          const statusMap: Record<string, ConversationItem["status"]> = {
            AI_ANSWERING: "AI_ANSWERING",
            WAITING_HUMAN: "WAITING_HUMAN",
            OPERATOR_ANSWERED: "HUMAN_ACTIVE",
            RESOLVED: "CLOSED",
          };
          const mappedStatus = statusMap[status] || "AI_ANSWERING";
          setConversations((prev) =>
            prev.map((c) => (c.id === conversationId ? { ...c, status: mappedStatus } : c))
          );
        }
      } catch (e) {
        // parse error
      }
    },
  });

  // 3. PartyKit Edge Room for currently selected conversation: room_${workspaceId}_${selectedId}
  const chatSocket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: workspaceId && selectedId ? `room_${workspaceId}_${selectedId}` : "dummy_room",
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.payload && selectedId) {
          const msg = data.payload;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === selectedId) {
                // Avoid duplicates
                if (c.messages.some((m) => m.id === msg.id)) return c;
                return {
                  ...c,
                  lastMessageSnippet: msg.text,
                  relativeTime: "Just now",
                  messages: [
                    ...c.messages,
                    {
                      id: msg.id,
                      conversationId: selectedId,
                      sender: msg.sender === "operator" ? "operator" : msg.sender === "visitor" ? "visitor" : "ai",
                      senderName:
                        msg.sender === "operator"
                          ? "Operator (You)"
                          : msg.sender === "bot"
                          ? "Heyo Bot"
                          : "Visitor",
                      text: msg.text,
                      createdAt: "Just now",
                    },
                  ],
                };
              }
              return c;
            })
          );
        } else if (data.type === "typing") {
          if (data.payload?.sender === "visitor" || !data.payload?.sender) {
            if (visitorTypingTimerRef.current) clearTimeout(visitorTypingTimerRef.current);
            setIsVisitorTyping(true);
            visitorTypingTimerRef.current = setTimeout(() => {
              setIsVisitorTyping(false);
            }, 3000);
          }
        }
      } catch (e) {
        // parse error
      }
    },
  });

  const handleOperatorTyping = useCallback(() => {
    if (chatSocket && selectedId) {
      try {
        chatSocket.send(
          JSON.stringify({
            type: "typing",
            payload: { sender: "operator" },
          })
        );
      } catch (e) {
        // ignore send error
      }
    }
  }, [chatSocket, selectedId]);

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
  const conversationMap = useMemo(() => {
    return new Map(conversations.map((c) => [c.id, c]));
  }, [conversations]);

  const selectedConversation = useMemo(() => {
    return selectedId ? conversationMap.get(selectedId) || null : null;
  }, [conversationMap, selectedId]);

  // Actions wrapped in useCallback for stable references
  const handleSelectConversation = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setConversations((prev) =>
        prev.map((c) => (c.id === id && c.unreadCount ? { ...c, unreadCount: undefined } : c))
      );

      if (!workspaceId) return;

      try {
        const fullConv = await orpc.conversation.getConversation({
          workspaceId,
          conversationId: id,
        });

        if (fullConv && fullConv.messages) {
          const statusMap: Record<string, ConversationItem["status"]> = {
            AI_ANSWERING: "AI_ANSWERING",
            WAITING_HUMAN: "WAITING_HUMAN",
            OPERATOR_ANSWERED: "HUMAN_ACTIVE",
            RESOLVED: "CLOSED",
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === id) {
                return {
                  ...c,
                  status: statusMap[fullConv.status] || c.status,
                  messages: fullConv.messages.map((m) => ({
                    id: m.id,
                    conversationId: id,
                    sender:
                      m.sender === "operator"
                        ? "operator"
                        : m.sender === "bot"
                        ? "ai"
                        : m.sender === "system"
                        ? "system"
                        : "visitor",
                    senderName:
                      m.sender === "operator"
                        ? "Operator (You)"
                        : m.sender === "bot"
                        ? "Heyo Bot"
                        : m.sender === "system"
                        ? "System"
                        : c.visitor.name,
                    text: m.text,
                    createdAt: new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  })),
                };
              }
              return c;
            })
          );
        }
      } catch (err) {
        console.error("Failed to fetch full conversation messages:", err);
      }
    },
    [workspaceId]
  );

  const handleSendMessage = useCallback(
    async (conversationId: string, text: string) => {
      // Server-first persistence to Neon Postgres & PartyKit broadcast
      try {
        const saved = await orpc.conversation.sendMessage({
          workspaceId,
          conversationId,
          sender: "operator",
          text,
        });

        // Ensure state includes authoritative message if not already received via PartyKit
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === conversationId) {
              if (c.messages.some((m) => m.id === saved.id)) return c;
              return {
                ...c,
                status: "HUMAN_ACTIVE",
                lastMessageSnippet: text,
                relativeTime: "Just now",
                messages: [
                  ...c.messages,
                  {
                    id: saved.id,
                    conversationId,
                    sender: "operator" as const,
                    senderName: "Operator (You)",
                    text: saved.text,
                    createdAt: "Just now",
                  },
                ],
              };
            }
            return c;
          })
        );
      } catch (err) {
        console.error("Failed to persist operator message to Postgres:", err);
      }
    },
    [workspaceId]
  );

  const handleTakeOver = useCallback(
    async (conversationId: string) => {
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

      try {
        await orpc.conversation.updateStatus({
          workspaceId,
          conversationId,
          status: "OPERATOR_ANSWERED",
        });
      } catch (err) {
        console.error("Failed to update status in Postgres:", err);
      }
    },
    [workspaceId]
  );

  const handleResolve = useCallback(
    async (conversationId: string) => {
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
                  text: "Conversation marked as resolved.",
                  createdAt: "Just now",
                },
              ],
            };
          }
          return c;
        })
      );

      try {
        await orpc.conversation.updateStatus({
          workspaceId,
          conversationId,
          status: "RESOLVED",
        });
      } catch (err) {
        console.error("Failed to update status in Postgres:", err);
      }
    },
    [workspaceId]
  );

  const handleToggleAgent = useCallback(
    async (conversationId: string, enabled: boolean) => {
      const newStatus = enabled ? "AI_ANSWERING" : "WAITING_HUMAN";
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === conversationId) {
            return {
              ...c,
              status: newStatus,
              messages: [
                ...c.messages,
                {
                  id: `msg-${Date.now()}`,
                  conversationId,
                  sender: "system" as const,
                  senderName: "System",
                  text: enabled
                    ? "AI agent resumed for this conversation."
                    : "AI agent paused by operator. Conversation marked as Waiting for human.",
                  createdAt: "Just now",
                },
              ],
            };
          }
          return c;
        })
      );

      try {
        await orpc.conversation.updateStatus({
          workspaceId,
          conversationId,
          status: newStatus,
        });
      } catch (err) {
        console.error("Failed to update agent toggle status in Postgres:", err);
      }
    },
    [workspaceId]
  );

  const handleDismiss = useCallback((conversationId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setSelectedId((curr) => (curr === conversationId ? null : curr));
  }, []);

  const handleResolveDirectly = useCallback(
    (conversationId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      handleResolve(conversationId);
    },
    [handleResolve]
  );

  const handleCloseThread = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleToggleInspector = useCallback(() => {
    setShowInspector((prev) => !prev);
  }, []);

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      <ResizablePanelGroup orientation="horizontal" className="h-full w-full">
        {/* Panel 1: Conversation List */}
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

        {/* Panel 2: Active Conversation Thread */}
        <ResizablePanel defaultSize={showInspector ? "47%" : "72%"} minSize="35%">
          <ActiveThread
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            onTakeOver={handleTakeOver}
            onResolve={handleResolve}
            onCloseThread={handleCloseThread}
            showInspector={showInspector}
            onToggleInspector={handleToggleInspector}
            isVisitorTyping={isVisitorTyping}
            onOperatorTyping={handleOperatorTyping}
            onToggleAgent={handleToggleAgent}
          />
        </ResizablePanel>

        {/* Panel 3: Visitor Context Inspector */}
        {showInspector && selectedConversation && (
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
