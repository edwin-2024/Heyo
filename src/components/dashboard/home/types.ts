export interface WidgetSettings {
  brandTitle: string;
  botDisplayName: string;
  primaryColor: string;
  themeMode: "dark" | "light" | "system";
  position: "right" | "left";
  botAvatarType: "glass" | "bot" | "sparkle" | "custom";
  customAvatarUrl?: string;
  welcomeMessage: string;
  allowHumanEscalation: boolean;
  handoffThreshold: number; // e.g. 0.65
  offlineEmailCapture: boolean;
  allowedDomains: string;
  workspaceId: string;
  suggestedQuestions?: string;
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
  brandTitle: "Heyo Support",
  botDisplayName: "Heyo AI Agent",
  primaryColor: "#0284c7", // Sky blue / default modern accent
  themeMode: "system",
  position: "right",
  botAvatarType: "glass",
  customAvatarUrl: "",
  welcomeMessage: "Hey there! 👋 How can our team or AI assistant help you today?",
  allowHumanEscalation: true,
  handoffThreshold: 0.55,
  offlineEmailCapture: true,
  allowedDomains: "http://localhost:3000, http://localhost:4000, http://localhost:5000, https://example.com",
  workspaceId: "ws_live_01",
  suggestedQuestions: JSON.stringify([
    "How do I request a refund?",
    "What are your subscription pricing plans?",
    "What are the API rate limits?",
  ]),
};

export interface ChatMessage {
  id: string;
  sender: "visitor" | "bot" | "operator" | "system";
  text: string;
  timestamp: string;
  isOffTopic?: boolean;
  isHandoff?: boolean;
  confidenceScore?: number;
  metadata?: {
    model?: string;
    latencyMs?: number;
    intentStatus?: "ON_TOPIC" | "OFF_TOPIC" | "HANDOFF_ESCALATION";
  };
}
