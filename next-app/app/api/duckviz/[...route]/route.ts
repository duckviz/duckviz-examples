import { createDuckvizHandlers } from "@duckviz/sdk/next";

const handlers = createDuckvizHandlers({
  token: process.env.DUCKVIZ_TOKEN || "",
});

// Wrap to satisfy Next.js 15 strict route typing
export async function POST(request: Request, ctx: { params: Promise<{ route: string[] }> }) {
  return handlers.POST(request, ctx);
}

export async function GET(request: Request, ctx: { params: Promise<{ route: string[] }> }) {
  return handlers.GET(request, ctx);
}
