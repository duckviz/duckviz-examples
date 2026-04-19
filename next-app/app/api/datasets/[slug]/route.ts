import { NextResponse } from "next/server";
import { getDataset } from "@/lib/datasets/registry";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const dataset = getDataset(slug);
  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }
  return NextResponse.json(dataset.rows);
}
