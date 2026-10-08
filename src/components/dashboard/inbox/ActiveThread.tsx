"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  UserCheck,
  CheckCircle,
  PanelRightClose,
  PanelRightOpen,
  CornerDownLeft,
  Bot,
  User,
  Check,
  Sidebar,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { VisitorAvatar, ChatbotGlassAvatar } from "./VisitorAvatar";
import { AiReasoningCard } from "./AiReasoningCard";
import { ConversationItem } from "./types";
import { cn } from "@/lib/utils";

interface ActiveThreadProps {
  conversation: ConversationItem | null;
  onSendMessage: (conversationId: string, text: string) => void;
  onTakeOver: (conversationId: string) => void;
  onResolve: (conversationId: string) => void;
  onCloseThread: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  isVisitorTyping?: boolean;
  onOperatorTyping?: () => void;
}

export function ActiveThread({
  conversation,
  onSendMessage,
  onTakeOver,
  onResolve,
  onCloseThread,
  showInspector,
  onToggleInspector,
  isVisitorTyping = false,
  onOperatorTyping,
}: ActiveThreadProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isVisitorTyping]);

  // Keyboard shortcut: Esc closes/deselects active thread
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseThread();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onCloseThread]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full p-8 text-center bg-background text-muted-foreground select-none">
        <div className="h-14 w-14 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center text-muted-foreground mb-4 shadow-xs">
          <Bot className="h-7 w-7 text-neutral-400 dark:text-neutral-500" />
        </div>
        <h3 className="text-sm font-bold text-foreground tracking-tight">No conversation selected</h3>
        <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">
          Select a visitor from the list to view chat history, examine vector retrieval scores, or take over with live operator support.
        </p>
        <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">
            ↑
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-muted/50 font-mono text-[10px]">
            ↓
          </kbd>
          <span>to navigate list</span>
        </div>
      </div>
    );
  }

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(conversation.id, inputText.trim());
    setInputText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const isClosed = conversation.status === "CLOSED";

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* 1. Thread Header matching reference mockups with explicit Close button */}
      <div className="h-16 px-4 sm:px-6 border-b border-border flex items-center justify-between shrink-0 bg-card/80 backdrop-blur-md z-10 select-none">
        {/* Left: Visitor Name, Status pill, Location & Local time */}
        <div className="flex items-center gap-3.5 min-w-0">
          <VisitorAvatar
            seed={conversation.visitor.avatarSeed}
            name={conversation.visitor.name}
            isOnline={conversation.visitor.isOnline}
            size="md"
          />
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground truncate">
                {conversation.visitor.name}
              </h3>
              <Badge
                variant={
                  conversation.status === "WAITING_HUMAN"
                    ? "waiting"
                    : conversation.status === "HUMAN_ACTIVE"
                    ? "operator"
                    : conversation.status === "CLOSED"
                    ? "closed"
                    : "agent"
                }
                className="text-[10px] px-2 py-0.5 rounded-full"
              >
                {conversation.status === "WAITING_HUMAN"
                  ? "Waiting"
                  : conversation.status === "HUMAN_ACTIVE"
                  ? "You (Active)"
                  : conversation.status === "CLOSED"
                  ? "Closed"
                  : "Agent"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate font-mono">
              {conversation.visitor.location} · {conversation.visitor.localTime}
            </p>
          </div>
        </div>

        {/* Right: Actions (Takeover, Resolve, Inspector Toggle, and Close/Deselect) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {conversation.status === "WAITING_HUMAN" && (
            <Button
              size="sm"
              onClick={() => onTakeOver(conversation.id)}
              className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1.5"
              title="Take over conversation"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Take over</span>
            </Button>
          )}

          {conversation.status !== "CLOSED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onResolve(conversation.id)}
              className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1.5 bg-muted/50 hover:bg-muted"
              title="Mark conversation as resolved"
            >
              <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden md:inline">Resolve</span>
            </Button>
          )}

          <Button
            variant="iconRound"
            size="icon"
            onClick={onToggleInspector}
            title={showInspector ? "Hide visitor details panel" : "Show visitor details panel"}
          >
            <Sidebar className="h-4 w-4" />
          </Button>

          {/* Close/Deselect thread button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onCloseThread}
            className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1 ml-1"
            title="Close this chat (Esc)"
          >
            <span className="hidden sm:inline">Close</span>
            <kbd className="hidden lg:inline text-[10px] font-mono text-muted-foreground/80 px-1 py-0.2 rounded bg-muted/60 border border-border">
              Esc
            </kbd>
          </Button>
        </div>
      </div>

      {/* 2. Messages Scroll Area */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {conversation.messages.map((msg) => {
            if (msg.sender === "system") {
              return (
                <div key={msg.id} className="flex justify-center my-3">
                  <div className="px-3.5 py-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] text-muted-foreground text-center">
                    {msg.text}
                  </div>
                </div>
              );
            }

            const isVisitor = msg.sender === "visitor";
            const isAi = msg.sender === "ai";
            const isOperator = msg.sender === "operator";

            // If it's a greeting from AI (matching reference image top right)
            if (isAi && msg.text.startsWith("Hello from this super friendly agent")) {
              return (
                <div key={msg.id} className="flex flex-col items-end gap-1 my-2">
                  <span className="text-[11px] text-muted-foreground font-medium pr-1">Greeting</span>
                  <div className="rounded-2xl rounded-tr-xs px-4 py-2.5 bg-card border border-border text-xs text-foreground shadow-xs">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className="flex flex-col gap-1.5 my-3">
                {/* Message Header with avatar and relative timestamp */}
                {isVisitor && (
                  <div className="flex items-center gap-2">
                    <VisitorAvatar
                      seed={conversation.visitor.avatarSeed}
                      name={conversation.visitor.name}
                      size="sm"
                    />
                    <span className="text-xs font-bold text-foreground">
                      {conversation.visitor.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {msg.createdAt}
                    </span>
                  </div>
                )}

                {isAi && (
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{msg.createdAt}</span>
                    <span className="font-semibold text-foreground">{msg.senderName}</span>
                  </div>
                )}

                {isOperator && (
                  <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      You (Operator)
                    </span>
                    <span>· {msg.createdAt}</span>
                  </div>
                )}

                {/* Visitor question pill matching mockup 1 (clean bubble with rounded pill shape) */}
                {isVisitor && (
                  <div className="self-start rounded-2xl rounded-tl-xs px-4 py-3 bg-card border border-border text-sm font-medium text-foreground shadow-xs max-w-xl">
                    {msg.text}
                  </div>
                )}

                {/* AI Reasoning card if present */}
                {isAi && msg.aiReasoning && (
                  <div className="w-full">
                    <AiReasoningCard reasoning={msg.aiReasoning} />
                  </div>
                )}

                {/* AI Answer Bubble matching reference image (rounded bubble with ChatbotGlassAvatar) */}
                {isAi && (
                  <div className="relative flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="rounded-2xl px-5 py-4 bg-muted/60 dark:bg-card border border-border text-xs text-foreground leading-relaxed shadow-xs space-y-3">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {msg.citation && (
                        <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground mt-1.5 pr-1">
                          <span>Answered from</span>
                          <span className="inline-flex items-center gap-1 font-mono text-foreground font-medium">
                            <FileText className="h-3 w-3 text-primary" />
                            {msg.citation.documentName}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chatbot Glass 3D Avatar Orb on the right (matching reference image) */}
                    <ChatbotGlassAvatar size="md" className="mt-1 shrink-0" />
                  </div>
                )}

                {/* Operator Response Bubble */}
                {isOperator && (
                  <div className="self-end rounded-2xl rounded-tr-xs px-4 py-3 bg-primary text-primary-foreground text-xs leading-relaxed max-w-xl shadow-xs">
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })}

          {/* Visitor Typing Indicator */}
          {isVisitorTyping && (
            <div className="flex items-center gap-2.5 py-1.5 animate-in fade-in">
              <VisitorAvatar
                seed={conversation.visitor.avatarSeed}
                name={conversation.visitor.name}
                size="sm"
              />
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl rounded-bl-xs bg-muted/60 border border-border/70 text-foreground text-xs shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                <span className="text-[11px] text-muted-foreground ml-1 font-medium">
                  {conversation.visitor.name} is typing...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 3. Takeover Reply Bar matching reference mockup 1 */}
      <div className="p-4 border-t border-border bg-card/80 backdrop-blur-md shrink-0">
        <div className="relative rounded-2xl border border-border bg-background p-3 focus-within:ring-2 focus-within:ring-ring focus-within:border-transparent transition-all shadow-xs">
          <Textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              onOperatorTyping?.();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Reply to the visitor..."
            className="w-full resize-none border-0 bg-transparent text-xs text-foreground p-1 focus-visible:ring-0 min-h-[50px] max-h-32 placeholder:text-muted-foreground shadow-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground">
              Sending a reply takes over from the agent.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground font-mono hidden sm:inline">
                ⌘ Enter
              </span>
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all shadow-xs cursor-pointer"
              >
                <span>Send</span>
                <Send className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
