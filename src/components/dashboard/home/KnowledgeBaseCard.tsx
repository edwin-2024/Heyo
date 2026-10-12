"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  FileCode,
  UploadCloud,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  BookOpen,
  X,
  AlertCircle,
  FileUp,
  Layers,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FileTypeIcon } from "@/components/dashboard/knowledge/FileTypeIcon";
import { DocumentChunkViewerDialog } from "@/components/dashboard/knowledge/DocumentChunkViewerDialog";
import { cn } from "@/lib/utils";
import { orpc } from "@/lib/orpc";

export type DocumentStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface KnowledgeDocument {
  id: string;
  workspaceId: string;
  fileName: string;
  storagePath?: string;
  fileSize: number;
  contentType: string;
  status: DocumentStatus;
  chunksCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface KnowledgeBaseCardProps {
  workspaceId: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ["pdf", "md", "txt"];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateValue: string | Date | undefined): string {
  if (!dateValue) return "Just now";
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return "Just now";

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }

    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

function getFileTypeDetails(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return {
        label: "PDF",
        icon: FileText,
        badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      };
    case "md":
      return {
        label: "MD",
        icon: FileCode,
        badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      };
    case "txt":
      return {
        label: "TXT",
        icon: FileText,
        badgeClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
      };
    default:
      return {
        label: "DOC",
        icon: FileText,
        badgeClass: "bg-muted text-muted-foreground border-border",
      };
  }
}

function resolveContentType(file: File): string {
  if (file.type && file.type.trim().length > 0) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "md") return "text/markdown";
  if (ext === "txt") return "text/plain";
  return "text/plain";
}

export function KnowledgeBaseCard({ workspaceId }: KnowledgeBaseCardProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewerTarget, setViewerTarget] = useState<{ id?: string; fileName?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);

  // 1. Fetch documents from Neon Postgres DB
  const fetchDocuments = useCallback(
    async (showLoader = false) => {
      if (!workspaceId) return;
      if (showLoader) setIsLoading(true);

      try {
        const remoteDocs = await orpc.document.listDocuments({ workspaceId });
        if (Array.isArray(remoteDocs)) {
          setDocuments((prev) => {
            // Preserve any active in-flight local uploads not yet acknowledged on the server
            const localPending = prev.filter(
              (p) =>
                p.status === "UPLOADING" &&
                !remoteDocs.some((r) => r.id === p.id || r.fileName === p.fileName)
            );
            return [...localPending, ...remoteDocs];
          });
        }
      } catch (err) {
        console.warn("Could not fetch knowledge documents:", err);
      } finally {
        if (showLoader) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [workspaceId]
  );

  // Initial load
  useEffect(() => {
    fetchDocuments(true);
  }, [fetchDocuments]);

  // 2. Polling: When any document has status UPLOADING or PROCESSING, poll listDocuments every 2.5s
  const hasPendingDocuments = documents.some(
    (d) => d.status === "UPLOADING" || d.status === "PROCESSING"
  );

  useEffect(() => {
    if (!hasPendingDocuments || !workspaceId) return;

    const interval = setInterval(() => {
      fetchDocuments(false);
    }, 2500);

    return () => clearInterval(interval);
  }, [hasPendingDocuments, workspaceId, fetchDocuments]);

  // 3. Upload & Ingestion Pipeline
  const uploadSingleFile = async (file: File) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const optimisticDoc: KnowledgeDocument = {
      id: tempId,
      workspaceId,
      fileName: file.name,
      fileSize: file.size,
      contentType: resolveContentType(file),
      status: "UPLOADING",
      chunksCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically add to UI list immediately
    setDocuments((prev) => [optimisticDoc, ...prev]);

    try {
      // a. Request presigned upload URL from Neon backend
      const presign = await orpc.document.getUploadUrl({
        workspaceId,
        fileName: file.name,
        contentType: resolveContentType(file),
        fileSize: file.size,
      });

      if (!presign?.uploadUrl || !presign?.documentId) {
        throw new Error("Failed to acquire presigned storage URL.");
      }

      // Map optimistic temp id to real document id
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempId ? { ...d, id: presign.documentId, status: "UPLOADING" } : d
        )
      );

      // b. Direct client upload to Neon Object Storage / S3
      const uploadRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": resolveContentType(file),
        },
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload to storage failed with status ${uploadRes.status}`);
      }

      // c. Ingestion transition: update status to PROCESSING
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === presign.documentId || d.id === tempId
            ? { ...d, id: presign.documentId, status: "PROCESSING" }
            : d
        )
      );

      // d. Trigger autonomous ingestion (token chunking & 384d vector embedding)
      await orpc.document.ingest({
        workspaceId,
        documentId: presign.documentId,
      });

      // Refresh list to pick up updated DB state
      await fetchDocuments(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`Failed to ingest ${file.name}:`, err);
      setErrorMessage(`Failed to upload "${file.name}": ${errorMsg}`);
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === tempId || d.fileName === file.name ? { ...d, status: "FAILED" } : d
        )
      );
    }
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const validFiles: File[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMessage(
          `Invalid file format for "${file.name}". Only .pdf, .md, and .txt files are supported.`
        );
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(
          `File "${file.name}" exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`
        );
        continue;
      }

      validFiles.push(file);
    }

    // Process valid uploads sequentially
    for (const file of validFiles) {
      await uploadSingleFile(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset input value so re-selecting the same file triggers change
      e.target.value = "";
    }
  };

  // Drag and Drop handlers with counter to prevent child leave flicker
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // 4. Delete document
  const handleDelete = async (documentId: string) => {
    try {
      setDeletingId(documentId);
      await orpc.document.deleteDocument({
        workspaceId,
        documentId,
      });

      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
      setDeleteConfirmId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to delete document:", err);
      setErrorMessage(`Failed to delete document: ${errorMsg}`);
    } finally {
      setDeletingId(null);
    }
  };

  const totalChunks = documents.reduce((sum, d) => sum + (d.chunksCount || 0), 0);
  const readyCount = documents.filter((d) => d.status === "READY").length;

  return (
    <Card className="rounded-2xl border-border bg-card/80 backdrop-blur-sm shadow-xs overflow-hidden">
      {/* 1. Modern Header */}
      <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Knowledge Base & Documents
              </CardTitle>
              <CardDescription className="text-xs">
                Upload product documentation, FAQs, and guides (.pdf, .md, .txt up to 10MB). Heyo AI chunks and indexes passages for instant, guardrailed support answers.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className="text-[10px] font-mono py-0.5 px-2 bg-background border-border hidden sm:inline-flex"
            >
              vector(384)
            </Badge>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Refresh document status"
              aria-label="Refresh knowledge base documents"
              onClick={() => {
                setIsRefreshing(true);
                fetchDocuments(false);
              }}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", (isRefreshing || hasPendingDocuments) && "animate-spin")}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start justify-between p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-destructive/70 hover:text-destructive shrink-0 cursor-pointer p-0.5"
              aria-label="Dismiss error message"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 2. Drag & Drop File Dropzone */}
        <div
          role="button"
          tabIndex={0}
          aria-label="Drag and drop documents or click to browse"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative group border-2 border-dashed transition-all rounded-xl p-6 text-center cursor-pointer select-none",
            isDragging
              ? "border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.005]"
              : "border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.md,.txt,text/plain,text/markdown,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
            <div
              className={cn(
                "h-10 w-10 rounded-xl bg-card border border-border flex items-center justify-center transition-all shadow-xs",
                isDragging
                  ? "text-primary scale-110"
                  : "text-muted-foreground group-hover:scale-105 group-hover:text-primary"
              )}
            >
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">
                {isDragging ? "Drop files to upload" : "Click or drag documents to upload"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Supports <span className="font-mono text-foreground">.pdf</span>,{" "}
                <span className="font-mono text-foreground">.md</span>,{" "}
                <span className="font-mono text-foreground">.txt</span> up to 10MB each
              </p>
            </div>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Auto-chunked (500 tokens) · Neon Object Storage presigned sync</span>
            </div>
          </div>
        </div>

        {/* 3. Document List & Status Section */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Loading indexed documents...</span>
          </div>
        ) : documents.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-7 px-4 rounded-xl border border-dashed border-border/80 bg-muted/10 text-center space-y-2.5">
            <div className="h-10 w-10 rounded-xl bg-muted/60 text-muted-foreground flex items-center justify-center shadow-xs">
              <BookOpen className="h-5 w-5 stroke-[1.75]" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h4 className="text-xs font-semibold text-foreground">No documents indexed yet</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Upload your knowledge base documentation to enable autonomous AI support.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs gap-1.5 mt-1 border-primary/30 hover:border-primary/60 hover:bg-primary/5 text-primary cursor-pointer"
            >
              <FileUp className="h-3 w-3" />
              <span>Browse Documentation</span>
            </Button>
          </div>
        ) : (
          /* Document List / Table */
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-medium text-foreground px-0.5">
              <div className="flex items-center gap-1.5">
                <span>Indexed Documents</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  ({documents.length} active)
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
                <span>
                  {readyCount} of {documents.length} ready
                </span>
                {totalChunks > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-primary font-medium">{totalChunks} chunks</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              {documents.map((doc) => {
                const isConfirming = deleteConfirmId === doc.id;
                const isDeleting = deletingId === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-card border border-border/80 hover:border-border transition-all shadow-xs gap-3 group"
                  >
                    {/* Left: Distinct File Icon + File details */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => setViewerTarget({ id: doc.id, fileName: doc.fileName })}
                        className="cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
                        title="Click to view chunks"
                      >
                        <FileTypeIcon
                          fileName={doc.fileName}
                          contentType={doc.contentType}
                          size="md"
                        />
                      </button>

                      <div className="min-w-0 flex-1 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setViewerTarget({ id: doc.id, fileName: doc.fileName })}
                          className="font-medium text-xs text-foreground truncate hover:text-primary transition-colors text-left cursor-pointer flex items-center gap-1 group/name max-w-full"
                          title={`Click to view document chunks for ${doc.fileName}`}
                        >
                          <span className="truncate group-hover/name:underline">{doc.fileName}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground flex-wrap font-mono">
                          <span>{formatBytes(doc.fileSize)}</span>
                          <span>•</span>
                          <span>{formatDate(doc.createdAt)}</span>
                          {doc.chunksCount > 0 && (
                            <>
                              <span>•</span>
                              <button
                                type="button"
                                onClick={() => setViewerTarget({ id: doc.id, fileName: doc.fileName })}
                                className="text-primary font-semibold hover:underline cursor-pointer"
                              >
                                {doc.chunksCount} chunks
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge & Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Status Badge */}
                      {doc.status === "UPLOADING" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-sky-600 dark:text-sky-400 border-sky-500/30 bg-sky-500/10 flex items-center gap-1 font-medium"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Uploading...</span>
                        </Badge>
                      )}

                      {doc.status === "PROCESSING" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 flex items-center gap-1 font-medium"
                        >
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Indexing...</span>
                        </Badge>
                      )}

                      {doc.status === "READY" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1 font-medium"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Ready</span>
                        </Badge>
                      )}

                      {doc.status === "FAILED" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center gap-1 font-medium"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          <span>Failed</span>
                        </Badge>
                      )}

                      {/* View Chunks Button */}
                      <TooltipProvider delayDuration={150}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              onClick={() => setViewerTarget({ id: doc.id, fileName: doc.fileName })}
                              disabled={doc.status === "UPLOADING"}
                              aria-label={`View chunks for ${doc.fileName}`}
                            >
                              <Layers className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">View document chunks & passages</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {/* Delete Action */}
                      {isConfirming ? (
                        <div className="flex items-center gap-1 animate-in fade-in">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-6 px-2 text-[10px] font-semibold cursor-pointer"
                            onClick={() => handleDelete(doc.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Delete?"
                            )}
                          </Button>
                          <TooltipProvider delayDuration={150}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => setDeleteConfirmId(null)}
                                  aria-label="Cancel deletion"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top">Cancel</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ) : (
                        <TooltipProvider delayDuration={150}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                onClick={() => setDeleteConfirmId(doc.id)}
                                disabled={isDeleting || doc.status === "UPLOADING"}
                                aria-label={`Delete ${doc.fileName}`}
                              >
                                {isDeleting ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete document & vector chunks</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>

      {/* Chunk Viewer Modal */}
      <DocumentChunkViewerDialog
        open={!!viewerTarget}
        onOpenChange={(open) => {
          if (!open) setViewerTarget(null);
        }}
        workspaceId={workspaceId}
        documentId={viewerTarget?.id}
        fileName={viewerTarget?.fileName}
      />
    </Card>
  );
}
