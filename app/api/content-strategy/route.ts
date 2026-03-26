import { NextResponse } from "next/server";
import { PLATFORM_SPECS, COPY_FRAMEWORKS, HASHTAG_LIBRARY } from "@/lib/content-strategy";

export async function GET() {
  return NextResponse.json({
    platforms: Object.values(PLATFORM_SPECS).map((p) => ({
      id: p.id,
      label: p.label,
      maxCaptionLength: p.maxCaptionLength,
      maxHashtags: p.maxHashtags,
      supportedContentTypes: p.supportedContentTypes,
      optimalPostTimes: p.optimalPostTimes,
      imageSpecs: p.imageSpecs,
      reelSpecs: p.reelSpecs,
      toneGuidance: p.toneGuidance,
      bestPractices: p.bestPractices,
    })),
    frameworks: COPY_FRAMEWORKS.map((f) => ({
      id: f.id,
      name: f.name,
      description: f.description,
      bestFor: f.bestFor,
      platforms: f.platforms,
    })),
    hashtagCategories: Object.keys(HASHTAG_LIBRARY),
  });
}
