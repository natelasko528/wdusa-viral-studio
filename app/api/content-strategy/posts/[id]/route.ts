import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["draft", "generating", "ready", "scheduled", "published", "failed"]).optional(),
  hook: z.string().optional(),
  body: z.string().optional(),
  cta: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  caption: z.string().optional(),
  mediaUrls: z.array(z.string()).optional(),
  scheduledFor: z.string().optional(),
  renderJobId: z.string().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const post = await prisma.contentPost.findUnique({
      where: { id },
      include: {
        renderJob: { select: { id: true, status: true, outputUrl: true } },
        calendarSlot: true,
      },
    });
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const raw = await req.json();
    const body = updateSchema.parse(raw);

    const post = await prisma.contentPost.update({
      where: { id },
      data: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.hook !== undefined ? { hook: body.hook } : {}),
        ...(body.body !== undefined ? { body: body.body } : {}),
        ...(body.cta !== undefined ? { cta: body.cta } : {}),
        ...(body.hashtags !== undefined ? { hashtags: body.hashtags } : {}),
        ...(body.caption !== undefined ? { caption: body.caption } : {}),
        ...(body.mediaUrls !== undefined ? { mediaUrls: body.mediaUrls } : {}),
        ...(body.scheduledFor !== undefined ? { scheduledFor: new Date(body.scheduledFor) } : {}),
        ...(body.renderJobId !== undefined ? { renderJobId: body.renderJobId } : {}),
      },
    });

    return NextResponse.json({ post });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.contentPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
