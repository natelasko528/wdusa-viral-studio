import { NextResponse } from "next/server";
import { z } from "zod";
import { createRenderRequest } from "@/lib/creatomate";
import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";
import {
  buildImagePost,
  buildCarouselSlides,
  buildStoryImage,
  buildPlatformReel,
} from "@/lib/image-renderscript";

const imagePostSchema = z.object({
  type: z.literal("image_post"),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  headline: z.string(),
  subtext: z.string().optional(),
  ctaText: z.string().optional(),
  backgroundUrl: z.string().optional(),
  brandColor: z.string().optional(),
  phone: z.string().optional(),
  style: z.enum(["bold", "clean", "dark", "editorial"]).optional(),
  campaignProfile: z.string().optional(),
});

const carouselSchema = z.object({
  type: z.literal("carousel"),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  title: z.string(),
  slides: z.array(z.object({
    headline: z.string(),
    body: z.string().optional(),
    backgroundUrl: z.string().optional(),
  })).min(1).max(10),
  ctaText: z.string().optional(),
  brandColor: z.string().optional(),
  phone: z.string().optional(),
  style: z.enum(["bold", "clean", "dark", "editorial"]).optional(),
  campaignProfile: z.string().optional(),
});

const storySchema = z.object({
  type: z.literal("story"),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  headline: z.string(),
  subtext: z.string().optional(),
  ctaText: z.string().optional(),
  backgroundUrl: z.string().optional(),
  brandColor: z.string().optional(),
  swipeUpText: z.string().optional(),
  campaignProfile: z.string().optional(),
});

const reelSchema = z.object({
  type: z.literal("reel"),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  hook: z.string(),
  subhead: z.string(),
  cta: z.string(),
  phone: z.string().optional(),
  backgroundUrls: z.array(z.string()).optional(),
  headshotUrl: z.string().optional(),
  accentColor: z.string().optional(),
  campaignProfile: z.string().optional(),
});

const bodySchema = z.discriminatedUnion("type", [
  imagePostSchema,
  carouselSchema,
  storySchema,
  reelSchema,
]);

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const body = bodySchema.parse(raw);
    const campaignProfile = ("campaignProfile" in body ? body.campaignProfile : undefined) ?? "nate_landing";

    let renderScripts: Record<string, unknown>[];

    switch (body.type) {
      case "image_post":
        renderScripts = [buildImagePost(body)];
        break;
      case "carousel":
        renderScripts = buildCarouselSlides(body);
        break;
      case "story":
        renderScripts = [buildStoryImage(body)];
        break;
      case "reel":
        renderScripts = [buildPlatformReel({
          ...body,
          backgroundUrls: body.backgroundUrls ?? [],
        })];
        break;
    }

    const jobs = await Promise.all(
      renderScripts.map(async (script) => {
        const job = await prisma.renderJob.create({
          data: {
            status: "queued",
            campaignProfile,
            inputSnapshot: asPrismaInputJson({ contentStrategy: true, type: body.type, script }),
          },
        });

        const { id: renderId } = await createRenderRequest(script);
        return prisma.renderJob.update({
          where: { id: job.id },
          data: { status: "rendering", creatomateRenderId: renderId },
        });
      }),
    );

    return NextResponse.json({
      jobs: jobs.map((j) => ({
        id: j.id,
        status: j.status,
        creatomateRenderId: j.creatomateRenderId,
      })),
      count: jobs.length,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
