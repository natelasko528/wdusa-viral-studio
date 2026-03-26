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
import {
  PLATFORM_SPECS,
  COPY_FRAMEWORKS,
  buildContentPrompt,
  pickHashtags,
  formatCaptionForPlatform,
  truncateToLimit,
  WEEKLY_CONTENT_CALENDAR,
  type GeneratedContent,
} from "@/lib/content-strategy";

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

  get_platform_specs: tool({
    description:
      "Get platform-specific specs and best practices for social media content creation. Returns character limits, hashtag limits, content types, optimal post times, and tone guidance.",
    inputSchema: z.object({
      platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
    }),
    execute: async ({ platform }) => {
      const spec = PLATFORM_SPECS[platform];
      return {
        platform: spec.id,
        label: spec.label,
        maxCaptionLength: spec.maxCaptionLength,
        maxHashtags: spec.maxHashtags,
        supportedContentTypes: spec.supportedContentTypes,
        optimalPostTimes: spec.optimalPostTimes,
        toneGuidance: spec.toneGuidance,
        bestPractices: spec.bestPractices,
        imageSpecs: spec.imageSpecs,
        reelSpecs: spec.reelSpecs,
      };
    },
  }),

  generate_social_post: tool({
    description:
      "Generate a high-converting social media post for a specific platform. Uses AI to create platform-optimized copy with hooks, body text, CTAs, and hashtags using proven copy frameworks.",
    inputSchema: z.object({
      platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
      contentType: z.enum(["reel", "image_post", "carousel", "story", "text_post"]),
      topic: z.string(),
      framework: z.enum(["aida", "pas", "bab", "hook_story_offer", "edu_value", "social_proof"]).optional(),
      product: z.string().optional(),
    }),
    execute: async ({ platform, contentType, topic, framework, product }) => {
      const fw = framework ??
        COPY_FRAMEWORKS.find(
          (f) => f.platforms.includes(platform) && f.bestFor.includes(contentType),
        )?.id ?? "hook_story_offer";

      const prompt = buildContentPrompt({
        platform,
        contentType,
        framework: fw,
        topic,
        product,
      });

      const hashtags = pickHashtags(platform, product ?? "general");

      return {
        prompt,
        suggestedHashtags: hashtags,
        framework: fw,
        platformTone: PLATFORM_SPECS[platform].toneGuidance,
        maxChars: PLATFORM_SPECS[platform].maxCaptionLength,
        message: "Use this prompt context to generate the social post copy. Apply the tone guidance and stay within character limits.",
      };
    },
  }),

  get_content_calendar: tool({
    description:
      "Get the recommended weekly content calendar with posting schedule, platform mix, content types, and topic suggestions.",
    inputSchema: z.object({
      platforms: z.array(z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"])).optional(),
    }),
    execute: async ({ platforms }) => {
      let slots = WEEKLY_CONTENT_CALENDAR;
      if (platforms?.length) {
        slots = slots.filter((s) => (platforms as string[]).includes(s.platform));
      }
      return {
        totalPostsPerWeek: slots.length,
        slots: slots.map((s) => ({
          day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][s.dayOfWeek],
          time: s.timeSlot,
          platform: PLATFORM_SPECS[s.platform].label,
          contentType: s.contentType,
          topic: s.topicSuggestion,
          framework: COPY_FRAMEWORKS.find((f) => f.id === s.framework)?.name ?? s.framework,
        })),
      };
    },
  }),

  save_content_post: tool({
    description:
      "Save a generated social media post to the content library for later scheduling or publishing.",
    inputSchema: z.object({
      platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
      contentType: z.enum(["reel", "image_post", "carousel", "story", "text_post"]),
      hook: z.string().optional(),
      body: z.string().optional(),
      cta: z.string().optional(),
      hashtags: z.array(z.string()).optional(),
      caption: z.string(),
    }),
    execute: async ({ platform, contentType, hook, body, cta, hashtags, caption }) => {
      const post = await prisma.contentPost.create({
        data: {
          platform,
          contentType,
          hook: hook ?? null,
          body: body ?? null,
          cta: cta ?? null,
          hashtags: hashtags ?? [],
          caption,
          status: "draft",
        },
      });
      return {
        postId: post.id,
        status: post.status,
        message: "Post saved as draft. View in Content Strategy → Saved Posts.",
      };
    },
  }),

  list_copy_frameworks: tool({
    description:
      "List available copy frameworks for social media posts. Each framework has a specific structure optimized for different content types and platforms.",
    inputSchema: z.object({}),
    execute: async () => {
      return {
        frameworks: COPY_FRAMEWORKS.map((f) => ({
          id: f.id,
          name: f.name,
          description: f.description,
          structure: f.structure,
          bestFor: f.bestFor,
          platforms: f.platforms.map((p) => PLATFORM_SPECS[p].label),
        })),
      };
    },
  }),
};

export const WDUSA_SYSTEM_PROMPT = `You are the WDUSA Viral Studio assistant for Nate Lasko, a Window Depot USA Milwaukee sales consultant.

Default campaign profile: nate_landing (use unless the user asks for corporate-only).
Canonical contact for nate_landing: phone (414) 312-5213, booking https://wdusa-nate-landing.vercel.app/, email nlasko.wdusa.milwaukee@gmail.com, company site https://windowdepotmilwaukee.com/

Products: windows (ProVia triple pane), doors, siding, roofing, flooring, bath. Offers and claims must match KB source tags; prefer sourced facts from search_kb.

When generating Reels copy, keep hooks short and punchy. For video without a Creatomate template, use start_render with mode renderscript.

Always confirm destructive actions. For GHL scheduling, use future scheduleDate with status scheduled.

CONTENT STRATEGY CAPABILITIES:
- Use get_platform_specs to understand platform-specific requirements before creating content
- Use generate_social_post to build prompts for platform-optimized posts using proven copy frameworks (AIDA, PAS, Before-After-Bridge, Hook-Story-Offer, Educational Value, Social Proof)
- Use get_content_calendar to recommend a weekly posting schedule across platforms
- Use save_content_post to save generated content for later scheduling
- Use list_copy_frameworks to explain available copywriting frameworks
- Always customize content for each platform's tone, character limits, and best practices
- For Instagram: visual-first, use carousel for education, reels under 30s, hashtags in separate block
- For TikTok: raw, trend-aware, hook in 1-2 seconds, 3-5 hashtags only
- For Twitter/X: sharp and punchy, every word counts, 280 char max
- For LinkedIn: professional but personal, structured format, business stories
- For Facebook: community-focused, conversational, ask questions
- For YouTube Shorts: fast-paced, hook-heavy, under 30 seconds`;
