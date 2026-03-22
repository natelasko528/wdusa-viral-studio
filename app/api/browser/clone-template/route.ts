import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";
import { processBrowserTask } from "@/lib/browser-agent";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const input = (await req.json()) as Record<string, unknown>;
    const task = await prisma.browserTask.create({
      data: {
        type: "clone_template",
        status: "queued",
        input: asPrismaInputJson(input),
      },
    });
    await processBrowserTask(task.id);
    const updated = await prisma.browserTask.findUnique({
      where: { id: task.id },
    });
    return NextResponse.json({ task: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
