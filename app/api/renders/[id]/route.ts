import { NextResponse } from "next/server";
import { pollRenderJobById } from "@/lib/poll-render-job";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { job, creatomate } = await pollRenderJobById(id);
    return NextResponse.json({
      job,
      creatomate: creatomate
        ? { status: creatomate.status, url: creatomate.url }
        : null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
