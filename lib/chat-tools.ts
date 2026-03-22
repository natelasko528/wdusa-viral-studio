import { tool } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { asPrismaInputJson } from "@/lib/prisma-json";
import { startRenderJob } from "@/lib/render-service";
import { pollRenderJobById } from "@/lib/poll-render-job";
import { buildWdusaReel } from "@/lib/renderscript";
import {
  listSocialAccounts,
  listUsersForLocation,
  requireLocationId,
} from "@/lib/ghl";
import { scheduleRenderToGhl } from "@/lib/ghl-schedule-service";

export const wdusaChatTools = {
  search_kb: tool({
    description:
      "Search WDUSA knowledge base facts (hooks, contact, offers, images). Use nate_landing for Nate's phone and booking URL.",
    inputSchema: z.object({
      profile: z.enum(["nate_landing", "corporate"]).default("nate_landing"),
      category: z.string().optional(),
      query: z.string().optional(),
      limit: z.number().min(1).max(100).default(30),
    }),
    execute: async ({ profile, category, query, limit }) => {
      const facts = await prisma.kbFact.findMany({
        where: {
          campaignProfiles: { has: profile },
          ...(category ? { category } : {}),
          ...(query
            ? {
                OR: [
                  { content: { contains: query, mode: "insensitive" } },
                  { key: { contains: query, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        take: limit,
        orderBy: [{ category: "asc" }, { key: "asc" }],
        select: {
          id: true,
          category: true,
          key: true,
          content: true,
          sourceUrl: true,
          sourceSite: true,
        },
      });
      return { count: facts.length, facts };
    },
  }),

  list_templates: tool({
    description: "List active video templates (Creatomate template IDs in DB).",
    inputSchema: z.object({
      includeInactive: z.boolean().optional(),
    }),
    execute: async ({ includeInactive }) => {
      const templates = await prisma.videoTemplate.findMany({
        where: includeInactive ? {} : { active: true },
        orderBy: { name: "asc" },
        select: {
          id: true,
          name: true,
          creatomateTemplateId: true,
          aspectRatio: true,
          active: true,
          defaultModifications: true,
        },
      });
      return { templates };
    },
  }),

  build_renderscript: tool({
    description:
      "Build a 9:16 MP4 RenderScript JSON (no Creatomate editor template). Pass hook, subhead, cta, optional image URLs.",
    inputSchema: z.object({
      hook: z.string(),
      subhead: z.string(),
      cta: z.string(),
      phone: z.string().optional(),
      imageUrls: z.array(z.string()).optional(),
      headshotUrl: z.string().optional(),
      accentColor: z.string().optional(),
    }),
    execute: async (input) => {
      const script = buildWdusaReel({
        hook: input.hook,
        subhead: input.subhead,
        cta: input.cta,
        phone: input.phone,
        backgroundUrls: input.imageUrls ?? [],
        headshotUrl: input.headshotUrl,
        accentColor: input.accentColor,
      });
      return { renderscript: script };
    },
  }),

  start_render: tool({
    description:
      "Start a Creatomate render. Use mode template with videoTemplateId OR mode renderscript with hook/subhead/cta.",
    inputSchema: z.discriminatedUnion("mode", [
      z.object({
        mode: z.literal("template"),
        campaignProfile: z.string().optional(),
        videoTemplateId: z.string(),
        hook: z.string().optional(),
        subhead: z.string().optional(),
        cta: z.string().optional(),
      }),
      z.object({
        mode: z.literal("renderscript"),
        campaignProfile: z.string().optional(),
        hook: z.string(),
        subhead: z.string(),
        cta: z.string(),
        phone: z.string().optional(),
        imageUrls: z.array(z.string()).optional(),
        headshotUrl: z.string().optional(),
      }),
    ]),
    execute: async (input) => {
      const job = await startRenderJob(
        input.mode === "template"
          ? {
              mode: "template",
              campaignProfile: input.campaignProfile,
              videoTemplateId: input.videoTemplateId,
              hook: input.hook,
              subhead: input.subhead,
              cta: input.cta,
            }
          : {
              mode: "renderscript",
              campaignProfile: input.campaignProfile,
              hook: input.hook,
              subhead: input.subhead,
              cta: input.cta,
              phone: input.phone,
              imageUrls: input.imageUrls,
              headshotUrl: input.headshotUrl,
            },
      );
      return {
        jobId: job.job.id,
        creatomateRenderId: job.job.creatomateRenderId,
        status: job.job.status,
      };
    },
  }),

  poll_render: tool({
    description: "Poll render job status and get output MP4 URL when succeeded.",
    inputSchema: z.object({
      jobId: z.string(),
    }),
    execute: async ({ jobId }) => {
      const { job, creatomate } = await pollRenderJobById(jobId);
      return {
        status: job.status,
        outputUrl: job.outputUrl,
        error: job.error,
        creatomateStatus: creatomate?.status ?? null,
      };
    },
  }),

  list_ghl_accounts: tool({
    description: "List GHL Social Planner accounts for the configured location.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const locationId = await requireLocationId();
        const data = await listSocialAccounts(locationId);
        return { ok: true as const, data };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
  }),

  list_ghl_users: tool({
    description: "List GHL users for userId required when scheduling posts.",
    inputSchema: z.object({}),
    execute: async () => {
      try {
        const locationId = await requireLocationId();
        const data = await listUsersForLocation(locationId);
        return { ok: true as const, data };
      } catch (e) {
        return {
          ok: false as const,
          error: e instanceof Error ? e.message : String(e),
        };
      }
    },
  }),

  schedule_post: tool({
    description:
      "Schedule a completed render to GHL as a Reel. Requires outputUrl on the render job.",
    inputSchema: z.object({
      renderJobId: z.string(),
      accountIds: z.array(z.string()),
      userId: z.string(),
      scheduleDate: z.string(),
      summary: z.string(),
      type: z.enum(["reel", "post", "story"]).optional(),
    }),
    execute: async (input) => {
      const result = await scheduleRenderToGhl({
        renderJobId: input.renderJobId,
        accountIds: input.accountIds,
        userId: input.userId,
        scheduleDate: input.scheduleDate,
        summary: input.summary,
        type: input.type,
      });
      return {
        scheduledPostId: result.scheduledPost.id,
        ghlPostId: result.ghlPostId,
      };
    },
  }),

  update_template_text: tool({
    description:
      "Merge text into a VideoTemplate defaultModifications (Creatomate layer names: Hook-Text, Subhead-Text, CTA-Text).",
    inputSchema: z.object({
      templateId: z.string(),
      hookText: z.string().optional(),
      subheadText: z.string().optional(),
      ctaText: z.string().optional(),
    }),
    execute: async ({ templateId, hookText, subheadText, ctaText }) => {
      const t = await prisma.videoTemplate.findUnique({ where: { id: templateId } });
      if (!t) return { ok: false as const, error: "Template not found" };
      const cur = (t.defaultModifications as Record<string, unknown>) ?? {};
      const next = { ...cur };
      if (hookText !== undefined) next["Hook-Text"] = hookText;
      if (subheadText !== undefined) next["Subhead-Text"] = subheadText;
      if (ctaText !== undefined) next["CTA-Text"] = ctaText;
      await prisma.videoTemplate.update({
        where: { id: templateId },
        data: { defaultModifications: asPrismaInputJson(next) },
      });
      return { ok: true as const, defaultModifications: next };
    },
  }),

  create_browser_task: tool({
    description:
      "Queue a Playwright browser automation task (Creatomate editor). Check status in BrowserTask table or Templates UI.",
    inputSchema: z.object({
      type: z.enum([
        "create_template",
        "clone_template",
        "export_renderscript",
      ]),
      input: z.record(z.string(), z.any()),
    }),
    execute: async ({ type, input }) => {
      const map = {
        create_template: "create_template",
        clone_template: "clone_template",
        export_renderscript: "export_renderscript",
      } as const;
      const task = await prisma.browserTask.create({
        data: {
          type: map[type],
          status: "queued",
          input: asPrismaInputJson(input),
        },
      });
      return {
        taskId: task.id,
        status: task.status,
        message:
          "Task queued. Run POST /api/browser/process with { taskId } to execute, or use Templates → Create via Browser Agent (runs immediately).",
      };
    },
  }),
};

export const WDUSA_SYSTEM_PROMPT = `You are the WDUSA Viral Studio assistant for Nate Lasko, a Window Depot USA Milwaukee sales consultant.

Default campaign profile: nate_landing (use unless the user asks for corporate-only).
Canonical contact for nate_landing: phone (414) 312-5213, booking https://wdusa-nate-landing.vercel.app/, email nlasko.wdusa.milwaukee@gmail.com, company site https://windowdepotmilwaukee.com/

Products: windows (ProVia triple pane), doors, siding, roofing, flooring, bath. Offers and claims must match KB source tags; prefer sourced facts from search_kb.

When generating Reels copy, keep hooks short and punchy. For video without a Creatomate template, use start_render with mode renderscript.

Always confirm destructive actions. For GHL scheduling, use future scheduleDate with status scheduled.`;
