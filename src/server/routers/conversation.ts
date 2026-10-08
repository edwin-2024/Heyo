import { z } from "zod";
import { pub } from "@/server/orpc";
import { prisma } from "@/server/db";
import { broadcastToPartyKit } from "@/server/party";
import { auth } from "@/lib/auth/server";

const ConversationStatusEnum = z.enum([
  "AI_ANSWERING",
  "WAITING_HUMAN",
  "OPERATOR_ANSWERED",
  "RESOLVED",
]);

export const conversationRouter = {
  sendMessage: pub
    .input(
      z.object({
        workspaceId: z.string(),
        conversationId: z.string(),
        visitorToken: z.string().optional(),
        sender: z.enum(["visitor", "bot", "operator", "system"]),
        text: z.string().min(1),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .handler(async ({ input }) => {
      const { workspaceId, conversationId, visitorToken, sender, text, metadata } = input;
      const vToken = visitorToken || conversationId;

      // 1. Ensure conversation exists in Postgres
      let conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        // Ensure workspace exists first
        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
        });

        if (!workspace) {
          // Auto-provision workspace if missing
          await prisma.workspace.create({
            data: {
              id: workspaceId,
              name: "Support Workspace",
              ownerUserId: "system-auto",
              widgetSettings: {
                create: {},
              },
            },
          });
        }

        conversation = await prisma.conversation.create({
          data: {
            id: conversationId,
            workspaceId,
            visitorId: vToken,
            visitorToken: vToken,
            status: sender === "operator" ? "OPERATOR_ANSWERED" : "AI_ANSWERING",
          },
        });
      }

      // 2. Persist message in Postgres
      const message = await prisma.message.create({
        data: {
          conversationId,
          sender,
          text,
          metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
        },
      });

      // 3. Update conversation updatedAt and atomically transition status if applicable
      let statusUpdate: "OPERATOR_ANSWERED" | "AI_ANSWERING" | undefined;
      if (sender === "operator") {
        statusUpdate = "OPERATOR_ANSWERED";
      } else if (conversation.status === "RESOLVED") {
        statusUpdate = "AI_ANSWERING";
      }

      const updatedConv = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: new Date(),
          ...(statusUpdate ? { status: statusUpdate } : {}),
        },
      });
      const nextStatus = updatedConv.status;

      // 4. Server-first broadcast to PartyKit Edge room
      const chatRoomId = `room_${workspaceId}_${conversationId}`;
      const inboxRoomId = `inbox_${workspaceId}`;

      const broadcastPayload = {
        id: message.id,
        conversationId,
        sender: message.sender,
        text: message.text,
        createdAt: message.createdAt.toISOString(),
        metadata: message.metadata,
      };

      await broadcastToPartyKit(chatRoomId, {
        type: "message",
        payload: broadcastPayload,
      });

      // Broadcast update to operator inbox
      await broadcastToPartyKit(inboxRoomId, {
        type: "conversation:updated",
        payload: {
          conversationId,
          status: nextStatus,
          lastMessage: broadcastPayload,
        },
      });

      return broadcastPayload;
    }),

  getConversation: pub
    .input(
      z.object({
        workspaceId: z.string(),
        conversationId: z.string(),
      })
    )
    .handler(async ({ input }) => {
      const conversation = await prisma.conversation.findUnique({
        where: { id: input.conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation) {
        return null;
      }

      return {
        ...conversation,
        messages: conversation.messages.map((m) => ({
          id: m.id,
          conversationId: m.conversationId,
          sender: m.sender,
          text: m.text,
          createdAt: m.createdAt.toISOString(),
          metadata: m.metadata,
        })),
      };
    }),

  listConversations: pub
    .input(
      z.object({
        workspaceId: z.string(),
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
          throw new Error("Forbidden: You do not have access to this workspace");
        }
      }

      const conversations = await prisma.conversation.findMany({
        where: { workspaceId: input.workspaceId },
        orderBy: { updatedAt: "desc" },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      return conversations.map((conv) => ({
        id: conv.id,
        workspaceId: conv.workspaceId,
        visitorId: conv.visitorId,
        visitorToken: conv.visitorToken,
        status: conv.status,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        lastMessage: conv.messages[0]
          ? {
              id: conv.messages[0].id,
              sender: conv.messages[0].sender,
              text: conv.messages[0].text,
              createdAt: conv.messages[0].createdAt.toISOString(),
            }
          : null,
      }));
    }),

  updateStatus: pub
    .input(
      z.object({
        workspaceId: z.string(),
        conversationId: z.string(),
        status: ConversationStatusEnum,
      })
    )
    .handler(async ({ input }) => {
      const session = (await auth.getSession()) as any;
      const userId = session?.user?.id || session?.data?.user?.id;

      if (!userId && process.env.NODE_ENV === "production") {
        throw new Error("Unauthorized");
      }

      const updated = await prisma.conversation.update({
        where: { id: input.conversationId },
        data: { status: input.status, updatedAt: new Date() },
      });

      // Broadcast status change to both room and inbox
      await broadcastToPartyKit(`room_${input.workspaceId}_${input.conversationId}`, {
        type: "status:changed",
        payload: { status: input.status },
      });

      await broadcastToPartyKit(`inbox_${input.workspaceId}`, {
        type: "conversation:status_changed",
        payload: { conversationId: input.conversationId, status: input.status },
      });

      return updated;
    }),
};
