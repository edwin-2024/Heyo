export type ConversationStatus =
  | "WAITING_HUMAN"
  | "AI_ANSWERING"
  | "HUMAN_ACTIVE"
  | "CLOSED";

export type FilterTab = "all" | "waiting" | "ai" | "you" | "closed";

export interface RetrievedChunk {
  documentName: string;
  similarity: number;
  status: "USED" | "BELOW_THRESHOLD";
  excerpt?: string;
}

export interface AiReasoning {
  classification: "SUPPORT_QUESTION" | "OFF_TOPIC" | "CHITCHAT";
  classificationLabel: string;
  statusBadge: string;
  thresholdNote: string;
  bestMatchThreshold: number;
  secondaryThreshold: number;
  retrievedChunks: RetrievedChunk[];
  modelsUsed: string;
  latencyFirstWordMs: number;
  latencyTotalSeconds: number;
  tokensIn: number;
  tokensOut: number;
}

export interface MessageCitation {
  documentName: string;
  similarity?: number;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  sender: "visitor" | "ai" | "operator" | "system";
  senderName: string;
  text: string;
  createdAt: string;
  citation?: MessageCitation;
  aiReasoning?: AiReasoning;
}

export interface VisitorProfile {
  id: string;
  name: string;
  handle: string;
  avatarSeed: string;
  avatarExpression?: string;
  isOnline: boolean;
  email?: string;
  location: string;
  localTime: string;
  language: string;
  device: string;
  browser: string;
  os: string;
  currentPage: string;
  cameFrom: string;
  firstSeen: string;
  lastSeen: string;
  visitsCount: number;
}

export interface ConversationItem {
  id: string;
  visitor: VisitorProfile;
  status: ConversationStatus;
  handoffReason?: string;
  lastMessageSnippet: string;
  lastMessageAt: string;
  relativeTime: string;
  unreadCount?: number;
  messages: ConversationMessage[];
  startedAt: string;
  assignedOperator?: string;
}
