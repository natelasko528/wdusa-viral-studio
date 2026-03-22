import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";
import { createRender, createRenderRequest } from "@/lib/creatomate";
import { mergeModifications } from "@/lib/modifications";
import { buildWdusaReel } from "@/lib/renderscript";

export type TemplateRenderBody = {
  mode?: "template";
  campaignProfile?: string;
  videoTemplateId?: string;
  creatomateTemplateId?: string;
  hook?: string;
  subhead?: string;
  cta?: string;
  modifications?: Record<string, unknown>;
};

export type RenderscriptRenderBody = {
  mode: "renderscript";
  campaignProfile?: string;
  hook: string;
  subhead: string;
  cta: string;
  phone?: string;
  imageUrls?: string[];
  headshotUrl?: string;
  accentColor?: string;
  /** Full override; if set, other text fields are ignored for the payload */
  renderscript?: Record<string, unknown>;
};

export type StartRenderBody = TemplateRenderBody | RenderscriptRenderBody;

export async function startRenderJob(body: StartRenderBody) {
  const campaignProfile = body.campaignProfile ?? "nate_landing";

  if (body.mode === "renderscript") {
    const rs =
      body.renderscript ??
      buildWdusaReel({
        hook: body.hook,
        subhead: body.subhead,
        cta: body.cta,
        phone: body.phone,
        backgroundUrls: body.imageUrls ?? [],
        headshotUrl: body.headshotUrl,
        accentColor: body.accentColor,
      });

    const inputSnapshot = {
      mode: "renderscript" as const,
      campaignProfile,
      renderscript: rs,
    };

    const job = await prisma.renderJob.create({
      data: {
        status: "queued",
        campaignProfile,
        videoTemplateId: null,
        inputSnapshot: asPrismaInputJson(inputSnapshot),
      },
    });

    const { id: renderId } = await createRenderRequest(rs);
    const updated = await prisma.renderJob.update({
      where: { id: job.id },
      data: {
        status: "rendering",
        creatomateRenderId: renderId,
      },
    });
    return { job: updated };
  }

  let templateId = body.creatomateTemplateId;
  let baseMods: Record<string, unknown> = {};

  if (body.videoTemplateId) {
    const t = await prisma.videoTemplate.findUnique({
      where: { id: body.videoTemplateId },
    });
    if (!t) throw new Error("Video template not found");
    templateId = t.creatomateTemplateId;
    baseMods = (t.defaultModifications as Record<string, unknown>) ?? {};
  }

  if (!templateId) {
    throw new Error("Provide creatomateTemplateId or videoTemplateId");
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
    mode: "template" as const,
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
      inputSnapshot: asPrismaInputJson(inputSnapshot),
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

  return { job: updated };
}
