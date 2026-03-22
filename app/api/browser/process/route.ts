import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processBrowserTask } from "@/lib/browser-agent";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { taskId?: string };
    if (!body.taskId?.trim()) {
      return NextResponse.json({ error: "taskId required" }, { status: 400 });
    }
    const task = await prisma.browserTask.findUnique({
      where: { id: body.taskId },
    });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
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
