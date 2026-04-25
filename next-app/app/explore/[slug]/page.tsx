"use client";

import { useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Explorer } from "@duckviz/explorer";
import type { DuckvizDataset } from "@duckviz/explorer";
import { DATASETS } from "@/lib/datasets/registry";
import { useDashboardCrud } from "@/lib/use-dashboard-crud";
import { customFetch } from "@/lib/duckviz-fetch";

export default function ExplorePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const meta = DATASETS.find((d) => d.slug === slug);
  const { dashboards, createDashboard, addWidget, saveDashboardWithWidgets } =
    useDashboardCrud(slug);

  const datasets = useMemo<DuckvizDataset[]>(() => {
    const toDataset = (d: (typeof DATASETS)[number]): DuckvizDataset => ({
      name: d.name,
      tableName: d.tableName,
      data: async () => {
        const r = await fetch(`/api/datasets/${d.slug}`);
        return r.json();
      },
    });
    const current = DATASETS.find((d) => d.slug === slug);
    const rest = DATASETS.filter((d) => d.slug !== slug);
    return (current ? [current, ...rest] : rest).map(toDataset);
  }, [slug]);

  const handleNavigate = useCallback(
    (dashboardId: string) => router.push(`/dashboard/${dashboardId}`),
    [router],
  );

  // Consolidated hook — fires once after the AI builder finishes persisting.
  // Useful for analytics/notifications; the per-widget PATCH calls in
  // `createDashboard` + `addWidget` already own the actual write. This
  // guarantees server + client are in sync with the final widget layout.
  const handleDashboardSaved = useCallback(
    (
      dashboardId: string,
      payload: { name: string; widgets: unknown[] },
    ) => {
      console.info(
        `[duckviz] dashboard "${payload.name}" (${dashboardId}) saved with ${payload.widgets.length} widget(s)`,
      );
    },
    [],
  );

  const handleWidgetGenerated = useCallback(
    (w: { type: string; title: string }) => {
      console.info(`[duckviz] widget generated: ${w.type} — ${w.title}`);
    },
    [],
  );

  const handleWidgetRemoved = useCallback((id: string) => {
    console.info(`[duckviz] widget removed from preview: ${id}`);
  }, []);

  // Keep the URL in sync with the active dataset — lets users share a link
  // to the dataset they're exploring and refresh into the same state.
  const handleDatasetChange = useCallback(
    (datasetId: string) => {
      const meta = DATASETS.find((d) => d.tableName === datasetId);
      if (meta && meta.slug !== slug) {
        router.replace(`/explore/${meta.slug}`);
      }
    },
    [slug, router],
  );

  const handleError = useCallback(
    (err: { source: "ingest" | "widget-flow"; message: string }) => {
      console.error(`[duckviz:${err.source}] ${err.message}`);
    },
    [],
  );

  if (!meta) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: "var(--muted)" }}>Dataset not found</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Explorer
        datasets={datasets}
        dropTablesOnUnmount={true}
        dashboards={dashboards}
        onCreateDashboard={createDashboard}
        onAddWidgetToDashboard={addWidget}
        onSaveDashboardWithWidgets={saveDashboardWithWidgets}
        onNavigateToDashboard={handleNavigate}
        onDashboardSaved={handleDashboardSaved}
        onWidgetGenerated={handleWidgetGenerated}
        onWidgetRemoved={handleWidgetRemoved}
        onDatasetChange={handleDatasetChange}
        onError={handleError}
        sidebarAsPopover
        authenticated={!!process.env.NEXT_PUBLIC_DUCKVIZ_TOKEN || true}
        customFetch={customFetch}
        persistence={false}
      />
    </div>
  );
}
