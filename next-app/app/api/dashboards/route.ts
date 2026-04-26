import { NextResponse } from "next/server";
import { listDashboards } from "@/lib/dashboards";

export async function GET() {
  return NextResponse.json(listDashboards());
}
