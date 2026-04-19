"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Explorer } from "@duckviz/explorer";
import type { DuckvizDataset } from "@duckviz/explorer";
import { DATASETS } from "@/lib/datasets/registry";
import { useDashboardCrud } from "@/lib/use-dashboard-crud";
import { customFetch } from "@/lib/duckviz-fetch";

export default function HomePage() {
  const router = useRouter();
  const { dashboards, createDashboard, addWidget } = useDashboardCrud("all");

  const datasets = useMemo<DuckvizDataset[]>(
    () =>
      DATASETS.map((meta) => ({
        name: meta.name,
        tableName: meta.tableName,
        data: async () => {
          const res = await fetch(`/api/datasets/${meta.slug}`);
          if (!res.ok) throw new Error(`Failed to load ${meta.slug}`);
          return res.json();
        },
      })),
    [],
  );

  const handleNavigate = useCallback(
    (dashboardId: string) => router.push(`/dashboard/${dashboardId}`),
    [router],
  );

  return (
    <div className="h-full">
      <Explorer
        datasets={datasets}
        sidebarAsPopover
        dropTablesOnUnmount
        dashboards={dashboards}
        onCreateDashboard={createDashboard}
        onAddWidgetToDashboard={addWidget}
        onNavigateToDashboard={handleNavigate}
        authenticated
        customFetch={customFetch}
        persistence={false}
      />
    </div>
  );
}
