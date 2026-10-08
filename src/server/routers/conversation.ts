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

type AuthSession = {
  user?: { id?: string; name?: string; email?: string };
  data?: { user?: { id?: string; name?: string; email?: string } };
} | null;

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
      // Derive workspace-scoped deterministic conversation ID
      const effectiveConvId = conversationId.startsWith(`conv_${workspaceId}_`)
        ? conversationId
        : `conv_${workspaceId}_${vToken}`;

      // 1. Ensure workspace exists via upsert (race-safe)
      await prisma.workspace.upsert({
        where: { id: workspaceId },
        update: {},
        create: {
          id: workspaceId,
          name: "Support Workspace",
          ownerUserId: "system-auto",
          widgetSettings: {
            create: {},
          },
        },
      });

      // 2. Ensure conversation exists via upsert (race-safe)
      const initialStatus = sender === "operator" ? "OPERATOR_ANSWERED" : "AI_ANSWERING";
      const conversation = await prisma.conversation.upsert({
        where: { id: effectiveConvId },
        update: {},
        create: {
          id: effectiveConvId,
          workspaceId,
          visitorId: vToken,
          visitorToken: vToken,
          status: initialStatus,
        },
      });

      // Strict tenant boundary verification
      if (conversation.workspaceId !== workspaceId) {
        throw new Error("Forbidden: Cross-workspace conversation collision");
      }

      // 3. Determine status transition
      let statusUpdate: "OPERATOR_ANSWERED" | "AI_ANSWERING" | undefined;
      if (sender === "operator") {
        statusUpdate = "OPERATOR_ANSWERED";
      } else if (conversation.status === "RESOLVED") {
        statusUpdate = "AI_ANSWERING";
      }

      // 4. Atomically persist message and update conversation inside a transaction
      const [message, updatedConv] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId: effectiveConvId,
            sender,
            text,
            metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
          },
        }),
        prisma.conversation.update({
          where: { id: effectiveConvId },
          data: {
            updatedAt: new Date(),
            ...(statusUpdate ? { status: statusUpdate } : {}),
          },
        }),
      ]);
      const nextStatus = updatedConv.status;

      // 4. Server-first broadcast to PartyKit Edge room
      const chatRoomId = `room_${workspaceId}_${effectiveConvId}`;
      const inboxRoomId = `inbox_${workspaceId}`;

      const broadcastPayload = {
        id: message.id,
        conversationId: effectiveConvId,
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
          conversationId: effectiveConvId,
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
      // Derive workspace-scoped ID if raw visitor token was passed
      const effectiveConvId = input.conversationId.startsWith(`conv_${input.workspaceId}_`)
        ? input.conversationId
        : `conv_${input.workspaceId}_${input.conversationId}`;

      // Query with strict tenant boundary enforcement
      const conversation = await prisma.conversation.findFirst({
        where: {
          workspaceId: input.workspaceId,
          OR: [
            { id: input.conversationId },
            { id: effectiveConvId },
          ],
        },
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
      const session = (await auth.getSession()) as AuthSession;
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
      const session = (await auth.getSession()) as AuthSession;
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
