import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  listDashboards,
  saveDashboard,
  deriveSlugFromSql,
} from "@/lib/dashboards";
import type { DashboardConfig, DashboardWidget } from "@/lib/dashboards";

export async function GET() {
  const dashboards = listDashboards();
  return NextResponse.json(dashboards);
}

interface IncomingWidget {
  type: string;
  title: string;
  description?: string;
  duckdbQuery?: string;
  dataKey?: string;
  config?: Record<string, unknown>;
  layout?: { x: number; y: number; w: number; h: number };
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, name, description, datasetSlug, widgets } = body as {
    id?: string;
    name?: string;
    description?: string;
    datasetSlug?: string;
    widgets?: IncomingWidget[];
  };

  if (!name || !datasetSlug) {
    return NextResponse.json({ error: "name and datasetSlug required" }, { status: 400 });
  }

  // Materialise widgets up-front so we can both populate the dashboard and
  // derive a concrete slug from their SQL on the same pass. Each gets a
  // server-minted id so callers don't need to know our id format.
  const materialisedWidgets: DashboardWidget[] = (widgets ?? []).map((w) => ({
    id: nanoid(8),
    type: w.type,
    title: w.title,
    description: w.description ?? "",
    dataKey: w.duckdbQuery || w.dataKey || "",
    config: w.config,
    layout: w.layout,
  }));

  // Promote `datasetSlug: "all"` (home-page case) to the real slug as soon
  // as we know it. Same rule the PATCH widget-add path uses; mirrored here
  // so atomic create-with-widgets gets the same outcome as create-then-PATCH.
  let resolvedSlug = datasetSlug;
  if (resolvedSlug === "all" && materialisedWidgets.length > 0) {
    for (const w of materialisedWidgets) {
      const derived = deriveSlugFromSql(w.dataKey);
      if (derived) {
        resolvedSlug = derived;
        break;
      }
    }
  }

  const config: DashboardConfig = {
    id: id || nanoid(10),
    name,
    description: description || undefined,
    datasetSlug: resolvedSlug,
    widgets: materialisedWidgets,
    createdAt: new Date().toISOString(),
  };

  saveDashboard(config);
  return NextResponse.json(config, { status: 201 });
}
