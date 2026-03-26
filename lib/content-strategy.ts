import type { SocialPlatform, ContentType } from "@prisma/client";

// ── Platform Specifications ────────────────────────────────────────

export type PlatformSpec = {
  id: SocialPlatform;
  label: string;
  maxCaptionLength: number;
  maxHashtags: number;
  supportedContentTypes: ContentType[];
  optimalPostTimes: string[];
  imageSpecs: { width: number; height: number; label: string }[];
  reelSpecs: { width: number; height: number; maxDuration: number; label: string }[];
  toneGuidance: string;
  bestPractices: string[];
};

export const PLATFORM_SPECS: Record<SocialPlatform, PlatformSpec> = {
  instagram: {
    id: "instagram",
    label: "Instagram",
    maxCaptionLength: 2200,
    maxHashtags: 30,
    supportedContentTypes: ["reel", "image_post", "carousel", "story"],
    optimalPostTimes: ["11:00", "13:00", "17:00", "19:00"],
    imageSpecs: [
      { width: 1080, height: 1080, label: "Square Post" },
      { width: 1080, height: 1350, label: "Portrait Post" },
      { width: 1080, height: 566, label: "Landscape Post" },
    ],
    reelSpecs: [
      { width: 1080, height: 1920, maxDuration: 90, label: "Reel (9:16)" },
    ],
    toneGuidance: "Visual-first, aspirational. Lead with striking imagery. Use storytelling in captions — hook in first line, value in middle, CTA at end. Emojis welcome but not excessive.",
    bestPractices: [
      "First line is the hook — make it scroll-stopping",
      "Use line breaks for readability",
      "Place hashtags in a comment or after line breaks",
      "Include a clear CTA (link in bio, DM us, comment below)",
      "Use carousel for educational content — 7-10 slides",
      "Reels under 30s get the best reach",
    ],
  },
  facebook: {
    id: "facebook",
    label: "Facebook",
    maxCaptionLength: 63206,
    maxHashtags: 5,
    supportedContentTypes: ["reel", "image_post", "carousel", "text_post"],
    optimalPostTimes: ["09:00", "12:00", "15:00", "18:00"],
    imageSpecs: [
      { width: 1200, height: 630, label: "Link/Share Post" },
      { width: 1080, height: 1080, label: "Square Post" },
    ],
    reelSpecs: [
      { width: 1080, height: 1920, maxDuration: 90, label: "Reel (9:16)" },
    ],
    toneGuidance: "Community-focused, conversational. Ask questions, share stories, invite comments. Less polished is fine — authenticity wins. Longer captions perform better than short.",
    bestPractices: [
      "Ask a question to drive comments",
      "Use social proof (reviews, before/after)",
      "Share local community stories",
      "Video gets 2x engagement over static images",
      "Keep hashtags minimal (3-5 max)",
      "Tag location for local reach",
    ],
  },
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    maxCaptionLength: 4000,
    maxHashtags: 5,
    supportedContentTypes: ["reel", "story"],
    optimalPostTimes: ["07:00", "12:00", "16:00", "21:00"],
    imageSpecs: [],
    reelSpecs: [
      { width: 1080, height: 1920, maxDuration: 180, label: "TikTok Video (9:16)" },
    ],
    toneGuidance: "Raw, educational, trend-aware. Lead with pattern interrupts. Show the process, behind-the-scenes, before/after transformations. Don't be corporate.",
    bestPractices: [
      "Hook in the first 1-2 seconds (text overlay + movement)",
      "Use trending sounds when relevant",
      "Show transformations and before/after",
      "Use on-screen text captions for accessibility",
      "Post 1-3x daily for algorithm favor",
      "Use only 3-5 highly relevant hashtags",
    ],
  },
  twitter: {
    id: "twitter",
    label: "X (Twitter)",
    maxCaptionLength: 280,
    maxHashtags: 3,
    supportedContentTypes: ["text_post", "image_post"],
    optimalPostTimes: ["08:00", "12:00", "17:00"],
    imageSpecs: [
      { width: 1200, height: 675, label: "Timeline Image (16:9)" },
      { width: 1080, height: 1080, label: "Square Image" },
    ],
    reelSpecs: [],
    toneGuidance: "Sharp, witty, punchy. Every word counts. Thread long-form content. Use contrarian takes and real numbers. Be the expert, not the salesperson.",
    bestPractices: [
      "First tweet is everything — make it punchy",
      "Use threads for longer educational content",
      "Images boost engagement 150%",
      "Quote-tweet with opinions for reach",
      "Use 1-2 hashtags max, naturally placed",
      "Engage with replies within first hour",
    ],
  },
  linkedin: {
    id: "linkedin",
    label: "LinkedIn",
    maxCaptionLength: 3000,
    maxHashtags: 5,
    supportedContentTypes: ["text_post", "image_post", "carousel"],
    optimalPostTimes: ["07:30", "10:00", "12:00", "17:30"],
    imageSpecs: [
      { width: 1200, height: 627, label: "Link Post" },
      { width: 1080, height: 1080, label: "Square Post" },
      { width: 1080, height: 1350, label: "Portrait Post" },
    ],
    reelSpecs: [],
    toneGuidance: "Professional but personal. Share lessons learned, industry insights, and behind-the-scenes business stories. Structured format with line breaks. Hook → Story → Insight → CTA.",
    bestPractices: [
      "Hook line + 'Read more' fold — front-load value",
      "Use single-line paragraphs for readability",
      "Document-style carousels get high engagement",
      "Share business lessons and project case studies",
      "Hashtags at the bottom, 3-5 max",
      "Post between Tue-Thu for peak engagement",
    ],
  },
  youtube_shorts: {
    id: "youtube_shorts",
    label: "YouTube Shorts",
    maxCaptionLength: 100,
    maxHashtags: 3,
    supportedContentTypes: ["reel"],
    optimalPostTimes: ["12:00", "15:00", "18:00"],
    imageSpecs: [],
    reelSpecs: [
      { width: 1080, height: 1920, maxDuration: 60, label: "Short (9:16)" },
    ],
    toneGuidance: "Fast-paced, hook-heavy. Pattern interrupt in frame 1. Educational or transformational. Get to the point in under 30 seconds.",
    bestPractices: [
      "First frame must stop the scroll",
      "Keep under 30 seconds for best retention",
      "Use on-screen text throughout",
      "End with a CTA or loop back to start",
      "Title should be searchable (SEO-friendly)",
      "Use #Shorts in description",
    ],
  },
};

// ── Copy Frameworks ────────────────────────────────────────────────

export type CopyFramework = {
  id: string;
  name: string;
  description: string;
  structure: string[];
  bestFor: ContentType[];
  platforms: SocialPlatform[];
};

export const COPY_FRAMEWORKS: CopyFramework[] = [
  {
    id: "aida",
    name: "AIDA",
    description: "Attention → Interest → Desire → Action. Classic sales framework.",
    structure: [
      "ATTENTION: Bold statement, shocking stat, or provocative question",
      "INTEREST: Explain the problem and why it matters to them",
      "DESIRE: Paint the picture of the solution and results",
      "ACTION: Clear CTA with urgency",
    ],
    bestFor: ["image_post", "carousel", "text_post"],
    platforms: ["instagram", "facebook", "linkedin"],
  },
  {
    id: "pas",
    name: "PAS",
    description: "Problem → Agitate → Solve. Drives emotional engagement.",
    structure: [
      "PROBLEM: Name the specific pain point",
      "AGITATE: Make the pain feel real — consequences, frustrations",
      "SOLVE: Present your product/service as the answer + CTA",
    ],
    bestFor: ["text_post", "image_post", "reel"],
    platforms: ["instagram", "facebook", "twitter", "linkedin"],
  },
  {
    id: "bab",
    name: "Before-After-Bridge",
    description: "Show transformation. Perfect for visual before/after content.",
    structure: [
      "BEFORE: Current painful reality",
      "AFTER: Desired outcome (what life looks like after)",
      "BRIDGE: How your product/service gets them there",
    ],
    bestFor: ["reel", "carousel", "image_post"],
    platforms: ["instagram", "tiktok", "facebook", "youtube_shorts"],
  },
  {
    id: "hook_story_offer",
    name: "Hook → Story → Offer",
    description: "Social media native. Pattern interrupt with relatable story.",
    structure: [
      "HOOK: One punchy line that stops the scroll",
      "STORY: Personal or customer story that builds connection",
      "OFFER: What you can do for them + CTA",
    ],
    bestFor: ["reel", "text_post", "image_post"],
    platforms: ["instagram", "tiktok", "facebook", "twitter"],
  },
  {
    id: "edu_value",
    name: "Educational Value",
    description: "Teach something actionable. Builds authority and trust.",
    structure: [
      "HOOK: 'X things you need to know about...' or 'Stop doing this...'",
      "VALUE: Numbered tips, steps, or insights",
      "AUTHORITY: Why you know this (experience, results)",
      "CTA: Save this post / Follow for more",
    ],
    bestFor: ["carousel", "text_post", "reel"],
    platforms: ["instagram", "linkedin", "tiktok"],
  },
  {
    id: "social_proof",
    name: "Social Proof",
    description: "Let results and reviews do the selling.",
    structure: [
      "HEADLINE: Customer result or quote (specific numbers)",
      "CONTEXT: What the problem was",
      "RESULT: What changed after working with you",
      "CTA: Want results like this? [action]",
    ],
    bestFor: ["image_post", "carousel", "reel"],
    platforms: ["instagram", "facebook", "linkedin"],
  },
];

// ── Hashtag Strategy ───────────────────────────────────────────────

export type HashtagSet = {
  category: string;
  tags: string[];
};

export const HASHTAG_LIBRARY: Record<string, HashtagSet[]> = {
  windows: [
    { category: "product", tags: ["#newwindows", "#windowreplacement", "#energyefficientwindows", "#triplepaanewindows", "#ProViaWindows"] },
    { category: "local", tags: ["#MilwaukeeContractor", "#MilwaukeeHomeImprovement", "#WisconsinHomes", "#SEWisconsin", "#MKEhomes"] },
    { category: "industry", tags: ["#homeimprovement", "#homerenovation", "#homeupgrade", "#windowinstallation", "#curbappeal"] },
    { category: "engagement", tags: ["#beforeandafter", "#transformation", "#homemakeover", "#homegoals", "#dreamhome"] },
  ],
  doors: [
    { category: "product", tags: ["#newdoors", "#doorreplacement", "#entrydoor", "#patiodoor", "#frontdoor"] },
    { category: "engagement", tags: ["#curbappeal", "#homeentrance", "#doordesign", "#homestyle"] },
  ],
  siding: [
    { category: "product", tags: ["#newsiding", "#sidingreplacement", "#vinylsiding", "#homesiding"] },
    { category: "engagement", tags: ["#homeexterior", "#curbappeal", "#transformation", "#beforeandafter"] },
  ],
  roofing: [
    { category: "product", tags: ["#newroof", "#roofreplacement", "#roofing", "#roofingcontractor"] },
    { category: "engagement", tags: ["#homeprotection", "#stormready", "#roofinspection"] },
  ],
  general: [
    { category: "brand", tags: ["#WindowDepotUSA", "#WDUSA", "#WDUSAMilwaukee", "#NateLasko"] },
    { category: "trust", tags: ["#5StarReviews", "#BBBAccredited", "#FreeEstimate", "#LocallyOwned"] },
    { category: "value", tags: ["#FreeEstimate", "#NoMoneyDown", "#FinancingAvailable", "#LifetimeWarranty"] },
  ],
};

export function pickHashtags(
  platform: SocialPlatform,
  productCategory: string,
  count?: number,
): string[] {
  const max = count ?? PLATFORM_SPECS[platform].maxHashtags;
  const sets = [
    ...(HASHTAG_LIBRARY[productCategory] ?? []),
    ...HASHTAG_LIBRARY.general,
  ];

  const all = sets.flatMap((s) => s.tags);
  const unique = [...new Set(all)];

  const shuffled = unique.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, max);
}

// ── Content Calendar Generation ────────────────────────────────────

export type CalendarSlotTemplate = {
  dayOfWeek: number;
  timeSlot: string;
  platform: SocialPlatform;
  contentType: ContentType;
  topicSuggestion: string;
  framework: string;
};

export const WEEKLY_CONTENT_CALENDAR: CalendarSlotTemplate[] = [
  // Monday — Educational
  { dayOfWeek: 1, timeSlot: "11:00", platform: "instagram", contentType: "carousel", topicSuggestion: "Educational tips about products", framework: "edu_value" },
  { dayOfWeek: 1, timeSlot: "08:00", platform: "linkedin", contentType: "text_post", topicSuggestion: "Industry insight or business lesson", framework: "edu_value" },
  { dayOfWeek: 1, timeSlot: "12:00", platform: "twitter", contentType: "text_post", topicSuggestion: "Quick tip or homeowner advice", framework: "pas" },

  // Tuesday — Social Proof
  { dayOfWeek: 2, timeSlot: "13:00", platform: "instagram", contentType: "image_post", topicSuggestion: "Customer review or testimonial", framework: "social_proof" },
  { dayOfWeek: 2, timeSlot: "12:00", platform: "facebook", contentType: "image_post", topicSuggestion: "Before/after transformation", framework: "bab" },
  { dayOfWeek: 2, timeSlot: "16:00", platform: "tiktok", contentType: "reel", topicSuggestion: "Before/after reveal video", framework: "bab" },

  // Wednesday — Value / Offers
  { dayOfWeek: 3, timeSlot: "17:00", platform: "instagram", contentType: "reel", topicSuggestion: "Product showcase or installation process", framework: "hook_story_offer" },
  { dayOfWeek: 3, timeSlot: "15:00", platform: "facebook", contentType: "text_post", topicSuggestion: "Current offer or promotion", framework: "aida" },
  { dayOfWeek: 3, timeSlot: "12:00", platform: "youtube_shorts", contentType: "reel", topicSuggestion: "Quick installation tip or fact", framework: "edu_value" },

  // Thursday — Authority / Education
  { dayOfWeek: 4, timeSlot: "11:00", platform: "instagram", contentType: "carousel", topicSuggestion: "How-to guide or myth-busting", framework: "edu_value" },
  { dayOfWeek: 4, timeSlot: "10:00", platform: "linkedin", contentType: "text_post", topicSuggestion: "Case study or project story", framework: "hook_story_offer" },
  { dayOfWeek: 4, timeSlot: "07:00", platform: "tiktok", contentType: "reel", topicSuggestion: "Day in the life / behind-the-scenes", framework: "hook_story_offer" },

  // Friday — Engagement / Fun
  { dayOfWeek: 5, timeSlot: "13:00", platform: "instagram", contentType: "image_post", topicSuggestion: "Team spotlight or job site photo", framework: "hook_story_offer" },
  { dayOfWeek: 5, timeSlot: "09:00", platform: "facebook", contentType: "text_post", topicSuggestion: "Community engagement / question", framework: "pas" },
  { dayOfWeek: 5, timeSlot: "17:00", platform: "twitter", contentType: "text_post", topicSuggestion: "Hot take or industry opinion", framework: "pas" },

  // Saturday — Weekend Content
  { dayOfWeek: 6, timeSlot: "11:00", platform: "instagram", contentType: "reel", topicSuggestion: "Weekend project inspiration", framework: "bab" },
  { dayOfWeek: 6, timeSlot: "12:00", platform: "tiktok", contentType: "reel", topicSuggestion: "Satisfying installation footage", framework: "bab" },

  // Sunday — Soft Sell
  { dayOfWeek: 0, timeSlot: "10:00", platform: "instagram", contentType: "story", topicSuggestion: "Weekly recap or upcoming week preview", framework: "hook_story_offer" },
  { dayOfWeek: 0, timeSlot: "18:00", platform: "facebook", contentType: "image_post", topicSuggestion: "Inspirational home photo", framework: "aida" },
];

export function generateWeekCalendar(
  startDate: Date,
  platforms?: SocialPlatform[],
): CalendarSlotTemplate[] {
  const startDay = startDate.getDay();
  return WEEKLY_CONTENT_CALENDAR.filter((slot) => {
    if (platforms && !platforms.includes(slot.platform)) return false;
    const dayOffset = (slot.dayOfWeek - startDay + 7) % 7;
    return dayOffset < 7;
  });
}

// ── AI Prompt Builder ──────────────────────────────────────────────

export function buildContentPrompt(params: {
  platform: SocialPlatform;
  contentType: ContentType;
  framework: string;
  topic: string;
  product?: string;
  kbFacts?: string[];
  campaignProfile?: string;
}): string {
  const spec = PLATFORM_SPECS[params.platform];
  const fw = COPY_FRAMEWORKS.find((f) => f.id === params.framework);

  const profile = params.campaignProfile ?? "nate_landing";
  const contactBlock = profile === "nate_landing"
    ? "Contact: Nate Lasko, (414) 312-5213, Window Depot USA Milwaukee. Booking: https://wdusa-nate-landing.vercel.app/"
    : "Contact: Window Depot USA Milwaukee. Site: https://windowdepotmilwaukee.com/";

  return `Generate a high-converting ${spec.label} ${params.contentType.replace("_", " ")} post.

PLATFORM: ${spec.label}
MAX CAPTION LENGTH: ${spec.maxCaptionLength} characters
MAX HASHTAGS: ${spec.maxHashtags}
CONTENT TYPE: ${params.contentType}

COPY FRAMEWORK: ${fw?.name ?? params.framework}
STRUCTURE:
${fw?.structure.map((s, i) => `${i + 1}. ${s}`).join("\n") ?? "Use natural flow"}

TONE: ${spec.toneGuidance}

TOPIC: ${params.topic}
${params.product ? `PRODUCT FOCUS: ${params.product}` : ""}

BRAND CONTEXT:
${contactBlock}
Products: windows (ProVia triple pane), doors, siding, roofing, flooring, bath
Unique selling points: 4.9 Google rating, 1,000+ reviews, A+ BBB, lifetime warranty, free estimates, financing available

${params.kbFacts?.length ? `KNOWLEDGE BASE FACTS:\n${params.kbFacts.join("\n")}` : ""}

BEST PRACTICES:
${spec.bestPractices.map((p) => `- ${p}`).join("\n")}

REQUIREMENTS:
1. Write the full caption/post text
2. Suggest ${spec.maxHashtags} relevant hashtags
3. Suggest a visual concept for the image/video
4. Include a strong CTA
5. Keep within platform character limits
6. Use the copy framework structure

Respond in JSON format:
{
  "hook": "scroll-stopping first line",
  "body": "main caption text following the framework",
  "cta": "call to action line",
  "hashtags": ["tag1", "tag2"],
  "visualConcept": "description of the ideal image or video",
  "imagePrompt": "detailed prompt for generating a visual (include style, mood, colors, composition)",
  "reelScript": "if video content: scene-by-scene script with timings"
}`;
}

// ── Platform Content Adapters ──────────────────────────────────────

export type GeneratedContent = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  visualConcept: string;
  imagePrompt: string;
  reelScript?: string;
};

export function formatCaptionForPlatform(
  content: GeneratedContent,
  platform: SocialPlatform,
): string {
  const spec = PLATFORM_SPECS[platform];
  const hashtagStr = content.hashtags.slice(0, spec.maxHashtags).map((t) => t.startsWith("#") ? t : `#${t}`).join(" ");

  switch (platform) {
    case "instagram":
      return `${content.hook}\n\n${content.body}\n\n${content.cta}\n\n·\n·\n·\n\n${hashtagStr}`;

    case "facebook":
      return `${content.hook}\n\n${content.body}\n\n${content.cta}${hashtagStr ? `\n\n${hashtagStr}` : ""}`;

    case "tiktok":
      return `${content.hook} ${content.cta} ${hashtagStr}`;

    case "twitter": {
      const tweet = `${content.hook}\n\n${content.body}\n\n${content.cta}`;
      return tweet.length > 280 ? `${content.hook}\n\n${content.cta}` : tweet;
    }

    case "linkedin":
      return `${content.hook}\n\n${content.body}\n\n${content.cta}\n\n${hashtagStr}`;

    case "youtube_shorts":
      return `${content.hook} | ${content.cta} ${hashtagStr}`;

    default:
      return `${content.hook}\n\n${content.body}\n\n${content.cta}\n\n${hashtagStr}`;
  }
}

export function truncateToLimit(text: string, platform: SocialPlatform): string {
  const max = PLATFORM_SPECS[platform].maxCaptionLength;
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}
