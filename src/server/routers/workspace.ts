import { z } from "zod";
import { pub } from "@/server/orpc";
import { prisma } from "@/server/db";
import { auth } from "@/lib/auth/server";
import { getPresignedAvatarUploadUrl } from "@/server/storage";
import { broadcastToPartyKit } from "@/server/party";

type AuthSession = {
  user?: { id?: string; name?: string; email?: string };
  data?: { user?: { id?: string; name?: string; email?: string } };
} | null;

export const workspaceRouter = {
  getWorkspace: pub
    .input(z.object({ workspaceId: z.string().optional() }).optional())
    .handler(async ({ input }) => {
      // If a specific workspaceId is requested, return it directly
      if (input?.workspaceId) {
        const found = await prisma.workspace.findUnique({
          where: { id: input.workspaceId },
          include: { widgetSettings: true },
        });
        if (found) return found;
      }

      let userId = "demo-operator-1";
      let userName = "Default";

      try {
        const session = (await auth.getSession()) as AuthSession;
        if (session?.user?.id || session?.data?.user?.id) {
          userId = (session?.user?.id || session?.data?.user?.id)!;
          userName = session?.user?.name || session?.data?.user?.name || "Default";
        }
      } catch (err) {
        console.warn("[Workspace] Failed to read auth session:", err);
      }

      let workspace = await prisma.workspace.findFirst({
        where: { ownerUserId: userId },
        include: { widgetSettings: true },
        orderBy: { createdAt: "desc" },
      });

      if (!workspace) {
        workspace = await prisma.workspace.create({
          data: {
            name: `${userName}'s Workspace`,
            ownerUserId: userId,
            widgetSettings: {
              create: {
                brandTitle: `${userName} Support`,
                suggestedQuestions: "[]",
              },
            },
          },
          include: { widgetSettings: true },
        });
      }

      return workspace;
    }),

  createOrUpdateWorkspace: pub
    .input(
      z.object({
        name: z.string().min(1, "Workspace name is required").max(100),
        workspaceId: z.string().optional(),
      })
    )
    .handler(async ({ input }) => {
      const cleanName = input.name.trim();

      // 1. Direct workspaceId update if supplied
      if (input.workspaceId) {
        const existing = await prisma.workspace.findUnique({
          where: { id: input.workspaceId },
          include: { widgetSettings: true },
        });

        if (existing) {
          const updated = await prisma.workspace.update({
            where: { id: existing.id },
            data: { name: cleanName },
            include: { widgetSettings: true },
          });

          if (
            updated.widgetSettings &&
            (updated.widgetSettings.brandTitle === "Heyo Support" ||
              updated.widgetSettings.brandTitle.endsWith("Support") ||
              updated.widgetSettings.brandTitle.includes("'s Workspace"))
          ) {
            await prisma.widgetSettings.update({
              where: { workspaceId: updated.id },
              data: { brandTitle: cleanName },
            });
          }

          return updated;
        }
      }

      // 2. Fall back to user session lookup
      let userId: string | undefined;
      try {
        const session = (await auth.getSession()) as AuthSession;
        userId = session?.user?.id || session?.data?.user?.id;
      } catch (err) {
        console.warn("[Workspace] Failed to read auth session in createOrUpdateWorkspace:", err);
      }

      if (userId) {
        let workspace = await prisma.workspace.findFirst({
          where: { ownerUserId: userId },
          include: { widgetSettings: true },
          orderBy: { createdAt: "desc" },
        });

        if (workspace) {
          workspace = await prisma.workspace.update({
            where: { id: workspace.id },
            data: { name: cleanName },
            include: { widgetSettings: true },
          });

          if (
            workspace.widgetSettings &&
            (workspace.widgetSettings.brandTitle === "Heyo Support" ||
              workspace.widgetSettings.brandTitle.endsWith("Support") ||
              workspace.widgetSettings.brandTitle.includes("'s Workspace"))
          ) {
            await prisma.widgetSettings.update({
              where: { workspaceId: workspace.id },
              data: { brandTitle: cleanName },
            });
          }
          return workspace;
        } else {
          workspace = await prisma.workspace.create({
            data: {
              name: cleanName,
              ownerUserId: userId,
              widgetSettings: {
                create: {
                  brandTitle: cleanName,
                  suggestedQuestions: "[]",
                },
              },
            },
            include: { widgetSettings: true },
          });
          return workspace;
        }
      }

      // 3. Fallback to latest workspace
      const latest = await prisma.workspace.findFirst({
        orderBy: { createdAt: "desc" },
        include: { widgetSettings: true },
      });
      if (latest) {
        const updated = await prisma.workspace.update({
          where: { id: latest.id },
          data: { name: cleanName },
          include: { widgetSettings: true },
        });
        return updated;
      }

      throw new Error("No active workspace found to update.");
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
          suggestedQuestions: z.string().optional(),
        }),
      })
    )
    .handler(async ({ input }) => {
      const updated = await prisma.widgetSettings.upsert({
        where: { workspaceId: input.workspaceId },
        update: {
          brandTitle: input.settings.brandTitle,
          botDisplayName: input.settings.botDisplayName,
          primaryColor: input.settings.primaryColor,
          themeMode: input.settings.themeMode,
          position: input.settings.position,
          botAvatarType: input.settings.botAvatarType,
          customAvatarUrl: input.settings.customAvatarUrl ?? "",
          welcomeMessage: input.settings.welcomeMessage,
          allowHumanEscalation: input.settings.allowHumanEscalation,
          handoffThreshold: input.settings.handoffThreshold,
          offlineEmailCapture: input.settings.offlineEmailCapture,
          allowedDomains: input.settings.allowedDomains,
          suggestedQuestions: input.settings.suggestedQuestions ?? "[]",
        },
        create: {
          workspaceId: input.workspaceId,
          brandTitle: input.settings.brandTitle,
          botDisplayName: input.settings.botDisplayName,
          primaryColor: input.settings.primaryColor,
          themeMode: input.settings.themeMode,
          position: input.settings.position,
          botAvatarType: input.settings.botAvatarType,
          customAvatarUrl: input.settings.customAvatarUrl ?? "",
          welcomeMessage: input.settings.welcomeMessage,
          allowHumanEscalation: input.settings.allowHumanEscalation,
          handoffThreshold: input.settings.handoffThreshold,
          offlineEmailCapture: input.settings.offlineEmailCapture,
          allowedDomains: input.settings.allowedDomains,
          suggestedQuestions: input.settings.suggestedQuestions ?? "[]",
        },
      });

      // Broadcast widget settings change in real-time via PartyKit Edge
      try {
        await broadcastToPartyKit(`widget_${input.workspaceId}`, {
          type: "widget:settings_updated",
          payload: {
            workspaceId: input.workspaceId,
            settings: updated,
          },
        });
      } catch (err) {
        console.warn("[Workspace] Real-time PartyKit broadcast error:", err);
      }

      return updated;
    }),

  presignAvatarUpload: pub
    .input(
      z.object({
        workspaceId: z.string(),
        contentType: z.string(),
        fileSize: z.number().max(2 * 1024 * 1024, "Avatar size exceeds 2MB limit"),
      })
    )
    .handler(async ({ input }) => {
      const result = await getPresignedAvatarUploadUrl({
        workspaceId: input.workspaceId,
        contentType: input.contentType,
        fileSize: input.fileSize,
      });
      return result;
    }),

  getAvatarUploadUrl: pub
    .input(
      z.object({
        workspaceId: z.string(),
        contentType: z.string(),
        fileSize: z.number().max(2 * 1024 * 1024, "Avatar size exceeds 2MB limit"),
      })
    )
    .handler(async ({ input }) => {
      const result = await getPresignedAvatarUploadUrl({
        workspaceId: input.workspaceId,
        contentType: input.contentType,
        fileSize: input.fileSize,
      });
      return result;
    }),
};
