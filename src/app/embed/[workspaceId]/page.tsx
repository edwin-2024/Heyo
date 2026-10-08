import { headers } from "next/headers";
import { prisma } from "@/server/db";
import { EmbedClient } from "./client";
import { UnauthorizedOrigin } from "./unauthorized";

function isOriginAllowed(requestOrigin: string, allowedEntries: string[]): boolean {
  if (allowedEntries.length === 0) return true;
  if (!requestOrigin) return false;

  let reqHost = "";
  try {
    reqHost = new URL(requestOrigin).host; // e.g. "localhost:3000" or "example.com"
  } catch {
    reqHost = requestOrigin.replace(/^https?:\/\//, "").split("/")[0];
  }

  return allowedEntries.some((entry) => {
    const clean = entry.trim();
    if (!clean) return false;

    // Direct string match (e.g. "http://localhost:3000")
    if (requestOrigin === clean) return true;

    // Host matching
    let entryHost = clean;
    try {
      if (clean.startsWith("http://") || clean.startsWith("https://")) {
        entryHost = new URL(clean).host;
      }
    } catch {}

    if (reqHost.toLowerCase() === entryHost.toLowerCase()) return true;

    // Wildcard subdomain matching (e.g. "*.example.com")
    if (entryHost.startsWith("*.")) {
      const root = entryHost.slice(2).toLowerCase();
      const lReq = reqHost.toLowerCase();
      return lReq === root || lReq.endsWith("." + root);
    }

    return false;
  });
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ visitor_token?: string; position?: string; origin?: string }>;
}) {
  const { workspaceId } = await params;
  const { visitor_token, position = "right", origin: queryOrigin } = await searchParams;

  const headerStore = await headers();
  const referer = headerStore.get("referer") || "";

  let refererOrigin = "";
  try {
    if (referer) {
      refererOrigin = new URL(referer).origin;
    }
  } catch (e) {
    // Ignore invalid referer URL
  }

  const effectiveOrigin = (queryOrigin || refererOrigin || "").trim();

  // Fallback defaults if not found
  let settings = {
    primaryColor: "#0284c7",
    allowedDomains: "http://localhost:3000, localhost:3000",
    brandTitle: "Heyo Support",
    botDisplayName: "Heyo AI Agent",
    botAvatarType: "glass",
    customAvatarUrl: "",
    themeMode: "system",
    welcomeMessage: "Hey there! 👋 How can our team or AI assistant help you today?",
  };

  try {
    const dbSettings = await prisma.widgetSettings.findUnique({
      where: { workspaceId },
    });
    if (dbSettings) {
      settings = {
        primaryColor: dbSettings.primaryColor || settings.primaryColor,
        allowedDomains: dbSettings.allowedDomains ?? settings.allowedDomains,
        brandTitle: dbSettings.brandTitle || settings.brandTitle,
        botDisplayName: dbSettings.botDisplayName || settings.botDisplayName,
        botAvatarType: dbSettings.botAvatarType || settings.botAvatarType,
        customAvatarUrl: dbSettings.customAvatarUrl || "",
        themeMode: dbSettings.themeMode || settings.themeMode,
        welcomeMessage: dbSettings.welcomeMessage || settings.welcomeMessage,
      };
    }
  } catch (e) {
    // Ignore DB errors or missing table for now
  }

  const domains = settings.allowedDomains
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);

  // Per ADR-0006: Check allowed domains strictly against the origin
  const allowed = isOriginAllowed(effectiveOrigin, domains);

  if (!allowed) {
    return (
      <UnauthorizedOrigin
        clientOrigin={effectiveOrigin}
        allowedDomains={settings.allowedDomains}
      />
    );
  }

  if (!visitor_token) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-white text-sm text-gray-500 rounded-lg">
        Missing Visitor Token
      </div>
    );
  }

  return (
    <EmbedClient 
      workspaceId={workspaceId} 
      visitorToken={visitor_token} 
      position={position} 
      settings={settings} 
    />
  );
}
