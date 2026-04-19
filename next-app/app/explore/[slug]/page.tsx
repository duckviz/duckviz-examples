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
  const { dashboards, createDashboard, addWidget } = useDashboardCrud(slug);

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
        onNavigateToDashboard={handleNavigate}
        sidebarAsPopover
        authenticated={!!process.env.NEXT_PUBLIC_DUCKVIZ_TOKEN || true}
        customFetch={customFetch}
        persistence={false}
      />
    </div>
  );
}
