"use client";

import React, { useState } from "react";
import { HeaderBanner } from "./HeaderBanner";
import { KpiMetricsGrid } from "./KpiMetricsGrid";
import { WidgetConfigPanel } from "./WidgetConfigPanel";
import { WidgetSimulator } from "./WidgetSimulator";
import { WidgetSettings, DEFAULT_WIDGET_SETTINGS } from "./types";

interface HomeDashboardOverviewProps {
  userName?: string | null;
  workspaceName?: string;
}

export function HomeDashboardOverview({
  userName = "Operator",
  workspaceName = "Primary Org (v1)",
}: HomeDashboardOverviewProps) {
  const [settings, setSettings] = useState<WidgetSettings>(DEFAULT_WIDGET_SETTINGS);

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-10">
      {/* 1. Top Header Banner */}
      <HeaderBanner userName={userName} workspaceName={workspaceName} />

      {/* 2. KPI Metrics Grid */}
      <KpiMetricsGrid />

      {/* 3. Two-Column Operational Core */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Widget Configuration & Integration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <WidgetConfigPanel settings={settings} onChange={setSettings} />
        </div>

        {/* Right Column: Interactive Live Widget Simulator (5 cols sticky) */}
        <div className="lg:col-span-5 sticky top-6">
          <WidgetSimulator settings={settings} />
        </div>
      </div>
    </div>
  );
}
