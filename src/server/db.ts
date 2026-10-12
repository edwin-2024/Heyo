import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

// Set WebSocket constructor for Node.js environment
if (!neonConfig.webSocketConstructor && typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const createPrismaClient = () => {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:placeholder@ep-plain-credit-b3j9er2k-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Ensures the HNSW cosine index exists on DocumentChunk.
 * Idempotent: safe to run repeatedly across environments.
 */
export async function ensureHnswIndex(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_hnsw_idx"
      ON "DocumentChunk"
      USING hnsw (embedding vector_cosine_ops);
    `);
  } catch (error) {
    console.error("[DB] ensureHnswIndex warning:", error);
  }
}
