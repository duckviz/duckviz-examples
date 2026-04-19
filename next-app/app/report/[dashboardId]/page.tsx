"use client";

import { useParams, useRouter } from "next/navigation";
import { ReportBuilder } from "@duckviz/report";
import type { FetchFn } from "@duckviz/report";
import { useDashboardWithData } from "@/lib/use-dashboard-data";
import { Loading } from "@/components/loading";

const customFetch: FetchFn = (input, init) => {
  if (typeof input === "string" && input.startsWith("/api/")) {
    input = input.replace(/^\/api\//, "/api/duckviz/");
  }
  return fetch(input, init);
};

export default function ReportPage() {
  const { dashboardId } = useParams<{ dashboardId: string }>();
  const router = useRouter();
  const { dashboard, ready, datasets } = useDashboardWithData(dashboardId);

  if (!ready) return <Loading message="Loading report..." />;

  return (
    <ReportBuilder
      config={{
        name: dashboard!.name,
        widgets: dashboard!.widgets,
      }}
      datasets={datasets}
      onBack={() => router.push(`/dashboard/${dashboardId}`)}
      customFetch={customFetch}
    />
  );
}
