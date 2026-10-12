import { NextResponse } from "next/server";
import { ingestDocument } from "@/server/services/ingestion";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { workspaceId, documentId } = body || {};

    if (!workspaceId || !documentId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: workspaceId and documentId" },
        { status: 400 }
      );
    }

    const result = await ingestDocument({ workspaceId, documentId });
    return NextResponse.json({ success: true, chunksCount: result.chunksCount });
  } catch (error: any) {
    console.error("Error in /api/ingest route handler:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to ingest document" },
      { status: 500 }
    );
  }
}
