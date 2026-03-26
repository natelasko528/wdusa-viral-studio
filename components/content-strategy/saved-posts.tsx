"use client";

import { useCallback, useEffect, useState } from "react";
import type { SocialPlatform, ContentPostStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui";

type ContentPost = {
  id: string;
  platform: SocialPlatform;
  contentType: string;
  status: ContentPostStatus;
  hook: string | null;
  caption: string | null;
  hashtags: string[];
  mediaUrls: string[];
  createdAt: string;
  renderJob?: { id: string; status: string; outputUrl: string | null } | null;
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  twitter: "X",
  linkedin: "LinkedIn",
  youtube_shorts: "YT Shorts",
};

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "error"> = {
  draft: "default",
  generating: "warning",
  ready: "success",
  scheduled: "success",
  published: "success",
  failed: "error",
};

type Props = {
  refreshTrigger?: number;
};

export function SavedPosts({ refreshTrigger }: Props) {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch("/api/content-strategy/posts?limit=20");
      const data = (await res.json()) as { posts?: ContentPost[] };
      setPosts(data.posts ?? []);
    } catch {
      /* non-critical */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPosts();
  }, [fetchPosts, refreshTrigger]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <span className="text-2xl opacity-30 mb-2">📝</span>
        <p className="text-xs text-[var(--text-muted)]">
          No saved posts yet. Generate content and save it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-3 hover:border-[var(--border-strong)] transition-colors"
        >
          {post.renderJob?.outputUrl ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--border)]">
              {post.renderJob.outputUrl.endsWith(".mp4") ? (
                <video src={post.renderJob.outputUrl} className="h-full w-full object-cover" muted />
              ) : (
                <img src={post.renderJob.outputUrl} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[var(--border)] text-lg opacity-40">
              {post.contentType === "reel" ? "▶" : "◻"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium">{PLATFORM_LABELS[post.platform]}</span>
              <Badge variant={STATUS_COLORS[post.status] ?? "default"} size="sm">
                {post.status}
              </Badge>
            </div>
            <p className="truncate text-xs text-[var(--text-secondary)]">
              {post.hook ?? post.caption?.slice(0, 80) ?? "No content"}
            </p>
            <div className="mt-1 flex gap-1">
              {post.hashtags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[9px] text-[var(--accent)]">{tag}</span>
              ))}
              {post.hashtags.length > 3 && (
                <span className="text-[9px] text-[var(--text-muted)]">+{post.hashtags.length - 3}</span>
              )}
            </div>
          </div>

          <time className="shrink-0 text-[10px] text-[var(--text-muted)]">
            {new Date(post.createdAt).toLocaleDateString()}
          </time>
        </div>
      ))}
    </div>
  );
}
