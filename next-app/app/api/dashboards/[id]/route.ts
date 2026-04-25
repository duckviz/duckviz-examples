import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import {
  getDashboard,
  saveDashboard,
  deleteDashboard,
  deriveSlugFromSql,
} from "@/lib/dashboards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDashboard(id);
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(db);
}

// Beacon-tunneled PATCH: the dashboard page uses navigator.sendBeacon on
// unmount/pagehide to flush a pending layout save. sendBeacon only supports
// POST, so we accept POST + `?_method=PATCH` and forward to the PATCH handler.
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const url = new URL(request.url);
  if (url.searchParams.get("_method") === "PATCH") {
    return PATCH(request, ctx);
  }
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
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
