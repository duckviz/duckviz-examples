"use client";

import { useEffect, useRef, useState } from "react";
import { DATASETS } from "@/lib/datasets/registry";
import type { DashboardConfig } from "@/lib/dashboards";
import type { DuckvizDataset } from "@duckviz/db";

/**
 * Fetches a dashboard config + its dataset rows.
 * Returns datasets for the builder's `datasets` prop — auto-ingest
 * is handled internally by ReportBuilder/DeckBuilder/Dashboard.
 */
export function useDashboardWithData(dashboardId: string) {
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DuckvizDataset[]>([]);
  const loadingRef = useRef<string | null>(null);

  useEffect(() => {
    if (loadingRef.current === dashboardId) return;
    loadingRef.current = dashboardId;

    (async () => {
      const res = await fetch(`/api/dashboards/${dashboardId}`);
      if (!res.ok) {
        setError("Dashboard not found");
        return;
      }
      const db: DashboardConfig = await res.json();
      setDashboard(db);

      const meta = DATASETS.find((d) => d.slug === db.datasetSlug);
      if (meta) {
        const dataRes = await fetch(`/api/datasets/${db.datasetSlug}`);
        const rows = await dataRes.json();
        setDatasets([{ name: meta.name, data: rows, tableName: meta.tableName }]);
      }
    })();
  }, [dashboardId]);

  return { dashboard, error, ready: dashboard !== null, datasets };
}
