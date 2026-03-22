import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSocialPost, requireLocationId } from "@/lib/ghl";

type Body = {
  renderJobId: string;
  accountIds: string[];
  userId: string;
  scheduleDate: string;
  summary: string;
  type?: "post" | "story" | "reel";
  status?: "scheduled" | "draft" | "published";
};

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

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    if (
      !body.renderJobId ||
      !body.accountIds?.length ||
      !body.userId ||
      !body.scheduleDate ||
      !body.summary
    ) {
      return NextResponse.json(
        { error: "renderJobId, accountIds, userId, scheduleDate, summary required" },
        { status: 400 },
      );
    }

    const job = await prisma.renderJob.findUnique({
      where: { id: body.renderJobId },
    });
    if (!job?.outputUrl) {
      return NextResponse.json(
        { error: "Render job missing outputUrl; wait until render succeeds" },
        { status: 400 },
      );
    }

    const locationId = requireLocationId();
    const postType = body.type ?? "reel";
    const scheduleDate = new Date(body.scheduleDate);
    const isFuture = scheduleDate.getTime() > Date.now();
    const status =
      body.status ?? (isFuture ? "scheduled" : "draft");

    const payload = {
      accountIds: body.accountIds,
      summary: body.summary,
      scheduleDate: scheduleDate.toISOString(),
      type: postType,
      userId: body.userId,
      status,
      media: [{ url: job.outputUrl, type: "video/mp4" }],
    };

    const rawResponse = await createSocialPost(locationId, payload);
    const ghlPostId = extractPostId(rawResponse);

    const row = await prisma.scheduledPost.create({
      data: {
        renderJobId: job.id,
        ghlPostId,
        accountIds: body.accountIds,
        scheduleDate,
        caption: body.summary,
        mediaUrl: job.outputUrl,
        postType,
        status: status === "scheduled" ? "scheduled" : "pending",
        rawResponse:
          typeof rawResponse === "object" && rawResponse !== null
            ? (rawResponse as object)
            : { raw: String(rawResponse) },
      },
    });

    return NextResponse.json({ scheduledPost: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
