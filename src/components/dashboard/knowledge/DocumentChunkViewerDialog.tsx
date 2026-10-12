"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Search,
  Copy,
  Check,
  Layers,
  FileText,
  AlertCircle,
  Hash,
  Clock,
  HardDrive,
} from "lucide-react";
import { orpc } from "@/lib/orpc";
import { FileTypeIcon } from "./FileTypeIcon";
import { cn } from "@/lib/utils";

interface DocumentChunkViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  documentId?: string;
  fileName?: string;
}

interface ChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  createdAt: string | Date;
}

interface DocumentMeta {
  id: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  status: string;
  chunksCount: number;
  createdAt: string | Date;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentChunkViewerDialog({
  open,
  onOpenChange,
  workspaceId,
  documentId,
  fileName,
}: DocumentChunkViewerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docMeta, setDocMeta] = useState<DocumentMeta | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedChunkId, setCopiedChunkId] = useState<string | null>(null);

  // Fetch document & chunks when dialog opens with a valid documentId or fileName
  useEffect(() => {
    if (!open || (!documentId && !fileName) || !workspaceId) {
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);
    setSearchQuery("");

    orpc.document
      .getDocumentChunks({
        workspaceId,
        documentId: documentId || undefined,
        fileName: fileName || undefined,
      })
      .then((res) => {
        if (!isMounted) return;
        setDocMeta(res.document);
        setChunks(res.chunks);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load document chunks:", err);
        setError(err.message || "Could not retrieve document chunks.");
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, workspaceId, documentId, fileName]);

  const handleCopyChunk = async (chunkId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedChunkId(chunkId);
      setTimeout(() => setCopiedChunkId(null), 2000);
    } catch {
      // ignore
    }
  };

  // Filter chunks by keyword query
  const filteredChunks = useMemo(() => {
    if (!searchQuery.trim()) return chunks;
    const q = searchQuery.toLowerCase();
    return chunks.filter(
      (c) =>
        c.content.toLowerCase().includes(q) ||
        `chunk ${c.chunkIndex + 1}`.toLowerCase().includes(q)
    );
  }, [chunks, searchQuery]);

  const totalTokens = useMemo(() => {
    return chunks.reduce((acc, c) => acc + (c.tokenCount || 0), 0);
  }, [chunks]);

  const displayFileName = docMeta?.fileName || fileName || "Document Chunks";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 border-b border-border shrink-0 bg-muted/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <FileTypeIcon
                fileName={displayFileName}
                contentType={docMeta?.contentType}
                size="lg"
              />
              <div className="min-w-0 space-y-1">
                <DialogTitle className="text-base font-bold tracking-tight truncate flex items-center gap-2">
                  <span className="truncate" title={displayFileName}>
                    {displayFileName}
                  </span>
                  {docMeta?.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono uppercase px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shrink-0"
                    >
                      {docMeta.status}
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap font-mono">
                  {docMeta?.fileSize ? (
                    <span className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatBytes(docMeta.fileSize)}
                    </span>
                  ) : null}
                  <span>•</span>
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <Layers className="h-3 w-3" />
                    {chunks.length} chunks
                  </span>
                  {totalTokens > 0 && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {totalTokens.toLocaleString()} tokens total
                      </span>
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="mt-4 relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search passage content across indexed chunks..."
              className="pl-8 h-8 text-xs bg-background/80 border-border focus-visible:ring-1"
            />
            {searchQuery && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground">
                {filteredChunks.length} of {chunks.length} matching
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-5 bg-background/50">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
              <p className="text-xs font-medium">Loading document chunks & vector metadata...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-center">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 max-w-sm">
                {error}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  orpc.document
                    .getDocumentChunks({
                      workspaceId,
                      documentId: documentId || undefined,
                      fileName: fileName || undefined,
                    })
                    .then((res) => {
                      setDocMeta(res.document);
                      setChunks(res.chunks);
                    })
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
                className="text-xs h-7"
              >
                Retry
              </Button>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Layers className="h-8 w-8 opacity-40 mb-2" />
              <p className="text-xs font-medium text-foreground">
                {searchQuery ? "No matching chunks found" : "No indexed chunks found"}
              </p>
              <p className="text-[11px] mt-1 max-w-xs">
                {searchQuery
                  ? "Try searching for a different keyword or clear the search input."
                  : "This document does not have any segmented chunks yet."}
              </p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-3.5 overscroll-contain">
              {filteredChunks.map((chunk) => {
                const isCopied = copiedChunkId === chunk.id;
                return (
                  <div
                    key={chunk.id}
                    className="rounded-xl border border-border bg-card p-3.5 shadow-2xs space-y-2 hover:border-primary/40 transition-colors"
                  >
                    {/* Chunk Header */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
                        >
                          Chunk #{chunk.chunkIndex + 1}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {chunk.tokenCount} tokens
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <TooltipProvider delayDuration={120}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyChunk(chunk.id, chunk.content)}
                                className="h-6 w-6 text-muted-foreground hover:text-foreground active:scale-[0.96] transition-transform cursor-pointer"
                                aria-label="Copy chunk content"
                              >
                                {isCopied ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {isCopied ? "Copied!" : "Copy passage text"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Chunk Passage Content */}
                    <div className="rounded-lg bg-muted/40 dark:bg-zinc-950/60 p-3 text-xs leading-relaxed text-foreground font-mono whitespace-pre-wrap select-text border border-border/50">
                      {chunk.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
