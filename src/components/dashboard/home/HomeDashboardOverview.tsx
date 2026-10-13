"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { HeaderBanner } from "./HeaderBanner";
import { KpiMetricsGrid } from "./KpiMetricsGrid";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { WidgetSimulator } from "./WidgetSimulator";
import { WidgetSettings, DEFAULT_WIDGET_SETTINGS } from "./types";
import { orpc } from "@/lib/orpc";
import { Check, Loader2 } from "lucide-react";

interface HomeDashboardOverviewProps {
  userName?: string | null;
  workspaceName?: string;
  initialWorkspace?: {
    id: string;
    name: string;
    widgetSettings?: any;
  } | null;
}

export function HomeDashboardOverview({
  userName = "Operator",
  workspaceName: initialWorkspaceName = "Primary Org (v1)",
  initialWorkspace,
}: HomeDashboardOverviewProps) {
  const [settings, setSettings] = useState<WidgetSettings>(() => {
    if (initialWorkspace?.id) {
      const wsSettings = initialWorkspace.widgetSettings;
      return {
        workspaceId: initialWorkspace.id,
        brandTitle: wsSettings?.brandTitle ?? initialWorkspace.name ?? DEFAULT_WIDGET_SETTINGS.brandTitle,
        botDisplayName: wsSettings?.botDisplayName ?? DEFAULT_WIDGET_SETTINGS.botDisplayName,
        primaryColor: wsSettings?.primaryColor ?? DEFAULT_WIDGET_SETTINGS.primaryColor,
        themeMode: (wsSettings?.themeMode as WidgetSettings["themeMode"]) ?? DEFAULT_WIDGET_SETTINGS.themeMode,
        position: (wsSettings?.position as WidgetSettings["position"]) ?? DEFAULT_WIDGET_SETTINGS.position,
        botAvatarType: (wsSettings?.botAvatarType as WidgetSettings["botAvatarType"]) ?? DEFAULT_WIDGET_SETTINGS.botAvatarType,
        customAvatarUrl: wsSettings?.customAvatarUrl ?? "",
        welcomeMessage: wsSettings?.welcomeMessage ?? DEFAULT_WIDGET_SETTINGS.welcomeMessage,
        allowHumanEscalation: wsSettings?.allowHumanEscalation ?? DEFAULT_WIDGET_SETTINGS.allowHumanEscalation,
        handoffThreshold: wsSettings?.handoffThreshold ?? DEFAULT_WIDGET_SETTINGS.handoffThreshold,
        offlineEmailCapture: wsSettings?.offlineEmailCapture ?? DEFAULT_WIDGET_SETTINGS.offlineEmailCapture,
        allowedDomains: wsSettings?.allowedDomains ?? DEFAULT_WIDGET_SETTINGS.allowedDomains,
        suggestedQuestions: wsSettings?.suggestedQuestions ?? DEFAULT_WIDGET_SETTINGS.suggestedQuestions,
      };
    }
    return DEFAULT_WIDGET_SETTINGS;
  });

  const [workspaceName, setWorkspaceName] = useState(
    initialWorkspace?.name || initialWorkspaceName
  );
  const [isLoading, setIsLoading] = useState(!initialWorkspace?.id);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if initialWorkspace updates
  useEffect(() => {
    if (initialWorkspace?.id && settings.workspaceId !== initialWorkspace.id) {
      const wsSettings = initialWorkspace.widgetSettings;
      setSettings({
        workspaceId: initialWorkspace.id,
        brandTitle: wsSettings?.brandTitle ?? initialWorkspace.name ?? DEFAULT_WIDGET_SETTINGS.brandTitle,
        botDisplayName: wsSettings?.botDisplayName ?? DEFAULT_WIDGET_SETTINGS.botDisplayName,
        primaryColor: wsSettings?.primaryColor ?? DEFAULT_WIDGET_SETTINGS.primaryColor,
        themeMode: (wsSettings?.themeMode as WidgetSettings["themeMode"]) ?? DEFAULT_WIDGET_SETTINGS.themeMode,
        position: (wsSettings?.position as WidgetSettings["position"]) ?? DEFAULT_WIDGET_SETTINGS.position,
        botAvatarType: (wsSettings?.botAvatarType as WidgetSettings["botAvatarType"]) ?? DEFAULT_WIDGET_SETTINGS.botAvatarType,
        customAvatarUrl: wsSettings?.customAvatarUrl ?? "",
        welcomeMessage: wsSettings?.welcomeMessage ?? DEFAULT_WIDGET_SETTINGS.welcomeMessage,
        allowHumanEscalation: wsSettings?.allowHumanEscalation ?? DEFAULT_WIDGET_SETTINGS.allowHumanEscalation,
        handoffThreshold: wsSettings?.handoffThreshold ?? DEFAULT_WIDGET_SETTINGS.handoffThreshold,
        offlineEmailCapture: wsSettings?.offlineEmailCapture ?? DEFAULT_WIDGET_SETTINGS.offlineEmailCapture,
        allowedDomains: wsSettings?.allowedDomains ?? DEFAULT_WIDGET_SETTINGS.allowedDomains,
        suggestedQuestions: wsSettings?.suggestedQuestions ?? DEFAULT_WIDGET_SETTINGS.suggestedQuestions,
      });
      setWorkspaceName(initialWorkspace.name);
      setIsLoading(false);
    }
  }, [initialWorkspace, settings.workspaceId]);

  // 1. Load workspace and widget settings from Neon Postgres DB on mount if needed
  useEffect(() => {
    let mounted = true;
    orpc.workspace
      .getWorkspace({ workspaceId: initialWorkspace?.id || undefined })
      .then((ws) => {
        if (!mounted || !ws) return;
        if (ws.name) setWorkspaceName(ws.name);
        if (ws.widgetSettings) {
          const wsSettings = ws.widgetSettings;
          setSettings({
            workspaceId: ws.id,
            brandTitle: wsSettings.brandTitle ?? DEFAULT_WIDGET_SETTINGS.brandTitle,
            botDisplayName: wsSettings.botDisplayName ?? DEFAULT_WIDGET_SETTINGS.botDisplayName,
            primaryColor: wsSettings.primaryColor ?? DEFAULT_WIDGET_SETTINGS.primaryColor,
            themeMode: (wsSettings.themeMode as WidgetSettings["themeMode"]) ?? DEFAULT_WIDGET_SETTINGS.themeMode,
            position: (wsSettings.position as WidgetSettings["position"]) ?? DEFAULT_WIDGET_SETTINGS.position,
            botAvatarType: (wsSettings.botAvatarType as WidgetSettings["botAvatarType"]) ?? DEFAULT_WIDGET_SETTINGS.botAvatarType,
            customAvatarUrl: wsSettings.customAvatarUrl ?? "",
            welcomeMessage: wsSettings.welcomeMessage ?? DEFAULT_WIDGET_SETTINGS.welcomeMessage,
            allowHumanEscalation: wsSettings.allowHumanEscalation ?? DEFAULT_WIDGET_SETTINGS.allowHumanEscalation,
            handoffThreshold: wsSettings.handoffThreshold ?? DEFAULT_WIDGET_SETTINGS.handoffThreshold,
            offlineEmailCapture: wsSettings.offlineEmailCapture ?? DEFAULT_WIDGET_SETTINGS.offlineEmailCapture,
            allowedDomains: wsSettings.allowedDomains ?? DEFAULT_WIDGET_SETTINGS.allowedDomains,
            suggestedQuestions: wsSettings.suggestedQuestions ?? DEFAULT_WIDGET_SETTINGS.suggestedQuestions,
          });
        } else {
          setSettings((prev) => ({ ...prev, workspaceId: ws.id }));
        }
      })
      .catch((err) => {
        console.error("Failed to load workspace from Postgres:", err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [initialWorkspace?.id]);

  // 2. Persist to Postgres with debounce
  const persistSettings = useCallback((newSettings: WidgetSettings) => {
    if (!newSettings.workspaceId || newSettings.workspaceId === "ws_live_01") return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await orpc.workspace.updateWidgetSettings({
          workspaceId: newSettings.workspaceId,
          settings: {
            brandTitle: newSettings.brandTitle,
            botDisplayName: newSettings.botDisplayName,
            primaryColor: newSettings.primaryColor,
            themeMode: newSettings.themeMode,
            position: newSettings.position,
            botAvatarType: newSettings.botAvatarType,
            customAvatarUrl: newSettings.customAvatarUrl ?? "",
            welcomeMessage: newSettings.welcomeMessage,
            allowHumanEscalation: newSettings.allowHumanEscalation,
            handoffThreshold: newSettings.handoffThreshold,
            offlineEmailCapture: newSettings.offlineEmailCapture,
            allowedDomains: newSettings.allowedDomains,
            suggestedQuestions: newSettings.suggestedQuestions,
          },
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch (err) {
        console.error("Failed to save widget settings to Postgres:", err);
        setSaveStatus("idle");
      }
    }, 600);
  }, []);

  const handleSettingsChange = (newSettings: WidgetSettings) => {
    setSettings(newSettings);
    persistSettings(newSettings);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Top Header Banner with Save Status Indicator */}
      <div className="relative">
        <HeaderBanner
          userName={userName}
          workspaceName={workspaceName}
        />
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          {saveStatus === "saving" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border animate-pulse shadow-xs">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Saving...
            </div>
          )}
          {saveStatus === "saved" && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <Check className="h-3 w-3" /> Saved to Neon DB
            </div>
          )}
        </div>
      </div>

      {/* 2. Top-line Operator KPI Health Metrics Grid */}
      <KpiMetricsGrid />

      {/* 3. Main Dual Panel: Configuration on Left & Real-time Live Simulator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Configuration Tabs */}
        <div className="lg:col-span-7 space-y-6">
          <WidgetConfigPanel
            settings={settings}
            onChange={handleSettingsChange}
          />
        </div>

        {/* Right Column: Sticky Live Interactive Widget Simulator */}
        <div className="lg:col-span-5 sticky top-6">
          <WidgetSimulator settings={settings} />
        </div>
      </div>
    </div>
  );
}
