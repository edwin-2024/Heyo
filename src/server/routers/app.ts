import { pub } from "@/server/orpc";
import { z } from "zod";

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
};

export type AppRouter = typeof appRouter;
