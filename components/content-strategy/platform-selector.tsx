"use client";

import type { SocialPlatform } from "@prisma/client";

const PLATFORMS: { id: SocialPlatform; label: string; color: string; icon: JSX.Element }[] = [
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    color: "#00f2ea",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.33a8.16 8.16 0 004.76 1.52v-3.45a4.85 4.85 0 01-1-.71z" />
      </svg>
    ),
  },
  {
    id: "twitter",
    label: "X",
    color: "#1DA1F2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    color: "#0A66C2",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    id: "youtube_shorts",
    label: "YT Shorts",
    color: "#FF0000",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

type Props = {
  selected: SocialPlatform[];
  onChange: (platforms: SocialPlatform[]) => void;
  multi?: boolean;
};

export function PlatformSelector({ selected, onChange, multi = true }: Props) {
  const toggle = (id: SocialPlatform) => {
    if (multi) {
      onChange(
        selected.includes(id)
          ? selected.filter((p) => p !== id)
          : [...selected, id],
      );
    } else {
      onChange([id]);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {PLATFORMS.map((p) => {
        const active = selected.includes(p.id);
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => toggle(p.id)}
            className={`group relative flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all ${
              active
                ? "border-[var(--accent)] bg-[var(--accent-muted)] shadow-sm"
                : "border-[var(--border)] bg-[var(--surface-raised)] hover:border-[var(--border-strong)] hover:shadow-sm"
            }`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
              style={{ color: active ? p.color : "var(--text-muted)" }}
            >
              {p.icon}
            </span>
            <span className={`text-[10px] font-medium ${active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}>
              {p.label}
            </span>
            {active && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-[8px] font-bold text-[var(--accent-text)]">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
