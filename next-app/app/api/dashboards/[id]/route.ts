import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDashboard, saveDashboard, deleteDashboard } from "@/lib/dashboards";

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
    db.widgets.push({
      id: nanoid(8),
      type: w.type,
      title: w.title,
      description: w.description || "",
      dataKey: w.duckdbQuery || w.dataKey || "",
      config: w.config,
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
