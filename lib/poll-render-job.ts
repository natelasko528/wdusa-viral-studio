import { prisma } from "@/lib/prisma";
import {
  extractOutputUrl,
  getRender,
  mapCreatomateStatus,
} from "@/lib/creatomate";

export async function pollRenderJobById(jobId: string) {
  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job) {
    const err = new Error("Render job not found");
    throw err;
  }
  if (!job.creatomateRenderId) {
    return { job, creatomate: null as null };
  }

  const render = await getRender(job.creatomateRenderId);
  const mapped = mapCreatomateStatus(render.status);
  const url = extractOutputUrl(render);

  let updated = job;
  if (mapped === "succeeded" && url) {
    updated = await prisma.renderJob.update({
      where: { id: job.id },
      data: { status: "succeeded", outputUrl: url, error: null },
    });
  } else if (mapped === "failed") {
    updated = await prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: "failed",
        error: render.error_message ?? "Creatomate render failed",
      },
    });
  } else {
    updated = await prisma.renderJob.update({
      where: { id: job.id },
      data: { status: "rendering" },
    });
  }

  return { job: updated, creatomate: render };
}
