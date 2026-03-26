import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  WEEKLY_CONTENT_CALENDAR,
  PLATFORM_SPECS,
  COPY_FRAMEWORKS,
  type CalendarSlotTemplate,
} from "@/lib/content-strategy";

const querySchema = z.object({
  startDate: z.string().optional(),
  platforms: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const query = querySchema.parse({
      startDate: url.searchParams.get("startDate") ?? undefined,
      platforms: url.searchParams.get("platforms") ?? undefined,
    });

    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const platforms = query.platforms?.split(",").filter(Boolean) as
      | (typeof PLATFORM_SPECS extends Record<infer K, unknown> ? K : never)[]
      | undefined;

    let slots: CalendarSlotTemplate[] = WEEKLY_CONTENT_CALENDAR;
    if (platforms?.length) {
      slots = slots.filter((s) => (platforms as string[]).includes(s.platform));
    }

    const enriched = slots.map((slot) => {
      const date = new Date(startDate);
      const dayOffset = (slot.dayOfWeek - startDate.getDay() + 7) % 7;
      date.setDate(date.getDate() + dayOffset);
      const [hours, minutes] = slot.timeSlot.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);

      const fw = COPY_FRAMEWORKS.find((f) => f.id === slot.framework);
      const platformSpec = PLATFORM_SPECS[slot.platform];

      return {
        ...slot,
        date: date.toISOString(),
        frameworkName: fw?.name ?? slot.framework,
        frameworkDescription: fw?.description,
        platformLabel: platformSpec.label,
      };
    });

    return NextResponse.json({ slots: enriched, weekOf: startDate.toISOString() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const createSlotSchema = z.object({
  date: z.string(),
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  contentType: z.enum(["reel", "image_post", "carousel", "story", "text_post"]),
  timeSlot: z.string(),
  topic: z.string().optional(),
  campaignProfile: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const body = createSlotSchema.parse(raw);
    const date = new Date(body.date);

    const slot = await prisma.contentCalendarSlot.create({
      data: {
        date,
        dayOfWeek: date.getDay(),
        timeSlot: body.timeSlot,
        platform: body.platform,
        contentType: body.contentType,
        topic: body.topic ?? null,
        campaignProfile: body.campaignProfile ?? "nate_landing",
      },
    });

    return NextResponse.json({ slot });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
