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
}

export function HomeDashboardOverview({
  userName = "Operator",
  workspaceName: initialWorkspaceName = "Primary Org (v1)",
}: HomeDashboardOverviewProps) {
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_WIDGET_SETTINGS);
  const [workspaceName, setWorkspaceName] = useState(initialWorkspaceName);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "idle">("idle");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load workspace and widget settings from Neon Postgres DB on mount
  useEffect(() => {
    let mounted = true;
    orpc.workspace
      .getWorkspace()
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
  }, []);

  // 2. Persist to Postgres with debounce
  const persistSettings = useCallback((newSettings: WidgetSettings) => {
    if (!newSettings.workspaceId) return;

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
    <div className="max-w-7xl mx-auto space-y-7 pb-10">
      {/* 1. Top Header Banner with Save Status Indicator */}
      <div className="relative">
        <HeaderBanner userName={userName} workspaceName={workspaceName} />
        <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-medium">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving to Neon DB...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-medium animate-in fade-in">
              <Check className="h-3 w-3" /> Saved to Neon DB
            </span>
          )}
        </div>
      </div>

      {/* 2. KPI Metrics Grid */}
      <KpiMetricsGrid />

      {/* 3. Two-Column Operational Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Widget Configuration & Integration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <WidgetConfigPanel settings={settings} onChange={handleSettingsChange} />
        </div>

        {/* Right Column: Interactive Live Widget Simulator (5 cols sticky) */}
        <div className="lg:col-span-5 sticky top-6">
          <WidgetSimulator settings={settings} />
        </div>
      </div>
    </div>
  );
}
