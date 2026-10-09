"use client";

import { useEffect, useState, useRef } from "react";
import usePartySocket from "partysocket/react";
import { MessageCircle, X, Send, Sparkles, Bot, CheckCircle2, RefreshCw, User } from "lucide-react";
import { orpc } from "@/lib/orpc";

interface MessageItem {
  id: string;
  sender: "visitor" | "bot" | "operator" | "system";
  text: string;
  createdAt: string;
}

export function EmbedClient({
  workspaceId,
  visitorToken,
  position,
  settings,
}: {
  workspaceId: string;
  visitorToken: string;
  position: string;
  settings: {
    primaryColor: string;
    brandTitle: string;
    botDisplayName: string;
    botAvatarType: string;
    customAvatarUrl?: string;
    welcomeMessage: string;
    themeMode: string;
    allowHumanEscalation?: boolean;
  };
}) {
  const [currentSettings, setCurrentSettings] = useState(settings);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [conversationStatus, setConversationStatus] = useState<string>("AI_ANSWERING");
  const [isEscalating, setIsEscalating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Derive deterministic, workspace-scoped conversation ID
  const conversationId = `conv_${workspaceId}_${visitorToken}`;

  // Sync settings when props update
  useEffect(() => {
    setCurrentSettings(settings);
  }, [settings]);

  // Connect to PartyKit Edge Room for real-time widget settings updates (immediate reflection without reload)
  usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: `settings_${workspaceId}`,
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "settings:updated" && data.payload) {
          setCurrentSettings((prev) => ({
            ...prev,
            ...data.payload,
          }));
          if (data.payload.position) {
            window.parent.postMessage({ type: "heyo:reposition", position: data.payload.position }, "*");
          }
        }
      } catch (e) {
        // ignore parse error
      }
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, partnerTyping, isSending]);

  // Load existing conversation messages from Postgres on mount
  useEffect(() => {
    let mounted = true;
    orpc.conversation
      .getConversation({ workspaceId, conversationId })
      .then((res) => {
        if (mounted && res) {
          if (res.status) {
            setConversationStatus(res.status);
          }
          if (res.messages) {
            setMessages(
              res.messages.map((m) => ({
                id: m.id,
                sender: m.sender as MessageItem["sender"],
                text: m.text,
                createdAt: m.createdAt,
              }))
            );
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load initial conversation:", err);
      });

    return () => {
      mounted = false;
    };
  }, [workspaceId, conversationId]);

  // Connect to PartyKit Edge Room for real-time broadcasts
  const socket = usePartySocket({
    host: process.env.NEXT_PUBLIC_PARTYKIT_HOST || "127.0.0.1:1999",
    room: `room_${workspaceId}_${conversationId}`,
    onMessage(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message" && data.payload) {
          const newMsg: MessageItem = {
            id: data.payload.id || String(Date.now()),
            sender: data.payload.sender,
            text: data.payload.text,
            createdAt: data.payload.createdAt || new Date().toISOString(),
          };
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (data.type === "status:changed" && data.payload?.status) {
          setConversationStatus(data.payload.status);
        } else if (data.type === "typing") {
          if (data.payload?.sender === "operator" || !data.payload?.sender) {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            setPartnerTyping(true);
            typingTimerRef.current = setTimeout(() => {
              setPartnerTyping(false);
            }, 3000);
          }
        }
      } catch (e) {
        // parse error
      }
    },
  });

  // Host <-> Iframe postMessage protocol
  useEffect(() => {
    window.parent.postMessage({ type: "heyo:ready" }, "*");

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "heyo:init") {
        console.log("[heyo] Iframe initialized from host origin:", e.data.origin);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    window.parent.postMessage({ type: "heyo:resize", expanded: next }, "*");
  };

  const handleStartNewConversation = () => {
    if (typeof window !== "undefined") {
      window.parent.postMessage({ type: "heyo:reset_session" }, "*");
      const newToken =
        "v_" + (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Date.now());
      const url = new URL(window.location.href);
      url.searchParams.set("visitor_token", newToken);
      window.location.href = url.toString();
    }
  };

  const handleRequestHuman = async () => {
    if (isEscalating || conversationStatus === "WAITING_HUMAN" || conversationStatus === "HUMAN_ACTIVE") return;
    setIsEscalating(true);
    try {
      await orpc.conversation.requestHumanEscalation({
        workspaceId,
        conversationId,
      });
      setConversationStatus("WAITING_HUMAN");
    } catch (err) {
      console.error("Failed to request human escalation:", err);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    setSendError(null);
    setInput("");
    setIsSending(true);

    try {
      const clientMetadata = typeof window !== "undefined" ? {
        origin: window.location.search
          ? new URLSearchParams(window.location.search).get("origin") || document.referrer || window.location.origin
          : document.referrer || window.location.origin,
        userAgent: navigator.userAgent,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } : undefined;

      // ADR-0002: Server-first persistence to Neon Postgres.
      // Next.js persists to DB and immediately broadcasts to PartyKit room.
      await orpc.conversation.sendMessage({
        workspaceId,
        conversationId,
        visitorToken,
        sender: "visitor",
        text: trimmed,
        metadata: clientMetadata,
      });

      if (conversationStatus === "RESOLVED") {
        setConversationStatus("AI_ANSWERING");
      }
    } catch (err: any) {
      console.error("Failed to send message via oRPC:", err);
      // Restore input and notify user so unpersisted ghost messages are never shown
      setInput(trimmed);
      setSendError("Failed to deliver message. Please check connection and try again.");
    } finally {
      setIsSending(false);
    }
  };

  const renderAvatar = (size = "h-8 w-8") => {
    if (currentSettings.botAvatarType === "custom" && currentSettings.customAvatarUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSettings.customAvatarUrl}
          alt={currentSettings.botDisplayName}
          className={`${size} rounded-full object-cover border border-white/20`}
        />
      );
    }
    if (currentSettings.botAvatarType === "sparkle") {
      return (
        <div className={`${size} rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold`}>
          <Sparkles className="h-4 w-4" />
        </div>
      );
    }
    if (currentSettings.botAvatarType === "bot") {
      return (
        <div className={`${size} rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold`}>
          <Bot className="h-4 w-4" />
        </div>
      );
    }
    // Default 3D Liquid glass
    return (
      <div
        className={`${size} rounded-full shrink-0 shadow-sm relative overflow-hidden`}
        style={{
          background: "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)",
        }}
      >
        <div className="absolute top-0.5 left-1 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/70 to-transparent" />
      </div>
    );
  };

  const iframeStyles = (
    <style>{`
      html, body {
        height: 100% !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: transparent !important;
        background-color: transparent !important;
        overflow: hidden !important;
      }
      nextjs-portal, [data-nextjs-toast-wrapper], [data-nextjs-dev-overlay] {
        display: none !important;
      }
    `}</style>
  );

  if (!expanded) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-transparent">
        {iframeStyles}
        <button
          onClick={toggleExpanded}
          aria-label="Open chat"
          className="flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer relative"
          style={{ backgroundColor: currentSettings.primaryColor }}
        >
          {currentSettings.botAvatarType === "custom" && currentSettings.customAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentSettings.customAvatarUrl}
              alt="Chat"
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <MessageCircle className="h-7 w-7 text-white" />
          )}
        </button>
      </div>
    );
  }

  const isDark =
    currentSettings.themeMode === "dark" ||
    (currentSettings.themeMode === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden sm:rounded-2xl border shadow-2xl font-sans ${
        isDark
          ? "bg-zinc-950 text-zinc-100 border-zinc-800"
          : "bg-white text-gray-900 border-gray-200/80"
      }`}
    >
      {iframeStyles}
      {/* Widget Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 text-white shrink-0 shadow-sm relative overflow-hidden"
        style={{ backgroundColor: currentSettings.primaryColor }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10 min-w-0">
          {renderAvatar("h-9 w-9")}
          <div className="truncate">
            <h2 className="text-sm font-semibold leading-tight truncate">{currentSettings.brandTitle}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-[11px] text-white/80 truncate">{currentSettings.botDisplayName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 relative z-10 shrink-0">
          {conversationStatus === "AI_ANSWERING" && currentSettings.allowHumanEscalation !== false && (
            <button
              type="button"
              onClick={handleRequestHuman}
              disabled={isEscalating}
              title="Talk to a human operator"
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-[11px] text-white font-medium transition cursor-pointer disabled:opacity-50"
            >
              <User className="h-3 w-3" />
              <span>Talk to human</span>
            </button>
          )}
          <button
            onClick={toggleExpanded}
            aria-label="Close chat"
            className="rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        className={`flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0 ${
          isDark ? "bg-zinc-900/60" : "bg-slate-50/70"
        }`}
      >
        {/* Welcome Message */}
        <div className="flex items-end gap-2 max-w-[85%] self-start">
          {renderAvatar("h-6 w-6")}
          <div
            className={`rounded-2xl rounded-bl-sm px-4 py-2.5 text-xs shadow-xs leading-relaxed border ${
              isDark
                ? "bg-zinc-900 border-zinc-800 text-zinc-100"
                : "bg-white border-gray-200/80 text-gray-800"
            }`}
          >
            {currentSettings.welcomeMessage}
          </div>
        </div>

        {/* Conversation Thread */}
        {messages.map((m) => {
          const isVisitor = m.sender === "visitor";
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 max-w-[85%] ${
                isVisitor ? "self-end flex-row-reverse" : "self-start"
              }`}
            >
              {!isVisitor && renderAvatar("h-6 w-6")}
              <div
                className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                  isVisitor
                    ? "text-white rounded-br-sm"
                    : isDark
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-bl-sm"
                    : "bg-white border border-gray-200/80 text-gray-800 rounded-bl-sm"
                }`}
                style={isVisitor ? { backgroundColor: currentSettings.primaryColor } : {}}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {/* Waiting for Human Alert */}
        {conversationStatus === "WAITING_HUMAN" && (
          <div className="my-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center animate-in fade-in">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Connecting with human operator...
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              An operator has been notified and will reply here shortly.
            </p>
          </div>
        )}

        {/* Resolved Alert & Reset Option */}
        {conversationStatus === "RESOLVED" && (
          <div className="my-3 mx-1 p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-center animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>Conversation resolved</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              This support conversation has been marked as resolved by our team.
            </p>
            <button
              type="button"
              onClick={handleStartNewConversation}
              className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-xs hover:opacity-90 active:scale-95 transition cursor-pointer"
              style={{ backgroundColor: currentSettings.primaryColor }}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Start new conversation
            </button>
          </div>
        )}

        {/* Quick Suggestion: Talk to Human */}
        {conversationStatus === "AI_ANSWERING" && currentSettings.allowHumanEscalation !== false && messages.length > 0 && (
          <div className="flex justify-center my-1">
            <button
              type="button"
              onClick={handleRequestHuman}
              disabled={isEscalating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium text-muted-foreground bg-muted/70 hover:bg-muted border border-border/70 transition cursor-pointer active:scale-95 disabled:opacity-50 shadow-2xs"
            >
              <User className="h-3 w-3" />
              <span>Talk to a human operator</span>
            </button>
          </div>
        )}

        {/* Partner Typing Indicator (when human operator or bot is typing) */}
        {partnerTyping && (
          <div className="flex items-center gap-2 self-start animate-in fade-in">
            {renderAvatar("h-6 w-6")}
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-bl-sm border shadow-xs ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                  : "bg-white border-gray-200/80 text-gray-700"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce" />
              <span className="text-[11px] ml-1 font-medium text-muted-foreground">
                {currentSettings.botDisplayName || "Support"} is typing...
              </span>
            </div>
          </div>
        )}

        {/* AI / Sending Thinking Indicator */}
        {isSending && (
          <div className="flex items-center gap-2 self-start animate-in fade-in">
            {renderAvatar("h-6 w-6")}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-2xl rounded-bl-sm border shadow-xs ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-300"
                  : "bg-white border-gray-200/80 text-gray-700"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse [animation-delay:0.4s]" />
              </div>
              <span className="text-[11px] font-medium flex items-center gap-1 text-muted-foreground">
                <Sparkles className="h-3 w-3 text-sky-500 animate-spin" />
                Thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error notification */}
      {sendError && (
        <div className="px-4 py-1.5 bg-red-500/10 border-t border-red-500/20 text-[11px] text-red-600 font-medium text-center">
          {sendError}
        </div>
      )}

      {/* Input Area */}
      <div
        className={`border-t p-3 flex items-center gap-2 shrink-0 ${
          isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-gray-200"
        }`}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            socket.send(JSON.stringify({ type: "typing", payload: { sender: "visitor" } }));
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          disabled={isSending}
          className={`flex-1 rounded-full border px-4 py-2 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary disabled:opacity-60 ${
            isDark
              ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500"
              : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
          }`}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isSending}
          aria-label="Send message"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xs transition hover:opacity-90 disabled:opacity-40 cursor-pointer shrink-0"
          style={{ backgroundColor: currentSettings.primaryColor }}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
