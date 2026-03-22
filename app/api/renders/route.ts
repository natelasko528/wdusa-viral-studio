import { NextResponse } from "next/server";
import { startRenderJob } from "@/lib/render-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Parameters<typeof startRenderJob>[0];
    const result = await startRenderJob(body);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status =
      message.includes("not found") || message.includes("Provide")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
