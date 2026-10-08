import { z } from "zod";
import { pub } from "@/server/orpc";
import { prisma } from "@/server/db";
import { auth } from "@/lib/auth/server";
import { getPresignedAvatarUploadUrl } from "@/server/storage";
import { broadcastToPartyKit } from "@/server/party";

export const workspaceRouter = {
  getWorkspace: pub
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      const session = (await auth.getSession()) as any;
      
      const userId = session?.user?.id || session?.data?.user?.id || "demo-operator-1";
      const userName = session?.user?.name || session?.data?.user?.name || "Default";

      let workspace = await prisma.workspace.findFirst({
        where: { ownerUserId: userId },
        include: { widgetSettings: true },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: `${userName}'s Workspace`,
            ownerUserId: userId,
            widgetSettings: {
              create: {},
            },
          },
          include: { widgetSettings: true },
        });
      }

      return workspace;
    }),

  getWidgetSettings: pub
    .input(z.object({ workspaceId: z.string() }))
    .handler(async ({ input }) => {
      const settings = await prisma.widgetSettings.findUnique({
        where: { workspaceId: input.workspaceId },
      });

      if (!settings) {
        throw new Error("Widget settings not found");
      }

      return settings;
    }),

  updateWidgetSettings: pub
    .input(
      z.object({
        workspaceId: z.string(),
        settings: z.object({
          brandTitle: z.string(),
          botDisplayName: z.string(),
          primaryColor: z.string(),
          themeMode: z.string(),
          position: z.string(),
          botAvatarType: z.string(),
          customAvatarUrl: z.string().nullable().optional(),
          welcomeMessage: z.string(),
          allowHumanEscalation: z.boolean(),
          handoffThreshold: z.number(),
          offlineEmailCapture: z.boolean(),
          allowedDomains: z.string(),
        }),
      })
    )
    .handler(async ({ input }) => {
      const session = (await auth.getSession()) as any;
      const userId = session?.user?.id || session?.data?.user?.id;

      if (process.env.NODE_ENV === "production" && !userId) {
        throw new Error("Unauthorized");
      }

      if (userId) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });
        if (
          workspace &&
          workspace.ownerUserId !== userId &&
          workspace.ownerUserId !== "demo-operator-1" &&
          workspace.ownerUserId !== "system-auto"
        ) {
          throw new Error("Forbidden: You do not own this workspace");
        }
      }

      const updated = await prisma.widgetSettings.upsert({
        where: { workspaceId: input.workspaceId },
        update: {
          ...input.settings,
          customAvatarUrl: input.settings.customAvatarUrl ?? "",
        },
        create: {
          workspaceId: input.workspaceId,
          ...input.settings,
          customAvatarUrl: input.settings.customAvatarUrl ?? "",
        },
      });

      // Broadcast settings update to PartyKit edge room so embedded widgets immediately reflect changes
      await broadcastToPartyKit(`settings_${input.workspaceId}`, {
        type: "settings:updated",
        payload: {
          brandTitle: updated.brandTitle,
          botDisplayName: updated.botDisplayName,
          primaryColor: updated.primaryColor,
          themeMode: updated.themeMode,
          position: updated.position,
          botAvatarType: updated.botAvatarType,
          customAvatarUrl: updated.customAvatarUrl,
          welcomeMessage: updated.welcomeMessage,
          allowedDomains: updated.allowedDomains,
        },
      });

      return updated;
    }),

  presignAvatarUpload: pub
    .input(
      z.object({
        workspaceId: z.string(),
        contentType: z.string(),
        fileSize: z.number(),
      })
    )
    .handler(async ({ input }) => {
      const session = (await auth.getSession()) as any;
      const userId = session?.user?.id || session?.data?.user?.id;

      if (!userId && process.env.NODE_ENV === "production") {
        throw new Error("Unauthorized");
      }

      if (userId) {
        const workspace = await prisma.workspace.findUnique({
          where: { id: input.workspaceId },
        });
        if (
          workspace &&
          workspace.ownerUserId !== userId &&
          workspace.ownerUserId !== "demo-operator-1" &&
          workspace.ownerUserId !== "system-auto"
        ) {
          throw new Error("Forbidden: You do not own this workspace");
        }
      }

      const result = await getPresignedAvatarUploadUrl({
        workspaceId: input.workspaceId,
        contentType: input.contentType,
        fileSize: input.fileSize,
      });

      return result;
    }),
};
