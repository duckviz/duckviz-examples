import { redirect } from "next/navigation";
import { listDashboards } from "@/lib/dashboards";

export default function HomePage() {
  const dashboards = listDashboards();
  if (dashboards.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-1 text-lg" style={{ color: "var(--foreground)" }}>
            No dashboards
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Drop a dashboard JSON into <code>data/dashboards/</code>.
          </p>
        </div>
      </div>
    );
  }
  redirect(`/dashboard/${dashboards[0]!.id}`);
}
