import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/dashboards";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDashboard(id);
  if (!db) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(db);
}
