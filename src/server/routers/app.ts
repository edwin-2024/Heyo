import { pub } from "@/server/orpc";
import { z } from "zod";
import { workspaceRouter } from "./workspace";
import { conversationRouter } from "./conversation";

export const appRouter = {
  health: pub
    .input(z.object({ name: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      return {
        status: "ok",
        message: `Hello ${input?.name || "World"} from Heyo oRPC!`,
        timestamp: new Date().toISOString(),
      };
    }),
  workspace: workspaceRouter,
  conversation: conversationRouter,
};

export type AppRouter = typeof appRouter;
