import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDashboard, saveDashboard, deleteDashboard } from "@/lib/dashboards";
import { DATASETS } from "@/lib/datasets/registry";

// Home page creates dashboards with datasetSlug "all" because it hosts
// multiple datasets. The real slug is knowable only once a widget is
// added — the widget's SQL references exactly one DuckDB table.
function deriveSlugFromSql(sql: string): string | null {
  const match = sql.match(/"(t_[a-z0-9_]+)"/i);
  if (!match) return null;
  const tableName = match[1];
  return DATASETS.find((d) => d.tableName === tableName)?.slug ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDashboard(id);
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(db);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDashboard(id);
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  // Add a widget
  if (body.widget) {
    const w = body.widget;
    const dataKey = w.duckdbQuery || w.dataKey || "";
    db.widgets.push({
      id: nanoid(8),
      type: w.type,
      title: w.title,
      description: w.description || "",
      dataKey,
      config: w.config,
      layout: w.layout,
    });
    if (db.datasetSlug === "all") {
      const derived = deriveSlugFromSql(dataKey);
      if (derived) db.datasetSlug = derived;
    }
    saveDashboard(db);
    return NextResponse.json(db);
  }

  // Update widget layouts (debounced client-side after drag/resize)
  if (Array.isArray(body.layouts)) {
    const byId = new Map<string, { x: number; y: number; w: number; h: number }>();
    for (const l of body.layouts) {
      if (l && typeof l.id === "string") {
        byId.set(l.id, { x: l.x, y: l.y, w: l.w, h: l.h });
      }
    }
    db.widgets = db.widgets.map((w) => {
      const next = byId.get(w.id);
      return next ? { ...w, layout: next } : w;
    });
    saveDashboard(db);
    return NextResponse.json(db);
  }

  // Update name/description
  if (body.name) db.name = body.name;
  if (body.description !== undefined) db.description = body.description;
  saveDashboard(db);
  return NextResponse.json(db);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = deleteDashboard(id);
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
