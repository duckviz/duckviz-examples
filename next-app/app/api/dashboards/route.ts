import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { listDashboards, saveDashboard } from "@/lib/dashboards";
import type { DashboardConfig } from "@/lib/dashboards";

export async function GET() {
  const dashboards = listDashboards();
  return NextResponse.json(dashboards);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { id, name, description, datasetSlug } = body;

  if (!name || !datasetSlug) {
    return NextResponse.json({ error: "name and datasetSlug required" }, { status: 400 });
  }

  const config: DashboardConfig = {
    id: id || nanoid(10),
    name,
    description: description || undefined,
    datasetSlug,
    widgets: [],
    createdAt: new Date().toISOString(),
  };

  saveDashboard(config);
  return NextResponse.json(config, { status: 201 });
}
