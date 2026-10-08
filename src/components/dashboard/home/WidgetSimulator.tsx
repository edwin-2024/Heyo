"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  RotateCcw,
  UserCheck,
  Zap,
  HelpCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WidgetSettings, ChatMessage } from "./types";
import { cn } from "@/lib/utils";

interface WidgetSimulatorProps {
  settings: WidgetSettings;
}

const SAMPLE_PROMPTS = [
  { label: "Password reset", query: "How do I reset my password?" },
  { label: "Talk to human", query: "Can I talk to a human operator?" },
  { label: "Test off-topic", query: "Write a poem about sunflowers" },
  { label: "API Rate limits", query: "What are the API rate limits?" },
];

export function WidgetSimulator({ settings }: WidgetSimulatorProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [statusState, setStatusState] = useState<"AI_ANSWERING" | "WAITING_HUMAN" | "HUMAN_ACTIVE">("AI_ANSWERING");
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: settings.welcomeMessage,
      timestamp: "Just now",
      metadata: {
        model: "llama-3.3-70b-versatile",
        intentStatus: "ON_TOPIC",
      },
    },
  ]);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside chat without triggering window or main viewport scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleReset = () => {
    setStatusState("AI_ANSWERING");
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: "bot",
        text: settings.welcomeMessage,
        timestamp: "Just now",
        metadata: {
          model: "llama-3.3-70b-versatile",
          intentStatus: "ON_TOPIC",
        },
      },
    ]);
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "visitor",
      text,
      timestamp: "Just now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    // Simulate Step 3 Guardrail Intent Classification & Grounded RAG responses
    setTimeout(() => {
      setIsTyping(false);
      const lower = text.toLowerCase();

      // Case 1: Off-Topic filter trigger (e.g. "poem", "joke", "hack", "python code", "homework")
      if (
        lower.includes("poem") ||
        lower.includes("sunflower") ||
        lower.includes("joke") ||
        lower.includes("homework") ||
        lower.includes("ignore")
      ) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `I'm designed strictly to assist with questions regarding ${settings.brandTitle}'s product features, setup, and account documentation. I cannot assist with general creative tasks or off-topic prompts.`,
          timestamp: "Just now",
          isOffTopic: true,
          metadata: {
            model: "llama-3.1-8b-instant (Step 3 Classifier)",
            latencyMs: 140,
            intentStatus: "OFF_TOPIC",
          },
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      // Case 2: Explicit human request or low confidence trigger
      if (
        lower.includes("human") ||
        lower.includes("person") ||
        lower.includes("operator") ||
        lower.includes("talk to")
      ) {
        setStatusState("WAITING_HUMAN");
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "system",
          text: `[Handoff Triggered] Connecting you to a live operator. A support specialist has been paged and will join momentarily.`,
          timestamp: "Just now",
          isHandoff: true,
          metadata: {
            model: "Handoff State Machine (ADR-0003)",
            intentStatus: "HANDOFF_ESCALATION",
          },
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      // Case 3: Grounded Answer for on-topic support query
      if (lower.includes("password") || lower.includes("reset") || lower.includes("login")) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `To reset your password, visit the login screen at /login and click "Forgot password?". Enter your account email, and we'll send a 6-digit one-time code to complete verification.`,
          timestamp: "Just now",
          confidenceScore: 0.94,
          metadata: {
            model: "llama-3.3-70b-versatile (Groq)",
            latencyMs: 380,
            intentStatus: "ON_TOPIC",
          },
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      if (lower.includes("rate") || lower.includes("limit") || lower.includes("api")) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: `Standard accounts have a limit of 120 API requests/minute. Production enterprise tiers support up to 2,000 requests/minute with dedicated burst capacity.`,
          timestamp: "Just now",
          confidenceScore: 0.88,
          metadata: {
            model: "llama-3.3-70b-versatile (Groq)",
            latencyMs: 410,
            intentStatus: "ON_TOPIC",
          },
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }

      // Default grounded answer
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `Thank you for reaching out! Based on our documentation for ${settings.brandTitle}, I've recorded your question and can guide you through our product features or connect you with the team.`,
        timestamp: "Just now",
        confidenceScore: 0.81,
        metadata: {
          model: "llama-3.3-70b-versatile (Groq)",
          latencyMs: 390,
          intentStatus: "ON_TOPIC",
        },
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 550);
  };

  const isDarkMode = settings.themeMode === "dark";

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Simulator top control bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Live Widget Simulator
          </span>
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
            Interactive
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Reset conversation session"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            Reset Chat
          </Button>
        </div>
      </div>

      {/* Simulator Canvas / Host Site Mockup with Browser Window Header */}
      <div className="relative flex-1 min-h-[580px] rounded-2xl border border-border bg-gradient-to-b from-muted/30 via-background to-muted/20 overflow-hidden shadow-inner flex flex-col justify-between">
        {/* Browser Mock Header */}
        <div className="px-4 py-2.5 border-b border-border/80 bg-muted/40 backdrop-blur-sm flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70 inline-block" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70 inline-block" />
            </div>
            <div className="ml-3 px-3 py-1 rounded-md bg-background/80 border border-border/60 text-[11px] font-mono text-muted-foreground flex items-center gap-1.5 max-w-[220px] truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              https://acme-store.com
            </div>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            Host Preview
          </span>
        </div>

        {/* Mock Host Website UI Background Elements */}
        <div className="p-6 pointer-events-none select-none opacity-40 space-y-4 max-w-md">
          <div className="h-4 w-32 rounded bg-muted-foreground/20" />
          <div className="h-7 w-64 rounded bg-muted-foreground/25" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-muted-foreground/15" />
            <div className="h-3 w-4/5 rounded bg-muted-foreground/15" />
            <div className="h-3 w-3/5 rounded bg-muted-foreground/15" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-8 w-24 rounded-lg bg-muted-foreground/20" />
            <div className="h-8 w-28 rounded-lg bg-muted-foreground/15" />
          </div>
        </div>

        {/* Floating Chat Widget Simulator (Positioned based on settings.position) */}
        <div
          className={cn(
            "relative z-20 flex flex-col p-4 md:p-6 mt-auto max-w-full transition-all duration-300",
            settings.position === "left" ? "items-start self-start" : "items-end self-end"
          )}
        >
          {isOpen ? (
            <div
              className={`w-[360px] max-w-[calc(100vw-2rem)] h-[490px] rounded-2xl border border-white/15 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-xl ${
                isDarkMode ? "bg-zinc-950/95 text-zinc-100" : "bg-card/95 text-card-foreground"
              }`}
            >
              {/* Widget Header with dynamic accent & Heyo mark */}
              <div
                className="px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-sm relative overflow-hidden"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {/* Subtle sheen highlight */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

                <div className="flex items-center gap-2.5 min-w-0 relative z-10">
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs shrink-0 ring-1 ring-white/30 overflow-hidden">
                    {settings.botAvatarType === "custom" && settings.customAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={settings.customAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : settings.botAvatarType === "glass" ? (
                      <div
                        className="h-full w-full rounded-full relative overflow-hidden"
                        style={{
                          background: "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)",
                        }}
                      >
                        <div className="absolute top-0.5 left-1 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                      </div>
                    ) : settings.botAvatarType === "sparkle" ? (
                      <span className="text-sm">✨</span>
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold leading-tight truncate flex items-center gap-1.5">
                      <span>{settings.brandTitle || "Heyo Support"}</span>
                      <span className="font-pixel text-[9px] uppercase tracking-wider px-1 py-0.2 rounded bg-black/30 text-white/90">
                        AI
                      </span>
                    </p>
                    <p className="text-[10px] text-white/80 leading-none truncate mt-0.5">
                      {statusState === "WAITING_HUMAN"
                        ? "Connecting to human..."
                        : settings.botDisplayName || "Heyo AI Agent"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 relative z-10">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-lg hover:bg-white/20 text-white cursor-pointer"
                    aria-label="Close widget"
                    title="Minimize chat widget"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Status banner */}
              {statusState === "WAITING_HUMAN" && (
                <div className="bg-amber-500/15 border-b border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Waiting for Human Operator
                  </span>
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/40 font-mono">
                    Handoff
                  </Badge>
                </div>
              )}

              {/* Widget Chat Message Feed with scoped ref */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs scroll-smooth">
                {messages.map((msg) => {
                  const isVisitor = msg.sender === "visitor";
                  const isSystem = msg.sender === "system";

                  if (isSystem) {
                    return (
                      <div
                        key={msg.id}
                        className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 text-center"
                      >
                        {msg.text}
                      </div>
                    );
                  }

                  const renderBotAvatar = () => {
                    if (settings.botAvatarType === "custom" && settings.customAvatarUrl) {
                      return (
                        <div className="h-6 w-6 rounded-full overflow-hidden shrink-0 border border-border/80 shadow-2xs mt-0.5">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={settings.customAvatarUrl} alt="Bot" className="h-full w-full object-cover" />
                        </div>
                      );
                    }
                    if (settings.botAvatarType === "glass") {
                      return (
                        <div
                          className="h-6 w-6 rounded-full relative overflow-hidden shrink-0 shadow-2xs mt-0.5"
                          style={{
                            background: "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)",
                          }}
                        >
                          <div className="absolute top-0.5 left-0.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                        </div>
                      );
                    }
                    if (settings.botAvatarType === "sparkle") {
                      return (
                        <div className="h-6 w-6 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          <span>✨</span>
                        </div>
                      );
                    }
                    return (
                      <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    );
                  };

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isVisitor ? "justify-end" : "justify-start items-start gap-2"}`}
                    >
                      {!isVisitor && renderBotAvatar()}

                      <div className={`flex flex-col ${isVisitor ? "items-end" : "items-start min-w-0"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed ${
                            isVisitor
                              ? "text-white"
                              : isDarkMode
                              ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60"
                              : "bg-muted/70 text-foreground border border-border"
                          }`}
                          style={isVisitor ? { backgroundColor: settings.primaryColor } : {}}
                        >
                          <p>{msg.text}</p>
                        </div>

                      {/* Bot response badge / Guardrail indicator */}
                      {!isVisitor && msg.metadata && (
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          {msg.isOffTopic ? (
                            <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium font-pixel">
                              <ShieldAlert className="h-3 w-3" />
                              FILTERED (OFF-TOPIC)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Sparkles className="h-3 w-3 text-emerald-500" />
                              <span className="font-pixel text-[9px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Grounded Answer
                              </span>
                              {msg.metadata.latencyMs && (
                                <span className="font-mono text-[9px] opacity-70">
                                  ({msg.metadata.latencyMs}ms)
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

                {/* Live typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/50 w-fit text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>

              {/* Sample Guardrail Quick Buttons */}
              <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0 uppercase font-pixel text-[9px]">
                  Test:
                </span>
                {SAMPLE_PROMPTS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(p.query)}
                    className="shrink-0 h-6 px-2 py-0 text-[10px] font-normal cursor-pointer"
                  >
                    {p.label}
                  </Button>
                ))}
              </div>

              {/* Chat Input & Footer */}
              <div className="p-3 border-t border-border bg-card/60">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Ask a question..."
                    className="flex-1 bg-background border border-input rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!inputVal.trim() || isTyping}
                    className="h-8 w-8 rounded-xl shrink-0 cursor-pointer"
                    style={{ backgroundColor: settings.primaryColor }}
                    aria-label="Send message"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </form>

                {settings.allowHumanEscalation && statusState !== "WAITING_HUMAN" && (
                  <div className="mt-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleSendMessage("Can I talk to a human operator?")}
                      className="text-[10px] text-muted-foreground hover:text-foreground transition underline underline-offset-2 cursor-pointer"
                    >
                      Talk to a human operator
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed Floating Pill/Launcher Toggle matching Emil Kowalski design guidelines */
            <Button
              type="button"
              onClick={() => setIsOpen(true)}
              className="gap-2.5 px-4 py-3 rounded-full text-white shadow-xl hover:opacity-95 h-auto cursor-pointer border border-white/20 backdrop-blur-md"
              style={{ backgroundColor: settings.primaryColor }}
            >
              {settings.botAvatarType === "custom" && settings.customAvatarUrl ? (
                <div className="h-5 w-5 rounded-full overflow-hidden border border-white/50 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.customAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                </div>
              ) : settings.botAvatarType === "glass" ? (
                <div
                  className="h-5 w-5 rounded-full relative overflow-hidden shrink-0 border border-white/30"
                  style={{
                    background: "radial-gradient(circle at 35% 25%, #60a5fa 0%, #2563eb 45%, #1e3a8a 80%, #0f172a 100%)",
                  }}
                >
                  <div className="absolute top-0.5 left-0.5 w-3/5 h-2/5 rounded-full bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                </div>
              ) : settings.botAvatarType === "sparkle" ? (
                <span className="text-sm">✨</span>
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              <span className="text-xs font-semibold">{settings.brandTitle || "Chat with us"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
