"use client";

import type { SocialPlatform, ContentType } from "@prisma/client";

type GeneratedContent = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  visualConcept: string;
  imagePrompt: string;
  reelScript?: string;
};

type Props = {
  content: GeneratedContent | null;
  caption: string;
  platform: SocialPlatform;
  contentType: ContentType;
  charCount: number;
  maxChars: number;
};

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#00f2ea",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  youtube_shorts: "#FF0000",
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  youtube_shorts: "YouTube Shorts",
};

export function PostPreview({ content, caption, platform, contentType, charCount, maxChars }: Props) {
  if (!content) return null;

  const color = PLATFORM_COLORS[platform];
  const charPercent = Math.min((charCount / maxChars) * 100, 100);
  const isNearLimit = charPercent > 85;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] overflow-hidden">
        {/* Platform header */}
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderBottom: `2px solid ${color}` }}
        >
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {PLATFORM_LABELS[platform][0]}
          </span>
          <span className="text-xs font-semibold">{PLATFORM_LABELS[platform]}</span>
          <span className="ml-auto rounded-md bg-[var(--border)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
            {contentType.replace("_", " ")}
          </span>
        </div>

        {/* Visual concept mock */}
        <div className="relative aspect-square max-h-[280px] w-full bg-gradient-to-br from-[var(--border)] to-[var(--surface)] flex items-center justify-center">
          <div className="max-w-[80%] text-center">
            <div className="mb-2 text-3xl opacity-30">
              {contentType === "reel" ? "▶" : contentType === "carousel" ? "❑❑" : contentType === "story" ? "◎" : "◻"}
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {content.visualConcept}
            </p>
          </div>
        </div>

        {/* Caption preview */}
        <div className="p-4">
          <div className="mb-3 text-sm leading-relaxed whitespace-pre-line">
            {caption}
          </div>

          <div className="flex items-center gap-3 border-t border-[var(--border)] pt-3">
            <div className="flex-1">
              <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${charPercent}%`,
                    backgroundColor: isNearLimit ? "#ef4444" : color,
                  }}
                />
              </div>
            </div>
            <span className={`text-[10px] font-mono ${isNearLimit ? "text-red-500" : "text-[var(--text-muted)]"}`}>
              {charCount}/{maxChars}
            </span>
          </div>
        </div>
      </div>

      {/* Content breakdown */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Hook</h4>
          <p className="text-sm font-medium">{content.hook}</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">CTA</h4>
          <p className="text-sm font-medium" style={{ color }}>{content.cta}</p>
        </div>
      </div>

      {content.hashtags.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Hashtags</h4>
          <div className="flex flex-wrap gap-1.5">
            {content.hashtags.map((tag) => (
              <span key={tag} className="rounded-md bg-[var(--accent-muted)] px-2 py-0.5 text-xs text-[var(--accent)]">
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>
      )}

      {content.imagePrompt && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Image Prompt</h4>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{content.imagePrompt}</p>
        </div>
      )}

      {content.reelScript && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <h4 className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Reel Script</h4>
          <pre className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{content.reelScript}</pre>
        </div>
      )}
    </div>
  );
}
