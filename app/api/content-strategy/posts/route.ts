import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  contentType: z.enum(["reel", "image_post", "carousel", "story", "text_post"]),
  campaignProfile: z.string().optional(),
  hook: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  caption: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional(),
  renderJobId: z.string().optional(),
  platformMeta: z.record(z.unknown()).optional(),
  scheduledFor: z.string().optional(),
  calendarSlotId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const platform = url.searchParams.get("platform") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

    const posts = await prisma.contentPost.findMany({
      where: {
        ...(platform ? { platform: platform as never } : {}),
        ...(status ? { status: status as never } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { renderJob: { select: { id: true, status: true, outputUrl: true } } },
    });

    return NextResponse.json({ posts, count: posts.length });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const body = createSchema.parse(raw);

    const post = await prisma.contentPost.create({
      data: {
        platform: body.platform,
        contentType: body.contentType,
        campaignProfile: body.campaignProfile ?? "nate_landing",
        hook: body.hook ?? null,
        body: body.body ?? null,
        cta: body.cta ?? null,
        hashtags: body.hashtags ?? [],
        caption: body.caption ?? null,
        mediaUrls: body.mediaUrls ?? [],
        thumbnailUrl: body.thumbnailUrl ?? null,
        renderJobId: body.renderJobId ?? null,
        platformMeta: body.platformMeta ?? undefined,
        scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : null,
        calendarSlotId: body.calendarSlotId ?? null,
        status: "draft",
      },
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
