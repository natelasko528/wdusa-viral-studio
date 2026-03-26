import { NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getEffectiveCredential } from "@/lib/stored-credentials";
import {
  buildContentPrompt,
  PLATFORM_SPECS,
  COPY_FRAMEWORKS,
  pickHashtags,
  formatCaptionForPlatform,
  truncateToLimit,
  type GeneratedContent,
} from "@/lib/content-strategy";

const bodySchema = z.object({
  platform: z.enum(["instagram", "facebook", "tiktok", "twitter", "linkedin", "youtube_shorts"]),
  contentType: z.enum(["reel", "image_post", "carousel", "story", "text_post"]),
  framework: z.string().optional(),
  topic: z.string().min(1),
  product: z.string().optional(),
  campaignProfile: z.string().optional(),
  kbFacts: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    const body = bodySchema.parse(raw);

    const apiKey = await getEffectiveCredential("OPENAI_API_KEY");
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
    }

    const openai = createOpenAI({ apiKey });
    const spec = PLATFORM_SPECS[body.platform];
    const defaultFramework =
      body.framework ??
      COPY_FRAMEWORKS.find(
        (f) => f.platforms.includes(body.platform) && f.bestFor.includes(body.contentType),
      )?.id ??
      "hook_story_offer";

    const prompt = buildContentPrompt({
      platform: body.platform,
      contentType: body.contentType,
      framework: defaultFramework,
      topic: body.topic,
      product: body.product,
      kbFacts: body.kbFacts,
      campaignProfile: body.campaignProfile,
    });

    const result = streamText({
      model: openai("gpt-4o"),
      prompt,
    });

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    let parsed: GeneratedContent;
    try {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      parsed = JSON.parse(jsonMatch[0]) as GeneratedContent;
    } catch {
      parsed = {
        hook: body.topic,
        body: fullText,
        cta: "Book your FREE estimate today!",
        hashtags: pickHashtags(body.platform, body.product ?? "general"),
        visualConcept: "Professional photo related to " + body.topic,
        imagePrompt: body.topic,
      };
    }

    if (!parsed.hashtags?.length) {
      parsed.hashtags = pickHashtags(body.platform, body.product ?? "general");
    }

    const caption = truncateToLimit(
      formatCaptionForPlatform(parsed, body.platform),
      body.platform,
    );

    return NextResponse.json({
      content: parsed,
      caption,
      platform: body.platform,
      contentType: body.contentType,
      framework: defaultFramework,
      charCount: caption.length,
      maxChars: spec.maxCaptionLength,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
