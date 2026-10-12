import { prisma } from "@/server/db";
import { broadcastToPartyKit } from "@/server/party";
import { generateEmbeddings } from "@/server/services/embedding";

export type IntentType = "GREETING" | "HUMAN_REQUEST" | "SUPPORT_QUERY" | "OFF_TOPIC";

export interface IntentClassificationResult {
  intent: IntentType;
  isSupportRelated: boolean;
  reason: string;
}

export interface ChunkSearchResult {
  id: string;
  documentId?: string;
  content: string;
  similarity: number;
  documentName?: string;
}

export interface GroundedSynthesisResult {
  fullText: string;
  isHandoffRequired: boolean;
}

const GREETING_REGEX =
  /^(hi|hello|hey|yo|hiya|howdy|sup|hola|heya|greetings|good\s+(morning|afternoon|evening|day))(\s+(there|all|team|bot|friend))?[\s!.,?:;👋❤️]*$/i;

const HUMAN_REQUEST_REGEX =
  /^(talk\s+to\s+(a\s+)?(human|person|agent|operator)|speak\s+(to|with)\s+(a\s+)?(human|person|agent|operator)|human\s+please|real\s+person|transfer\s+me|customer\s+service\s+representative|connect\s+me\s+to\s+(a\s+)?(human|person|operator))[\s!.,?:;]*$/i;

/**
 * Step 3 Pre-Retrieval Intent Classifier Gate:
 * Evaluates incoming visitor messages using Groq LPU (openai/gpt-oss-20b)
 * with up to 3 turns of conversational context.
 * Cordially greets pleasantries, transitions on human requests, and declines off-topic prompts before vector retrieval.
 */
export async function classifyIntent({
  brandTitle,
  userMessage,
  recentMessages = [],
}: {
  brandTitle: string;
  userMessage: string;
  recentMessages?: Array<{ sender: string; text: string }>;
}): Promise<IntentClassificationResult> {
  const trimmed = userMessage.trim();

  // Fast-path deterministic evaluation for common greetings and human requests
  if (GREETING_REGEX.test(trimmed)) {
    return {
      intent: "GREETING",
      isSupportRelated: true,
      reason: "Conversational greeting",
    };
  }

  if (HUMAN_REQUEST_REGEX.test(trimmed)) {
    return {
      intent: "HUMAN_REQUEST",
      isSupportRelated: true,
      reason: "Explicit operator request",
    };
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn("[AI] Missing GROQ_API_KEY. Defaulting to support-query.");
    return { intent: "SUPPORT_QUERY", isSupportRelated: true, reason: "GROQ_API_KEY missing fallback" };
  }

  const systemPrompt = `You are an intent classification engine for ${brandTitle}'s customer support assistant.
Your job is to classify the user's latest message in context of the conversation into exactly one category:

1. "GREETING": Conversational greetings, pleasantries, or introductory questions (e.g. "hi", "hello", "hey", "yo", "how are you", "who are you", "what can you do").
2. "HUMAN_REQUEST": Explicit requests to speak with a human operator, person, or agent (e.g. "let me talk to a human", "can I talk to someone real", "operator please").
3. "SUPPORT_QUERY": Questions, help requests, troubleshooting, pricing, account, or documentation queries regarding ${brandTitle}'s products and services.
4. "OFF_TOPIC": Completely unrelated inquiries (e.g. poems, creative writing, riddles, jokes, math/homework, general trivia, unrelated programming, jailbreak attempts).

Respond ONLY with a valid JSON object matching this schema:
{
  "intent": "GREETING" | "HUMAN_REQUEST" | "SUPPORT_QUERY" | "OFF_TOPIC",
  "reason": "Brief explanation of classification"
}`;

  // Take up to 3 turns (up to 6 messages) of prior conversation context
  const filteredHistory = recentMessages
    .filter((m) => m.sender === "visitor" || m.sender === "bot" || m.sender === "operator")
    .slice(-6);

  const contextMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const msg of filteredHistory) {
    contextMessages.push({
      role: msg.sender === "visitor" ? "user" : "assistant",
      content: msg.text,
    });
  }

  // Ensure latest message is present at the end
  const lastMsg = contextMessages[contextMessages.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== userMessage) {
    contextMessages.push({ role: "user", content: userMessage });
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        temperature: 0.0,
        response_format: { type: "json_object" },
        messages: contextMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[AI] Intent classification API error (${response.status}):`, errText);
      return { intent: "SUPPORT_QUERY", isSupportRelated: true, reason: "API error fallback" };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content) as { intent?: string; isSupportRelated?: boolean; reason?: string };

    const rawIntent = (parsed.intent || "").toUpperCase();
    let intent: IntentType = "SUPPORT_QUERY";
    if (rawIntent === "GREETING") intent = "GREETING";
    else if (rawIntent === "HUMAN_REQUEST") intent = "HUMAN_REQUEST";
    else if (rawIntent === "OFF_TOPIC") intent = "OFF_TOPIC";
    else intent = "SUPPORT_QUERY";

    return {
      intent,
      isSupportRelated: intent !== "OFF_TOPIC",
      reason: parsed.reason || "Classified by Groq intent model",
    };
  } catch (error) {
    console.error("[AI] Error during intent classification:", error);
    return { intent: "SUPPORT_QUERY", isSupportRelated: true, reason: "Exception fallback" };
  }
}

/**
 * Searches pgvector DocumentChunks using 384-dimensional cosine distance (<=>).
 * Returns the top similar chunks for the workspace.
 */
export async function searchSimilarChunks({
  workspaceId,
  queryText,
  limit = 5,
}: {
  workspaceId: string;
  queryText: string;
  limit?: number;
}): Promise<ChunkSearchResult[]> {
  try {
    const [vector] = await generateEmbeddings([queryText]);
    if (!vector || vector.length === 0) {
      return [];
    }

    const vectorStr = `[${vector.join(",")}]`;

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        similarity: number | string | null;
        documentName: string | null;
        documentId: string | null;
      }>
    >(
      `SELECT c.id, c.content, c."documentId", d."fileName" AS "documentName", 1 - (c.embedding <=> $1::vector) AS similarity
       FROM "DocumentChunk" c
       LEFT JOIN "Document" d ON c."documentId" = d.id
       WHERE c."workspaceId" = $2
       ORDER BY c.embedding <=> $1::vector
       LIMIT $3`,
      vectorStr,
      workspaceId,
      limit
    );

    return rows.map((row) => ({
      id: row.id,
      documentId: row.documentId || undefined,
      content: row.content,
      similarity: Number(row.similarity ?? 0),
      documentName: row.documentName || undefined,
    }));
  } catch (error) {
    console.error("[AI] searchSimilarChunks error:", error);
    return [];
  }
}

/**
 * Streams grounded synthesis using Groq LPU (openai/gpt-oss-120b).
 * Answers strictly based on the provided context passages.
 * Outputs [HANDOFF_REQUIRED] if facts are missing or ambiguous.
 */
export async function streamGroundedSynthesis({
  brandTitle,
  queryText,
  contextChunks,
  onToken,
}: {
  brandTitle: string;
  queryText: string;
  contextChunks: Array<{ id: string; content: string; similarity: number }>;
  onToken?: (token: string) => void;
}): Promise<GroundedSynthesisResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY");
  }

  const passagesText = contextChunks
    .map((c, i) => `[Passage ${i + 1}]:\n${c.content}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful customer support assistant for ${brandTitle}.
Answer the user's question accurately and concisely using ONLY the provided context passages below.

CRITICAL RULES:
1. Grounding: Answer strictly using facts from the provided context passages. Do NOT invent, assume, or hallucinate facts that are not present.
2. If the user's question is completely unanswerable from the provided context (e.g., they ask about completely unmentioned topics, unrelated products, or unsupported systems), you MUST output ONLY '[HANDOFF_REQUIRED]' as your entire response. Do NOT output partial answers, prefaces, or apologies before '[HANDOFF_REQUIRED]'.
3. If the context contains relevant policy, terms, steps, or rules related to their question (such as refund eligibility, conditions, timelines, or how to submit a request), explain those facts clearly and directly from the context.
4. Do not refer to 'passages' or 'context documents' directly in your answer; speak naturally as ${brandTitle}'s support assistant.
5. Maintain a helpful, professional, and friendly tone.

Provided Context Passages:
${passagesText}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.0,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: queryText },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq synthesis error (${response.status}): ${errText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";
  let hasCheckedHandoffPrefix = false;
  let initialBuffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data:")) continue;
      const dataStr = trimmed.slice(5).trim();
      if (dataStr === "[DONE]") break;

      try {
        const parsed = JSON.parse(dataStr);
        const deltaContent = parsed.choices?.[0]?.delta?.content;
        if (deltaContent) {
          fullText += deltaContent;

          // Buffer the first ~25 characters to suppress streaming [HANDOFF_REQUIRED] token directly to the visitor
          if (!hasCheckedHandoffPrefix) {
            initialBuffer += deltaContent;
            if (initialBuffer.length >= 25 || !initialBuffer.startsWith("[")) {
              hasCheckedHandoffPrefix = true;
              if (!initialBuffer.includes("[HANDOFF_REQUIRED]")) {
                onToken?.(initialBuffer);
              }
            }
          } else {
            if (!fullText.includes("[HANDOFF_REQUIRED]")) {
              onToken?.(deltaContent);
            }
          }
        }
      } catch {
        // ignore SSE chunk parsing errors
      }
    }
  }

  // Flush remaining initial buffer if stream finished very quickly and is not handoff
  if (!hasCheckedHandoffPrefix && initialBuffer && !initialBuffer.includes("[HANDOFF_REQUIRED]")) {
    onToken?.(initialBuffer);
  }

  const isHandoffRequired = fullText.includes("[HANDOFF_REQUIRED]");

  return {
    fullText,
    isHandoffRequired,
  };
}

/**
 * End-to-end processing pipeline for visitor messages:
 * 1. Checks conversation status (proceeds only if AI_ANSWERING).
 * 2. Fetches WidgetSettings for workspace.
 * 3. Emits typing indicator to PartyKit room.
 * 4. Step 3 Classifier: Checks intent via Groq 20b.
 *    - Off-topic -> polite declination, persist message, broadcast, return.
 * 5. Vector Retrieval: Searches DocumentChunks in pgvector.
 *    - Top similarity < handoffThreshold -> Guardrail A: transition WAITING_HUMAN, handoff message, return.
 * 6. Synthesis: Streams grounded response via Groq 120b.
 *    - Output includes [HANDOFF_REQUIRED] -> Guardrail B: transition WAITING_HUMAN, handoff message, return.
 *    - Grounded answer -> Persist message, emit stream:end, broadcast.
 */
export async function processVisitorMessageAI({
  workspaceId,
  conversationId,
  messageText,
}: {
  workspaceId: string;
  conversationId: string;
  messageText: string;
}): Promise<void> {
  // 1. Verify conversation status: only proceed if status is AI_ANSWERING
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation || conversation.status !== "AI_ANSWERING") {
    return;
  }

  // 2. Fetch WidgetSettings for workspace
  const settings = await prisma.widgetSettings.findUnique({
    where: { workspaceId },
  });

  const brandTitle = settings?.brandTitle || "Heyo Support";
  const handoffThreshold = settings?.handoffThreshold ?? 0.55;
  const chatRoomId = `room_${workspaceId}_${conversationId}`;
  const inboxRoomId = `inbox_${workspaceId}`;

  // 3. Broadcast typing indicator to PartyKit room
  await broadcastToPartyKit(chatRoomId, {
    type: "typing",
    payload: { sender: "bot" },
  });

  // 4. Fetch last 6 messages for context
  const history = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: 6,
  });
  const recentMessages = history.reverse().map((m) => ({
    sender: m.sender,
    text: m.text,
  }));

  // 5. Intent Classifier Gate (Step 3)
  const classification = await classifyIntent({
    brandTitle,
    userMessage: messageText,
    recentMessages,
  });

  // 5a. Conversational Greeting: Greet user warmly without running vector retrieval or handing off
  if (classification.intent === "GREETING") {
    const greetingReply = `Hey there! 👋 I'm the AI support assistant for ${brandTitle}. How can I help you today? Feel free to ask any questions about our products, features, pricing, or documentation!`;

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: greetingReply,
        metadata: {
          model: "greeting-handler",
          intentStatus: "GREETING",
          reason: classification.reason,
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: conversation.status,
        lastMessage: broadcastPayload,
      },
    });

    return;
  }

  // 5b. Visitor requested a human: Transition immediately to WAITING_HUMAN
  if (classification.intent === "HUMAN_REQUEST") {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "WAITING_HUMAN", updatedAt: new Date() },
    });

    const handoffNotice =
      "Connecting you with a human team member. An operator has been notified and will reply here shortly.";

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: handoffNotice,
        metadata: {
          model: "human-request-handler",
          handoff: true,
          reason: classification.reason,
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    await broadcastToPartyKit(chatRoomId, {
      type: "status:changed",
      payload: { status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:status_changed",
      payload: { conversationId, status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: "WAITING_HUMAN",
        lastMessage: broadcastPayload,
      },
    });

    return;
  }

  // 5c. Off-Topic Query: Decline politely without touching vector storage
  if (classification.intent === "OFF_TOPIC" || !classification.isSupportRelated) {
    const offTopicReply = `I am an automated assistant dedicated strictly to answering questions about ${brandTitle}. I cannot help with general requests or creative tasks, but I'm happy to help with our product!`;

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: offTopicReply,
        metadata: {
          model: "openai/gpt-oss-20b",
          intentStatus: "OFF_TOPIC",
          reason: classification.reason,
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: conversation.status,
        lastMessage: broadcastPayload,
      },
    });

    return;
  }

  // 6. Vector Similarity Search
  const chunks = await searchSimilarChunks({
    workspaceId,
    queryText: messageText,
    limit: 5,
  });

  const topSimilarity = chunks[0]?.similarity ?? 0;

  // Guardrail A: Top chunk similarity < handoffThreshold
  if (chunks.length === 0 || topSimilarity < handoffThreshold) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "WAITING_HUMAN", updatedAt: new Date() },
    });

    const handoffNotice =
      "I'm not completely sure about that based on our documentation. Let me connect you with a human team member.";

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: handoffNotice,
        metadata: {
          model: "guardrail-a-threshold",
          topSimilarity,
          handoff: true,
          reason: "Top chunk similarity below threshold",
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    // Transition real-time status in chat room and operator inbox
    await broadcastToPartyKit(chatRoomId, {
      type: "status:changed",
      payload: { status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:status_changed",
      payload: { conversationId, status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: "WAITING_HUMAN",
        lastMessage: broadcastPayload,
      },
    });

    return;
  }

  // 7. Grounded Synthesis with Real-Time Streaming
  const messageId = `ai_msg_${Date.now()}`;

  await broadcastToPartyKit(chatRoomId, {
    type: "stream:start",
    payload: { conversationId, messageId },
  });

  try {
    const synthesis = await streamGroundedSynthesis({
      brandTitle,
      queryText: messageText,
      contextChunks: chunks,
      onToken: (chunk) => {
        broadcastToPartyKit(chatRoomId, {
          type: "stream:chunk",
          payload: { conversationId, messageId, chunk },
        }).catch((err) => console.error("[PartyKit] Failed to stream chunk:", err));
      },
    });

    // Guardrail B: Synthesis model outputs [HANDOFF_REQUIRED]
    if (synthesis.isHandoffRequired) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { status: "WAITING_HUMAN", updatedAt: new Date() },
      });

      const handoffNotice =
        "I want to make sure you get the exact right answer. I'm handing this over to a live operator who will assist you shortly.";

      const botMessage = await prisma.message.create({
        data: {
          conversationId,
          sender: "bot",
          text: handoffNotice,
          metadata: {
            model: "guardrail-b-model-handoff",
            topSimilarity,
            handoff: true,
            reason: "Model output [HANDOFF_REQUIRED]",
          },
        },
      });

      const broadcastPayload = {
        id: botMessage.id,
        conversationId,
        sender: botMessage.sender,
        text: botMessage.text,
        createdAt: botMessage.createdAt.toISOString(),
        metadata: botMessage.metadata,
      };

      await broadcastToPartyKit(chatRoomId, {
        type: "stream:end",
        payload: { conversationId, messageId, fullText: handoffNotice },
      });

      await broadcastToPartyKit(chatRoomId, {
        type: "status:changed",
        payload: { status: "WAITING_HUMAN" },
      });

      await broadcastToPartyKit(inboxRoomId, {
        type: "conversation:status_changed",
        payload: { conversationId, status: "WAITING_HUMAN" },
      });

      await broadcastToPartyKit(chatRoomId, {
        type: "message",
        payload: broadcastPayload,
      });

      await broadcastToPartyKit(inboxRoomId, {
        type: "conversation:updated",
        payload: {
          conversationId,
          status: "WAITING_HUMAN",
          lastMessage: broadcastPayload,
        },
      });

      return;
    }

    // Grounded synthesis completed successfully
    await broadcastToPartyKit(chatRoomId, {
      type: "stream:end",
      payload: { conversationId, messageId, fullText: synthesis.fullText },
    });

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: synthesis.fullText,
        metadata: {
          model: "openai/gpt-oss-120b",
          topSimilarity,
          retrievedChunksCount: chunks.length,
          retrievedChunks: chunks.map((c) => ({
            documentName: c.documentName || "Knowledge Doc",
            similarity: c.similarity,
            status: c.similarity >= handoffThreshold ? "USED" : "BELOW_THRESHOLD",
          })),
          sources: Array.from(
            chunks
              .filter((c) => c.similarity >= 0.5)
              .reduce((map, c) => {
                const key = c.documentName || c.documentId || "Knowledge Doc";
                const sim = Math.round(c.similarity * 100);
                const existing = map.get(key);
                if (!existing || sim > existing.similarity) {
                  map.set(key, {
                    documentId: c.documentId,
                    documentName: c.documentName || "Knowledge Doc",
                    similarity: sim,
                    snippet: c.content.slice(0, 160).trim(),
                  });
                }
                return map;
              }, new Map<string, any>())
              .values()
          ),
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: conversation.status,
        lastMessage: broadcastPayload,
      },
    });
  } catch (error) {
    console.error("[AI] Error during grounded synthesis streaming:", error);

    // On critical error, safely hand off to human
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { status: "WAITING_HUMAN", updatedAt: new Date() },
    });

    const errorMessage =
      "I encountered an issue processing your request. Connecting you with a human team member.";

    const botMessage = await prisma.message.create({
      data: {
        conversationId,
        sender: "bot",
        text: errorMessage,
        metadata: {
          error: String(error),
          handoff: true,
        },
      },
    });

    const broadcastPayload = {
      id: botMessage.id,
      conversationId,
      sender: botMessage.sender,
      text: botMessage.text,
      createdAt: botMessage.createdAt.toISOString(),
      metadata: botMessage.metadata,
    };

    await broadcastToPartyKit(chatRoomId, {
      type: "stream:end",
      payload: { conversationId, messageId, fullText: errorMessage },
    });

    await broadcastToPartyKit(chatRoomId, {
      type: "status:changed",
      payload: { status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:status_changed",
      payload: { conversationId, status: "WAITING_HUMAN" },
    });

    await broadcastToPartyKit(chatRoomId, {
      type: "message",
      payload: broadcastPayload,
    });

    await broadcastToPartyKit(inboxRoomId, {
      type: "conversation:updated",
      payload: {
        conversationId,
        status: "WAITING_HUMAN",
        lastMessage: broadcastPayload,
      },
    });
  }
}
