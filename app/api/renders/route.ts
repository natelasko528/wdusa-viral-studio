import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRender } from "@/lib/creatomate";
import { mergeModifications } from "@/lib/modifications";

type Body = {
  campaignProfile?: string;
  videoTemplateId?: string;
  creatomateTemplateId?: string;
  hook?: string;
  subhead?: string;
  cta?: string;
  modifications?: Record<string, unknown>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const campaignProfile = body.campaignProfile ?? "nate_landing";

    let templateId = body.creatomateTemplateId;
    let baseMods: Record<string, unknown> = {};

    if (body.videoTemplateId) {
      const t = await prisma.videoTemplate.findUnique({
        where: { id: body.videoTemplateId },
      });
      if (!t) {
        return NextResponse.json(
          { error: "Video template not found" },
          { status: 404 },
        );
      }
      templateId = t.creatomateTemplateId;
      baseMods = (t.defaultModifications as Record<string, unknown>) ?? {};
    }

    if (!templateId) {
      return NextResponse.json(
        { error: "Provide creatomateTemplateId or videoTemplateId" },
        { status: 400 },
      );
    }

    const textLayers: Record<string, unknown> = {};
    if (body.hook !== undefined) textLayers["Hook-Text"] = body.hook;
    if (body.subhead !== undefined) textLayers["Subhead-Text"] = body.subhead;
    if (body.cta !== undefined) textLayers["CTA-Text"] = body.cta;

    const modifications = mergeModifications(
      baseMods,
      { ...textLayers, ...(body.modifications ?? {}) },
    );

    const inputSnapshot = {
      campaignProfile,
      videoTemplateId: body.videoTemplateId ?? null,
      creatomateTemplateId: templateId,
      modifications,
    };

    const job = await prisma.renderJob.create({
      data: {
        status: "queued",
        campaignProfile,
        videoTemplateId: body.videoTemplateId ?? null,
        inputSnapshot,
      },
    });

    const { id: renderId } = await createRender({
      template_id: templateId,
      modifications,
    });

    const updated = await prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: "rendering",
        creatomateRenderId: renderId,
      },
    });

    return NextResponse.json({ job: updated });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
