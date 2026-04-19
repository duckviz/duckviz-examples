"use client";

import { useEffect, useRef, useState } from "react";
import { DATASETS } from "@/lib/datasets/registry";
import type { DashboardConfig } from "@/lib/dashboards";
import type { DuckvizDataset } from "@duckviz/db";

/**
 * Fetches a dashboard config + every dataset its widgets reference.
 * Returns datasets for the builder's `datasets` prop — auto-ingest
 * is handled internally by ReportBuilder/DeckBuilder/Dashboard.
 *
 * Why we pre-fetch rows into arrays instead of passing async loaders
 * (like the Explorer pages do): `useAutoIngest` only runs loader datasets
 * whose derived tableName matches `activeId`. Dashboard/ReportBuilder/
 * DeckBuilder don't pass `activeId`, so loader-data datasets would be
 * silently skipped and widgets fail with "DuckDB not initialized".
 *
 * Cross-dataset dashboards are supported: we scan every widget's SQL for
 * `"t_*"` table references (including joins inside a single query), dedup,
 * and fetch all of them in parallel. `db.datasetSlug` is kept as a hint
 * for legacy dashboards whose widgets wouldn't parse cleanly.
 */

/** Extract all `"t_*"`-style table names referenced in a SQL string. */
function extractTableNames(sql: string): string[] {
  const matches = sql.matchAll(/"(t_[a-z0-9_]+)"/gi);
  const out = new Set<string>();
  for (const m of matches) out.add(m[1]!.toLowerCase());
  return [...out];
}

export function useDashboardWithData(dashboardId: string) {
  const [dashboard, setDashboard] = useState<DashboardConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasets, setDatasets] = useState<DuckvizDataset[]>([]);
  const [dataReady, setDataReady] = useState(false);
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

      // Build the set of tables every widget touches. Include the saved
      // datasetSlug as a seed so legacy dashboards still work even if a
      // widget SQL is stored weirdly.
      const tableNames = new Set<string>();
      for (const w of db.widgets) {
        for (const t of extractTableNames(w.dataKey)) tableNames.add(t);
      }
      const seed = DATASETS.find((d) => d.slug === db.datasetSlug);
      if (seed) tableNames.add(seed.tableName);

      // Resolve each table to a DATASETS entry. Unknown tables are logged
      // and dropped — the widget will surface "table does not exist" and
      // Dashboard's onWidgetError hook will bubble it to the host.
      const metas = [...tableNames]
        .map((t) => DATASETS.find((d) => d.tableName === t))
        .filter((m): m is (typeof DATASETS)[number] => !!m);

      // Fetch every referenced dataset's rows in parallel.
      const fetched = await Promise.all(
        metas.map(async (meta) => {
          const r = await fetch(`/api/datasets/${meta.slug}`);
          const rows = await r.json();
          return { name: meta.name, data: rows, tableName: meta.tableName };
        }),
      );

      setDatasets(fetched);
      setDashboard(db);
      setDataReady(true);
    })();
  }, [dashboardId]);

  return { dashboard, error, ready: dataReady, datasets };
}
