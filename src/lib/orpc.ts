import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "@/server/routers/app";

const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
};

const link = new RPCLink({
  url: `${getBaseUrl()}/api/rpc`,
});

export const orpc = createORPCClient<RouterClient<AppRouter>>(link);
