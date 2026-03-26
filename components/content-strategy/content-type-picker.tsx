"use client";

import type { ContentType, SocialPlatform } from "@prisma/client";
import { useMemo } from "react";

const CONTENT_TYPES: { id: ContentType; label: string; icon: string; description: string }[] = [
  { id: "reel", label: "Reel / Short Video", icon: "▶", description: "9:16 vertical video (15-90s)" },
  { id: "image_post", label: "Image Post", icon: "◻", description: "Static image with caption" },
  { id: "carousel", label: "Carousel", icon: "❑❑", description: "Swipeable multi-image post" },
  { id: "story", label: "Story", icon: "◎", description: "24-hour ephemeral content" },
  { id: "text_post", label: "Text Post", icon: "Aa", description: "Text-only with optional image" },
];

const PLATFORM_CONTENT_MAP: Record<SocialPlatform, ContentType[]> = {
  instagram: ["reel", "image_post", "carousel", "story"],
  facebook: ["reel", "image_post", "carousel", "text_post"],
  tiktok: ["reel", "story"],
  twitter: ["text_post", "image_post"],
  linkedin: ["text_post", "image_post", "carousel"],
  youtube_shorts: ["reel"],
};

type Props = {
  platform: SocialPlatform;
  selected: ContentType;
  onChange: (ct: ContentType) => void;
};

export function ContentTypePicker({ platform, selected, onChange }: Props) {
  const available = useMemo(() => {
    const allowed = PLATFORM_CONTENT_MAP[platform] ?? [];
    return CONTENT_TYPES.filter((ct) => allowed.includes(ct.id));
  }, [platform]);

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((ct) => (
        <button
          key={ct.id}
          type="button"
          onClick={() => onChange(ct.id)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
            selected === ct.id
              ? "border-[var(--accent)] bg-[var(--accent-muted)] font-medium text-[var(--accent)]"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="text-sm">{ct.icon}</span>
          <div className="text-left">
            <div className="font-medium">{ct.label}</div>
            <div className="text-[10px] opacity-60">{ct.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
