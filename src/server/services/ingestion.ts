import crypto from "crypto";
import { extractText } from "unpdf";
import { getEncoding } from "js-tiktoken";
import { prisma, ensureHnswIndex } from "@/server/db";
import { getDocumentBuffer } from "@/server/storage";
import { generateEmbeddings } from "./embedding";

/**
 * Extracts plain text from document buffers based on MIME type or file extension.
 */
export async function parseDocument(
  buffer: Buffer,
  contentType: string,
  fileName: string
): Promise<string> {
  const isPdf =
    contentType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
    return text || "";
  }

  return buffer.toString("utf-8");
}

/**
 * Splits text into 500-token chunks with a 50-token sliding window overlap using js-tiktoken.
 * If text <= 500 tokens, returns a single chunk.
 */
export function chunkText(
  text: string
): { chunkIndex: number; content: string; tokenCount: number }[] {
  const trimmed = text.trim();
  if (!trimmed) {
    return [];
  }

  const enc = getEncoding("cl100k_base");
  const tokens = enc.encode(trimmed);
  if (tokens.length === 0) {
    return [];
  }

  if (tokens.length <= 500) {
    return [
      {
        chunkIndex: 0,
        content: trimmed,
        tokenCount: tokens.length,
      },
    ];
  }

  const CHUNK_SIZE = 500;
  const CHUNK_OVERLAP = 50;
  const STEP = CHUNK_SIZE - CHUNK_OVERLAP; // 450 tokens
  const chunks: { chunkIndex: number; content: string; tokenCount: number }[] = [];
  let chunkIndex = 0;

  for (let start = 0; start < tokens.length; start += STEP) {
    const end = Math.min(start + CHUNK_SIZE, tokens.length);
    const chunkTokens = tokens.slice(start, end);
    const content = enc.decode(chunkTokens);
    chunks.push({
      chunkIndex,
      content,
      tokenCount: chunkTokens.length,
    });
    chunkIndex++;
    if (end === tokens.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Uses Groq to extract 3-4 natural visitor questions based on uploaded document content.
 */
async function generateSuggestedQuestions(chunks: { content: string }[]): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  const sampleText = chunks.slice(0, 4).map((c) => c.content).join("\n\n").slice(0, 3000);

  if (!apiKey || !sampleText.trim()) {
    return [];
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Generate 3 to 4 concise, high-value FAQ questions that a website visitor or customer would ask based on the provided document text. Return strictly JSON with format: {"questions": ["question 1", "question 2", ...]}',
          },
          {
            role: "user",
            content: sampleText,
          },
        ],
      }),
    });

    if (!res.ok) {
      console.warn(`[Ingestion] Groq suggested question generation status: ${res.status}`);
      return [];
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content) as { questions?: string[] };
    if (Array.isArray(parsed.questions)) {
      return parsed.questions
        .map((q) => q.trim())
        .filter((q) => q.length > 5 && q.endsWith("?"))
        .slice(0, 4);
    }
  } catch (err) {
    console.warn("[Ingestion] Error generating suggested questions from document:", err);
  }

  return [];
}

/**
 * Coordinates end-to-end ingestion of a document:
 * 1. Fetches document record
 * 2. Fetches buffer from Neon Object Storage
 * 3. Extracts text and chunks into 500-token blocks
 * 4. Generates 384d vector embeddings via Cloudflare Workers AI
 * 5. Persists vectors to Neon Postgres DocumentChunk table
 * 6. Marks Document as READY
 * 7. Automatically extracts and populates suggested prompts/questions into widget settings
 */
export async function ingestDocument({
  workspaceId,
  documentId,
}: {
  workspaceId: string;
  documentId: string;
}): Promise<{ success: boolean; chunksCount: number }> {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document || document.workspaceId !== workspaceId) {
    throw new Error(`Document not found: ${documentId} for workspace: ${workspaceId}`);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "PROCESSING" },
  });

  try {
    const buffer = await getDocumentBuffer(document.storagePath);
    const text = await parseDocument(buffer, document.contentType, document.fileName);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      await prisma.document.update({
        where: { id: documentId },
        data: { status: "FAILED", chunksCount: 0 },
      });
      return { success: false, chunksCount: 0 };
    }

    // Clean up any existing chunks if re-ingesting
    await prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    const embeddings = await generateEmbeddings(chunks.map((c) => c.content));
    await ensureHnswIndex();

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const vector = embeddings[i];
      const vectorStr = `[${vector.join(",")}]`;
      const chunkId = crypto.randomUUID();

      await prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk" ("id", "workspaceId", "documentId", "chunkIndex", "content", "embedding", "tokenCount", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6::vector, $7, NOW())`,
        chunkId,
        workspaceId,
        documentId,
        chunk.chunkIndex,
        chunk.content,
        vectorStr,
        chunk.tokenCount
      );
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: "READY",
        chunksCount: chunks.length,
        updatedAt: new Date(),
      },
    });

    // Auto-populate suggested questions into WidgetSettings from the ingested document
    try {
      const generatedQuestions = await generateSuggestedQuestions(chunks);
      if (generatedQuestions.length > 0) {
        const settings = await prisma.widgetSettings.findUnique({
          where: { workspaceId },
        });

        let currentList: string[] = [];
        if (settings?.suggestedQuestions) {
          try {
            currentList = JSON.parse(settings.suggestedQuestions);
          } catch {}
        }

        const combined = Array.from(new Set([...currentList, ...generatedQuestions])).slice(0, 4);
        await prisma.widgetSettings.upsert({
          where: { workspaceId },
          update: {
            suggestedQuestions: JSON.stringify(combined),
          },
          create: {
            workspaceId,
            suggestedQuestions: JSON.stringify(combined),
          },
        });
      }
    } catch (suggestErr) {
      console.warn("[Ingestion] Could not auto-populate suggested questions:", suggestErr);
    }

    return { success: true, chunksCount: chunks.length };
  } catch (error) {
    console.error(`Failed to ingest document ${documentId}:`, error);
    await prisma.document
      .update({
        where: { id: documentId },
        data: { status: "FAILED" },
      })
      .catch((err) => console.error("Failed to update status to FAILED:", err));
    throw error;
  }
}
