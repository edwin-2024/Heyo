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
import { VisitorAvatar } from "./VisitorAvatar";
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
}

export function ActiveThread({
  conversation,
  onSendMessage,
  onTakeOver,
  onResolve,
  onCloseThread,
  showInspector,
  onToggleInspector,
}: ActiveThreadProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of thread when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

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
    <div className="flex-1 flex flex-col h-full bg-neutral-50/50 dark:bg-neutral-950 overflow-hidden relative">
      {/* 1. Thread Header matching reference mockups with explicit Close button */}
      <div className="h-14 px-4 sm:px-5 border-b border-border flex items-center justify-between shrink-0 bg-white dark:bg-neutral-900 z-10 select-none">
        {/* Left: Visitor Name, Status pill, Location & Local time */}
        <div className="flex items-center gap-3 min-w-0">
          <VisitorAvatar
            seed={conversation.visitor.avatarSeed}
            name={conversation.visitor.name}
            isOnline={conversation.visitor.isOnline}
            size="md"
          />
          <div className="min-w-0">
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
            <p className="text-[11px] text-muted-foreground truncate">
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

            // If it's a greeting from AI (like in mockup 1 top right)
            if (isAi && msg.text.startsWith("Hello from this super friendly agent")) {
              return (
                <div key={msg.id} className="flex flex-col items-end gap-1 my-2">
                  <span className="text-[11px] text-neutral-400 font-medium pr-1">Greeting</span>
                  <div className="rounded-2xl rounded-tr-xs px-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-foreground shadow-xs">
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
                  <div className="self-start rounded-2xl rounded-tl-xs px-4 py-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-medium text-foreground shadow-xs max-w-xl">
                    {msg.text}
                  </div>
                )}

                {/* AI Reasoning card if present */}
                {isAi && msg.aiReasoning && (
                  <div className="w-full">
                    <AiReasoningCard reasoning={msg.aiReasoning} />
                  </div>
                )}

                {/* AI Answer Bubble matching mockup 1 (rounded bubble with citation footer) */}
                {isAi && (
                  <div className="relative">
                    <div className="rounded-2xl px-5 py-4 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs text-neutral-800 dark:text-neutral-100 leading-relaxed max-w-xl shadow-xs space-y-3">
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    {msg.citation && (
                      <div className="flex items-center justify-end gap-1.5 text-[11px] text-neutral-500 mt-1.5 pr-1">
                        <span>Answered from</span>
                        <span className="inline-flex items-center gap-1 font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                          <FileText className="h-3 w-3" />
                          {msg.citation.documentName}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Operator Response Bubble */}
                {isOperator && (
                  <div className="self-end rounded-2xl rounded-tr-xs px-4 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs leading-relaxed max-w-xl shadow-xs">
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* 3. Takeover Reply Bar matching reference mockup 1 */}
      <div className="p-4 border-t border-border bg-white dark:bg-neutral-900 shrink-0">
        <div className="relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950 p-2.5 focus-within:ring-2 focus-within:ring-neutral-400 focus-within:border-transparent transition-[box-shadow,border-color] duration-150 ease-out">
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Reply to the visitor..."
            className="w-full resize-none border-0 bg-transparent text-xs text-foreground p-1 focus-visible:ring-0 min-h-[50px] max-h-32 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 shadow-none"
          />

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200/50 dark:border-neutral-800/50">
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
              Sending a reply takes over from the agent.
            </span>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono hidden sm:inline">
                ⌘ Enter
              </span>
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-[background-color,transform,opacity] duration-150 ease-out shadow-xs cursor-pointer"
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
