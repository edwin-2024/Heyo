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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileTypeIcon } from "@/components/dashboard/knowledge/FileTypeIcon";
import { DocumentChunkViewerDialog } from "@/components/dashboard/knowledge/DocumentChunkViewerDialog";
import { VisitorAvatar, ChatbotGlassAvatar } from "./VisitorAvatar";
import { AiReasoningCard } from "./AiReasoningCard";
import { ConversationItem } from "./types";
import { cn } from "@/lib/utils";

interface ActiveThreadProps {
  conversation: ConversationItem | null;
  workspaceId?: string;
  onSendMessage: (conversationId: string, text: string) => void;
  onTakeOver: (conversationId: string) => void;
  onResolve: (conversationId: string) => void;
  onCloseThread: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  isVisitorTyping?: boolean;
  onOperatorTyping?: () => void;
  onToggleAgent?: (conversationId: string, enabled: boolean) => void;
}

export function ActiveThread({
  conversation,
  workspaceId,
  onSendMessage,
  onTakeOver,
  onResolve,
  onCloseThread,
  showInspector,
  onToggleInspector,
  isVisitorTyping = false,
  onOperatorTyping,
  onToggleAgent,
}: ActiveThreadProps) {
  const [inputText, setInputText] = useState("");
  const [viewerTarget, setViewerTarget] = useState<{ id?: string; fileName?: string } | null>(null);
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

        {/* Right: Actions (AI Toggle, Takeover, Resolve, Inspector Toggle, and Deselect) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <TooltipProvider delayDuration={150}>
            {/* AI Agent Toggle Button */}
            {conversation.status !== "CLOSED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => onToggleAgent?.(conversation.id, conversation.status !== "AI_ANSWERING")}
                    className={cn(
                      "h-8 px-2.5 rounded-lg text-xs font-medium gap-1.5 transition-colors cursor-pointer",
                      conversation.status === "AI_ANSWERING"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                        : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">
                      Agent: {conversation.status === "AI_ANSWERING" ? "ON" : "OFF"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {conversation.status === "AI_ANSWERING"
                    ? "Pause autonomous AI agent"
                    : "Resume autonomous AI agent"}
                </TooltipContent>
              </Tooltip>
            )}

            {/* Take Over Button */}
            {conversation.status === "WAITING_HUMAN" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={() => onTakeOver(conversation.id)}
                    className="h-8 px-2.5 rounded-lg text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Take over</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Take over conversation as live operator</TooltipContent>
              </Tooltip>
            )}

            {/* Resolve Button */}
            {conversation.status !== "CLOSED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onResolve(conversation.id)}
                    className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1.5 bg-muted/50 hover:bg-muted cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden md:inline">Resolve</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Mark conversation as resolved</TooltipContent>
              </Tooltip>
            )}

            {/* Visitor Details Inspector Toggle Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="iconRound"
                  size="icon"
                  onClick={onToggleInspector}
                  className="cursor-pointer"
                  aria-label="Toggle visitor details panel"
                >
                  <Sidebar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {showInspector ? "Hide visitor details panel" : "Show visitor details panel"}
              </TooltipContent>
            </Tooltip>

            {/* Deselect Thread Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCloseThread}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium gap-1 ml-1 cursor-pointer"
                >
                  <span className="hidden sm:inline">Deselect</span>
                  <kbd className="hidden lg:inline text-[10px] font-mono text-muted-foreground/80 px-1 py-0.2 rounded bg-muted/60 border border-border">
                    Esc
                  </kbd>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Deselect active thread (Esc)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
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

                {/* AI Answer Bubble with distinct border, high contrast, and Grounding Sources */}
                {isAi && (() => {
                  const rawSources =
                    msg.metadata?.sources ||
                    (msg.metadata?.retrievedChunks
                      ? msg.metadata.retrievedChunks
                          .filter((c: any) => c.status === "USED" || c.similarity >= 0.5)
                          .map((c: any) => ({
                            documentId: c.documentId,
                            documentName: c.documentName,
                            similarity: Math.round(c.similarity * 100),
                            snippet: c.excerpt,
                          }))
                      : []) ||
                    (msg.citation ? [{ documentName: msg.citation.documentName, similarity: msg.citation.similarity ? Math.round(msg.citation.similarity * 100) : undefined }] : []);

                  // Deduplicate sources by document, displaying highest match percentage per file
                  const sourcesMap = new Map<string, any>();
                  for (const s of (rawSources as any[])) {
                    const key = s.documentName || s.documentId || "doc";
                    const existing = sourcesMap.get(key);
                    if (!existing || (s.similarity ?? 0) > (existing.similarity ?? 0)) {
                      sourcesMap.set(key, s);
                    }
                  }
                  const sources = Array.from(sourcesMap.values());

                  return (
                    <div className="relative flex items-start gap-3 my-1">
                      <div className="flex-1 space-y-2">
                        {/* High-contrast AI container with distinct border styling */}
                        <div className="rounded-2xl px-5 py-4 bg-indigo-500/[0.04] dark:bg-zinc-900 border-2 border-indigo-500/40 dark:border-indigo-500/50 text-xs text-foreground leading-relaxed shadow-xs space-y-3">
                          {/* AI Agent Header badge */}
                          <div className="flex items-center justify-between pb-2 border-b border-indigo-500/15 dark:border-indigo-500/25">
                            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-indigo-600 dark:text-indigo-400">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                              <span>Heyo AI Agent</span>
                              <span className="font-normal opacity-70 text-[10px]">· Grounded Synthesis</span>
                            </div>
                            <span className="text-[10px] font-mono text-muted-foreground">{msg.createdAt}</span>
                          </div>

                          <p className="whitespace-pre-wrap leading-relaxed text-foreground">{msg.text}</p>

                          {/* Grounding Sources used in this answer */}
                          {sources.length > 0 && (
                            <div className="pt-2.5 mt-2 border-t border-indigo-500/15 dark:border-indigo-500/25 space-y-1.5">
                              <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                                <FileText className="h-3 w-3 text-indigo-500 shrink-0" />
                                <span>Grounding Sources ({sources.length} document{sources.length > 1 ? "s" : ""}):</span>
                              </div>
                              <div className="flex items-center flex-wrap gap-1.5">
                                {sources.map((src: any, idx: number) => (
                                  <TooltipProvider key={idx} delayDuration={150}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setViewerTarget({
                                              id: src.documentId,
                                              fileName: src.documentName,
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-950/50 border border-indigo-500/30 hover:border-indigo-500/70 hover:bg-indigo-500/20 active:scale-[0.97] transition-colors text-[11px] text-foreground font-mono cursor-pointer group"
                                        >
                                          <FileTypeIcon fileName={src.documentName} size="sm" />
                                          <span className="font-semibold text-foreground truncate max-w-[200px] group-hover:underline">
                                            {src.documentName}
                                          </span>
                                          {src.similarity !== undefined && (
                                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                              {src.similarity}% match
                                            </span>
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-xs text-xs">
                                        <p className="font-semibold">Click to inspect chunks for {src.documentName}</p>
                                        {src.snippet && (
                                          <p className="text-[10px] opacity-80 mt-1 line-clamp-2">"{src.snippet}..."</p>
                                        )}
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Chatbot Glass 3D Avatar Orb on the right */}
                      <ChatbotGlassAvatar size="md" className="mt-1 shrink-0" />
                    </div>
                  );
                })()}

                {/* Operator Response Bubble (Differentiated clearly with human header and accent) */}
                {isOperator && (
                  <div className="flex flex-col items-end gap-1 my-1">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 pr-1">
                      <User className="h-3 w-3" />
                      <span>You (Operator Response) · {msg.createdAt}</span>
                    </div>
                    <div className="self-end rounded-2xl rounded-tr-xs px-4 py-3 bg-primary text-primary-foreground text-xs leading-relaxed max-w-xl shadow-xs border border-primary/20">
                      {msg.text}
                    </div>
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

      {/* Document Chunk Viewer Modal */}
      {workspaceId && (
        <DocumentChunkViewerDialog
          open={!!viewerTarget}
          onOpenChange={(open) => {
            if (!open) setViewerTarget(null);
          }}
          workspaceId={workspaceId}
          documentId={viewerTarget?.id}
          fileName={viewerTarget?.fileName}
        />
      )}
    </div>
  );
}
