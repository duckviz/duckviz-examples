"use client";

import { useParams, useRouter } from "next/navigation";
import { Dashboard } from "@duckviz/dashboard";
import type { DashboardConfig as PkgDashboardConfig } from "@duckviz/dashboard";
import { useDashboardWithData } from "@/lib/use-dashboard-data";
import { Loading } from "@/components/loading";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { dashboard, error, ready, datasets } = useDashboardWithData(id);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2" style={{ color: "var(--muted)" }}>{error}</p>
          <button
            onClick={() => router.push("/")}
            className="text-sm"
            style={{ color: "var(--primary)" }}
          >
            ← Back to datasets
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return <Loading message="Loading dashboard..." />;

  if (dashboard!.widgets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-lg" style={{ color: "var(--foreground)" }}>{dashboard!.name}</p>
          <p className="mb-4 text-sm" style={{ color: "var(--muted)" }}>
            No widgets yet. Go back to the explorer and add some.
          </p>
          <button
            onClick={() => router.push(`/explore/${dashboard!.datasetSlug}`)}
            className="rounded-md px-4 py-2 text-sm text-white"
            style={{ background: "var(--primary)" }}
          >
            Open Explorer
          </button>
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
    })),
  };

  return (
    <div className="flex h-full flex-col">
      <div
        className="flex items-center justify-between px-6 py-3"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>{dashboard!.name}</h1>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {dashboard!.widgets.length} widget{dashboard!.widgets.length !== 1 ? "s" : ""} · {dashboard!.datasetSlug}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/report/${id}`)}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ background: "var(--surface-hover)", color: "var(--foreground)" }}
          >
            Generate Report
          </button>
          <button
            onClick={() => router.push(`/deck/${id}`)}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ background: "var(--surface-hover)", color: "var(--foreground)" }}
          >
            Create Deck
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Dashboard
          config={config}
          datasets={datasets}
          dropTablesOnUnmount={true}
        />
      </div>
    </div>
  );
}
