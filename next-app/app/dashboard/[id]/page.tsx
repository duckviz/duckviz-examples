"use client";

import { useCallback } from "react";
import { useParams } from "next/navigation";
import { Dashboard } from "@duckviz/dashboard";
import type { DashboardConfig as PkgDashboardConfig } from "@duckviz/dashboard";
import { useDashboardWithData } from "@/lib/use-dashboard-data";
import { Loading } from "@/components/loading";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { dashboard, error, ready, datasets } = useDashboardWithData(id);

  const handleWidgetError = useCallback((widgetId: string, message: string) => {
    console.error(`[duckviz:dashboard] widget ${widgetId} failed: ${message}`);
  }, []);

  const handleReady = useCallback(() => {
    console.info(`[duckviz:dashboard] ${id} ready (all widgets settled)`);
  }, [id]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: "var(--muted)" }}>{error}</p>
      </div>
    );
  }

  if (!ready) return <Loading message="Loading dashboard..." />;

  if (dashboard!.widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-lg" style={{ color: "var(--foreground)" }}>
            {dashboard!.name}
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            This dashboard has no widgets.
          </p>
        </div>
      </div>
    );
  }

  const config: PkgDashboardConfig = {
    name: dashboard!.name,
    widgets: dashboard!.widgets.map((w) => ({
      id: w.id,
      type: w.type,
      title: w.title,
      description: w.description,
      dataKey: w.dataKey,
      config: w.config,
      layout: w.layout,
    })),
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--foreground)" }}
          >
            {dashboard!.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {dashboard!.widgets.length} widget
            {dashboard!.widgets.length !== 1 ? "s" : ""} ·{" "}
            {dashboard!.datasetSlug}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Dashboard
          config={config}
          datasets={datasets}
          dropTablesOnUnmount={true}
          onWidgetError={handleWidgetError}
          onReady={handleReady}
        />
      </div>
    </div>
  );
}
