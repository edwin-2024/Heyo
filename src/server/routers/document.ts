import { z } from "zod";
import { pub } from "@/server/orpc";
import { prisma } from "@/server/db";
import {
  getPresignedDocumentUploadUrl,
  deleteDocumentObject,
} from "@/server/storage";
import { ingestDocument } from "@/server/services/ingestion";

export const documentRouter = {
  getUploadUrl: pub
    .input(
      z.object({
        workspaceId: z.string(),
        fileName: z.string(),
        contentType: z.string(),
        fileSize: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const { workspaceId, fileName, contentType, fileSize } = input;

      if (fileSize > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit.");
      }

      const { uploadUrl, objectKey } = await getPresignedDocumentUploadUrl({
        workspaceId,
        fileName,
        contentType,
        fileSize,
      });

      const doc = await prisma.document.create({
        data: {
          workspaceId,
          fileName,
          storagePath: objectKey,
          fileSize,
          contentType,
          status: "UPLOADING",
          chunksCount: 0,
        },
      });

      return {
        documentId: doc.id,
        uploadUrl,
        storagePath: objectKey,
      };
    }),

  ingest: pub
    .input(
      z.object({
        workspaceId: z.string(),
        documentId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const result = await ingestDocument({
        workspaceId: input.workspaceId,
        documentId: input.documentId,
      });

      return {
        success: result.success,
        chunksCount: result.chunksCount,
      };
    }),

  listDocuments: pub
    .input(
      z.object({
        workspaceId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      return prisma.document.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { createdAt: "desc" },
      });
    }),

  deleteDocument: pub
    .input(
      z.object({
        workspaceId: z.string(),
        documentId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const doc = await prisma.document.findUnique({
        where: { id: input.documentId },
      });

      if (!doc || doc.workspaceId !== input.workspaceId) {
        throw new Error("Document not found");
      }

      try {
        await deleteDocumentObject(doc.storagePath);
      } catch (error) {
        console.warn(`Failed to delete storage object for ${doc.storagePath}:`, error);
      }

      await prisma.document.delete({
        where: { id: input.documentId },
      });

      return { success: true };
    }),

  getDocumentChunks: pub
    .input(
      z.object({
        workspaceId: z.string(),
        documentId: z.string().optional(),
        fileName: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      let doc = null;
      if (input.documentId) {
        doc = await prisma.document.findUnique({
          where: { id: input.documentId },
        });
      } else if (input.fileName) {
        doc = await prisma.document.findFirst({
          where: { workspaceId: input.workspaceId, fileName: input.fileName },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!doc || doc.workspaceId !== input.workspaceId) {
        throw new Error("Document not found");
      }

      const chunks = await prisma.documentChunk.findMany({
        where: {
          workspaceId: input.workspaceId,
          documentId: doc.id,
        },
        select: {
          id: true,
          chunkIndex: true,
          content: true,
          tokenCount: true,
          createdAt: true,
        },
        orderBy: {
          chunkIndex: "asc",
        },
      });

      return {
        document: {
          id: doc.id,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          contentType: doc.contentType,
          status: doc.status,
          chunksCount: doc.chunksCount,
          createdAt: doc.createdAt,
        },
        chunks,
      };
    }),
};
