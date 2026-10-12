import { ingestDocument } from "@/server/services/ingestion";
import { prisma } from "@/server/db";

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = (await request.json().catch(() => ({}))) as Record<string, any>;
      let workspaceId = body.workspaceId;
      let documentId = body.documentId;

      // Handle storage event payloads if documentId not explicitly passed
      if (!documentId) {
        const objectKey =
          body.objectKey ||
          body.data?.key ||
          body.records?.[0]?.s3?.object?.key ||
          body.Records?.[0]?.s3?.object?.key;

        if (objectKey) {
          const doc = await prisma.document.findFirst({
            where: { storagePath: objectKey },
          });
          if (doc) {
            workspaceId = doc.workspaceId;
            documentId = doc.id;
          }
        }
      }

      if (!workspaceId || !documentId) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: "Missing required fields: workspaceId and documentId",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      const result = await ingestDocument({ workspaceId, documentId });

      return new Response(
        JSON.stringify({
          ok: result.success,
          chunksCount: result.chunksCount,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error: any) {
      console.error("Neon function ingest worker error:", error);
      return new Response(
        JSON.stringify({
          ok: false,
          error: error?.message || "Internal server error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
