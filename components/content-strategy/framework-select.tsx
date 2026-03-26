"use client";

import type { ContentType, SocialPlatform } from "@prisma/client";
import { useMemo } from "react";

type Framework = {
  id: string;
  name: string;
  description: string;
  bestFor: ContentType[];
  platforms: SocialPlatform[];
};

const FRAMEWORKS: Framework[] = [
  { id: "aida", name: "AIDA", description: "Attention → Interest → Desire → Action", bestFor: ["image_post", "carousel", "text_post"], platforms: ["instagram", "facebook", "linkedin"] },
  { id: "pas", name: "PAS", description: "Problem → Agitate → Solve", bestFor: ["text_post", "image_post", "reel"], platforms: ["instagram", "facebook", "twitter", "linkedin"] },
  { id: "bab", name: "Before-After-Bridge", description: "Show the transformation", bestFor: ["reel", "carousel", "image_post"], platforms: ["instagram", "tiktok", "facebook", "youtube_shorts"] },
  { id: "hook_story_offer", name: "Hook → Story → Offer", description: "Pattern interrupt + relatable story", bestFor: ["reel", "text_post", "image_post"], platforms: ["instagram", "tiktok", "facebook", "twitter"] },
  { id: "edu_value", name: "Educational Value", description: "Teach something actionable", bestFor: ["carousel", "text_post", "reel"], platforms: ["instagram", "linkedin", "tiktok"] },
  { id: "social_proof", name: "Social Proof", description: "Let results do the selling", bestFor: ["image_post", "carousel", "reel"], platforms: ["instagram", "facebook", "linkedin"] },
];

type Props = {
  platform: SocialPlatform;
  contentType: ContentType;
  selected: string;
  onChange: (id: string) => void;
};

export function FrameworkSelect({ platform, contentType, selected, onChange }: Props) {
  const available = useMemo(() => {
    return FRAMEWORKS.filter(
      (f) => f.platforms.includes(platform) && f.bestFor.includes(contentType),
    );
  }, [platform, contentType]);

  if (available.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-[var(--text-secondary)]">Copy Framework</label>
      <div className="flex flex-wrap gap-2">
        {available.map((fw) => (
          <button
            key={fw.id}
            type="button"
            onClick={() => onChange(fw.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
              selected === fw.id
                ? "border-[var(--accent)] bg-[var(--accent-muted)] font-medium text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
            }`}
            title={fw.description}
          >
            {fw.name}
          </button>
        ))}
      </div>
      {available.find((f) => f.id === selected) && (
        <p className="text-[10px] text-[var(--text-muted)]">
          {available.find((f) => f.id === selected)?.description}
        </p>
      )}
    </div>
  );
}
