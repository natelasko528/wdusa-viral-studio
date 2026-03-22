import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractOutputUrl,
  getRender,
  mapCreatomateStatus,
} from "@/lib/creatomate";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const job = await prisma.renderJob.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (!job.creatomateRenderId) {
      return NextResponse.json({ job, creatomate: null });
    }

    const cm = await getRender(job.creatomateRenderId);
    const mapped = mapCreatomateStatus(cm.status);
    const url = extractOutputUrl(cm);

    let nextStatus = job.status;
    let outputUrl = job.outputUrl;
    let error = job.error;

    if (mapped === "succeeded") {
      if (url) {
        nextStatus = "succeeded";
        outputUrl = url;
      } else {
        nextStatus = "rendering";
      }
    } else if (mapped === "failed") {
      nextStatus = "failed";
      error = cm.error_message ?? "Creatomate render failed";
    } else if (mapped === "rendering") {
      nextStatus = "rendering";
    }

    const updated =
      nextStatus !== job.status ||
      outputUrl !== job.outputUrl ||
      error !== job.error
        ? await prisma.renderJob.update({
            where: { id: job.id },
            data: {
              status: nextStatus,
              outputUrl: outputUrl ?? undefined,
              error: error ?? undefined,
            },
          })
        : job;

    return NextResponse.json({
      job: updated,
      creatomate: { status: cm.status, url: cm.url },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
