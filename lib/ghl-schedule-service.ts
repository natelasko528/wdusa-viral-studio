import { prisma } from "@/lib/prisma";
import { createSocialPost, requireLocationId } from "@/lib/ghl";

function extractPostId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id === "string") return o.id;
  if (o.post && typeof o.post === "object") {
    const p = o.post as Record<string, unknown>;
    if (typeof p.id === "string") return p.id;
  }
  return null;
}

export async function scheduleRenderToGhl(params: {
  renderJobId: string;
  accountIds: string[];
  userId: string;
  scheduleDate: string;
  summary: string;
  type?: "post" | "story" | "reel";
  status?: "scheduled" | "draft" | "published";
}) {
  const job = await prisma.renderJob.findUnique({
    where: { id: params.renderJobId },
  });
  if (!job?.outputUrl) {
    throw new Error(
      "Render job missing outputUrl; wait until render succeeds",
    );
  }

  const locationId = await requireLocationId();
  const postType = params.type ?? "reel";
  const scheduleDate = new Date(params.scheduleDate);
  const isFuture = scheduleDate.getTime() > Date.now();
  const status = params.status ?? (isFuture ? "scheduled" : "draft");

  const payload = {
    accountIds: params.accountIds,
    summary: params.summary,
    scheduleDate: scheduleDate.toISOString(),
    type: postType,
    userId: params.userId,
    status,
    media: [{ url: job.outputUrl, type: "video/mp4" }],
  };

  const rawResponse = await createSocialPost(locationId, payload);
  const ghlPostId = extractPostId(rawResponse);

  const row = await prisma.scheduledPost.create({
    data: {
      renderJobId: job.id,
      ghlPostId,
      accountIds: params.accountIds,
      scheduleDate,
      caption: params.summary,
      mediaUrl: job.outputUrl,
      postType,
      status: status === "scheduled" ? "scheduled" : "pending",
      rawResponse:
        typeof rawResponse === "object" && rawResponse !== null
          ? (rawResponse as object)
          : { raw: String(rawResponse) },
    },
  });

  return { scheduledPost: row, ghlPostId };
}
