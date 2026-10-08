import "@/lib/dns-bootstrap";
import { auth } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";

const rawHandlers = auth.handler();

/**
 * Robust handler wrapper with automatic retry for transient Neon Auth cloud cold-starts or timeouts (UND_ERR_CONNECT_TIMEOUT).
 */
async function handleWithRetry(
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
  request: NextRequest,
  context: unknown
): Promise<Response> {
  const handler = rawHandlers[method];
  if (!handler) {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Clone request body buffer upfront in case a retry is needed for POST/PUT
  let reqToPass = request;
  let bodyBuffer: ArrayBuffer | null = null;
  if (method !== "GET" && request.body) {
    bodyBuffer = await request.arrayBuffer();
    reqToPass = new NextRequest(request.url, {
      method: request.method,
      headers: request.headers,
      body: bodyBuffer,
    });
  }

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await handler(reqToPass, context as any);
      // If Neon Auth returned a 502 Bad Gateway due to upstream connect timeout, retry once
      if (response.status === 502 && attempt < maxRetries) {
        console.warn(`[auth-proxy] Neon Auth returned 502 on ${request.url}, retrying attempt ${attempt + 1}...`);
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        if (bodyBuffer) {
          reqToPass = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: bodyBuffer,
          });
        }
        continue;
      }
      return response;
    } catch (err) {
      if (attempt < maxRetries) {
        console.warn(`[auth-proxy] Transient error on ${request.url}, retrying attempt ${attempt + 1}...`, err);
        await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
        if (bodyBuffer) {
          reqToPass = new NextRequest(request.url, {
            method: request.method,
            headers: request.headers,
            body: bodyBuffer,
          });
        }
        continue;
      }
      throw err;
    }
  }

  return NextResponse.json({ error: "Service temporarily unavailable. Please retry." }, { status: 502 });
}

export async function GET(request: NextRequest, context: unknown) {
  return handleWithRetry("GET", request, context);
}

export async function POST(request: NextRequest, context: unknown) {
  return handleWithRetry("POST", request, context);
}

export async function PUT(request: NextRequest, context: unknown) {
  return handleWithRetry("PUT", request, context);
}

export async function DELETE(request: NextRequest, context: unknown) {
  return handleWithRetry("DELETE", request, context);
}

export async function PATCH(request: NextRequest, context: unknown) {
  return handleWithRetry("PATCH", request, context);
}
