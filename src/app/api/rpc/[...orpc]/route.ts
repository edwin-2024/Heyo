import { RPCHandler } from "@orpc/server/fetch";
import { appRouter } from "@/server/routers/app";

const handler = new RPCHandler(appRouter);

async function handle(req: Request) {
  const { matched, response } = await handler.handle(req, { prefix: "/api/rpc" });
  if (matched) {
    return response;
  }
  return new Response("Not Found", { status: 404 });
}

export const GET = handle;
export const POST = handle;
