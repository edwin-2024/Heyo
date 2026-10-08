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
  handoffThreshold: 0.65,
  offlineEmailCapture: true,
  allowedDomains: "https://example.com, localhost:3000",
  workspaceId: "ws_live_01",
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
