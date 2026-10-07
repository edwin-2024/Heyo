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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-muted-foreground">
            Mocked Edge
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

      {/* Simulator Canvas / Host Site Mockup */}
      <div className="relative flex-1 min-h-[580px] rounded-2xl border border-border bg-gradient-to-b from-muted/30 via-background to-muted/20 overflow-hidden shadow-inner p-4 md:p-6 flex flex-col justify-between">
        {/* Mock Host Website UI Background Elements */}
        <div className="pointer-events-none select-none opacity-40 space-y-4 max-w-md">
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

        {/* Floating Chat Widget Simulator (Right Column bottom) */}
        <div className="relative z-20 flex flex-col items-end self-end mt-auto max-w-full">
          {isOpen ? (
            <div
              className={`w-[360px] max-w-[calc(100vw-2rem)] h-[490px] rounded-2xl border border-border shadow-2xl flex flex-col overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
                isDarkMode ? "bg-zinc-950 text-zinc-100" : "bg-card text-card-foreground"
              }`}
            >
              {/* Widget Header with dynamic accent */}
              <div
                className="px-4 py-3 flex items-center justify-between text-white shrink-0 shadow-sm"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold leading-tight truncate">
                      {settings.brandTitle || "Heyo Support"}
                    </p>
                    <p className="text-[10px] text-white/80 leading-none truncate mt-0.5">
                      {statusState === "WAITING_HUMAN"
                        ? "Connecting to human..."
                        : settings.botDisplayName || "Heyo AI Agent"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-7 w-7 rounded-lg hover:bg-white/20 text-white"
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
                  <Badge variant="outline" className="text-[9px] py-0 px-1 border-amber-500/40">
                    Handoff
                  </Badge>
                </div>
              )}

              {/* Widget Chat Message Feed */}
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
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

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isVisitor ? "items-end" : "items-start"}`}
                    >
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
                            <span className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                              <ShieldAlert className="h-3 w-3" />
                              Step 3 Filtered (Off-Topic)
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Sparkles className="h-3 w-3 text-emerald-500" />
                              <span>Grounded Answer</span>
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

                <div ref={messagesEndRef} />
              </div>

              {/* Sample Guardrail Quick Buttons */}
              <div className="px-3 py-1.5 border-t border-border/60 bg-muted/20 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                <span className="text-[10px] font-semibold text-muted-foreground shrink-0 uppercase">
                  Test:
                </span>
                {SAMPLE_PROMPTS.map((p) => (
                  <Button
                    key={p.label}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage(p.query)}
                    className="shrink-0 h-6 px-2 py-0 text-[10px] font-normal"
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
                    className="h-8 w-8 rounded-xl shrink-0"
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
              className="gap-2.5 px-4 py-3 rounded-full text-white shadow-xl hover:opacity-95 h-auto cursor-pointer"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs font-semibold">{settings.brandTitle || "Chat with us"}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
