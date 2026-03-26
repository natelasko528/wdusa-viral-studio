"use client";

import { useCallback, useState } from "react";
import type { SocialPlatform, ContentType } from "@prisma/client";
import { Button, Textarea } from "@/components/ui";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { PlatformSelector } from "@/components/content-strategy/platform-selector";
import { ContentTypePicker } from "@/components/content-strategy/content-type-picker";
import { FrameworkSelect } from "@/components/content-strategy/framework-select";
import { PostPreview } from "@/components/content-strategy/post-preview";
import { CalendarView } from "@/components/content-strategy/calendar-view";
import { SavedPosts } from "@/components/content-strategy/saved-posts";

type GeneratedContent = {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  visualConcept: string;
  imagePrompt: string;
  reelScript?: string;
};

type GenerateResult = {
  content: GeneratedContent;
  caption: string;
  platform: SocialPlatform;
  contentType: ContentType;
  framework: string;
  charCount: number;
  maxChars: number;
};

type Tab = "generate" | "calendar" | "saved";

const PRODUCT_OPTIONS = [
  { value: "", label: "General / Any" },
  { value: "windows", label: "Windows" },
  { value: "doors", label: "Doors" },
  { value: "siding", label: "Siding" },
  { value: "roofing", label: "Roofing" },
  { value: "flooring", label: "Flooring" },
  { value: "bath", label: "Bath" },
];

export default function ContentStrategyPage() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [platforms, setPlatforms] = useState<SocialPlatform[]>(["instagram"]);
  const [contentType, setContentType] = useState<ContentType>("reel");
  const [framework, setFramework] = useState("hook_story_offer");
  const [topic, setTopic] = useState("");
  const [product, setProduct] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [refreshPosts, setRefreshPosts] = useState(0);

  const generate = useCallback(async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic to generate content for.");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Select at least one platform.");
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const promises = platforms.map(async (platform) => {
        const res = await fetch("/api/content-strategy/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            platform,
            contentType,
            framework,
            topic: topic.trim(),
            product: product || undefined,
          }),
        });
        const data = (await res.json()) as GenerateResult & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Generation failed");
        return data;
      });

      const all = await Promise.allSettled(promises);
      const succeeded: GenerateResult[] = [];
      let failCount = 0;

      for (const r of all) {
        if (r.status === "fulfilled") {
          succeeded.push(r.value);
        } else {
          failCount++;
        }
      }

      setResults(succeeded);
      if (succeeded.length > 0) {
        toast.success(`Generated ${succeeded.length} post(s)!`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} platform(s) failed to generate.`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [platforms, contentType, framework, topic, product, toast]);

  const savePost = useCallback(async (result: GenerateResult, idx: number) => {
    setSavingIdx(idx);
    try {
      const res = await fetch("/api/content-strategy/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: result.platform,
          contentType: result.contentType,
          hook: result.content.hook,
          body: result.content.body,
          cta: result.content.cta,
          hashtags: result.content.hashtags,
          caption: result.caption,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast.success(`Saved to ${result.platform}!`);
      setRefreshPosts((n) => n + 1);
    } catch {
      toast.error("Failed to save post.");
    } finally {
      setSavingIdx(null);
    }
  }, [toast]);

  const handleSlotClick = useCallback((slot: { platform: SocialPlatform; contentType: ContentType; topicSuggestion: string; framework: string }) => {
    setPlatforms([slot.platform]);
    setContentType(slot.contentType);
    setFramework(slot.framework);
    setTopic(slot.topicSuggestion);
    setActiveTab("generate");
    toast.info(`Loaded ${slot.platform} ${slot.contentType.replace("_", " ")} slot.`);
  }, [toast]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Content Strategy</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Generate high-converting social media posts customized for each platform with optimized images and reels.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-1">
        {([
          { id: "generate" as Tab, label: "Generate", icon: "✦" },
          { id: "calendar" as Tab, label: "Calendar", icon: "▦" },
          { id: "saved" as Tab, label: "Saved Posts", icon: "◎" },
        ]).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-[var(--accent-text)] shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {activeTab === "generate" && (
        <div className="space-y-4">
          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Platforms</CardTitle>
              <CardDescription>Select platforms to generate content for. Multi-select generates customized posts for each.</CardDescription>
            </CardHeader>
            <PlatformSelector selected={platforms} onChange={setPlatforms} />
          </Card>

          {/* Content Configuration */}
          {platforms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Content Type</CardTitle>
              </CardHeader>
              <ContentTypePicker
                platform={platforms[0]}
                selected={contentType}
                onChange={setContentType}
              />

              <div className="mt-4">
                <FrameworkSelect
                  platform={platforms[0]}
                  contentType={contentType}
                  selected={framework}
                  onChange={setFramework}
                />
              </div>
            </Card>
          )}

          {/* Topic and Product */}
          <Card>
            <CardHeader>
              <CardTitle>Content Brief</CardTitle>
              <CardDescription>Describe what the post should be about. Be specific for better results.</CardDescription>
            </CardHeader>

            <div className="space-y-3">
              <Textarea
                label="Topic / Brief"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                placeholder="e.g., Before and after window replacement at a Milwaukee ranch home — customer saved 40% on energy bills"
              />

              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Product Focus</label>
                <select
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  {PRODUCT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <Button
              className="mt-4 w-full"
              size="lg"
              loading={loading}
              onClick={() => void generate()}
            >
              {loading
                ? `Generating for ${platforms.length} platform(s)…`
                : `Generate ${platforms.length > 1 ? `${platforms.length} Posts` : "Post"}`}
            </Button>
          </Card>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-sm font-semibold text-[var(--text-secondary)]">
                Generated Content ({results.length})
              </h2>

              {results.map((result, idx) => (
                <Card key={`${result.platform}-${idx}`} padding="lg">
                  <PostPreview
                    content={result.content}
                    caption={result.caption}
                    platform={result.platform}
                    contentType={result.contentType}
                    charCount={result.charCount}
                    maxChars={result.maxChars}
                  />

                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => void savePost(result, idx)}
                      loading={savingIdx === idx}
                    >
                      Save as Draft
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void navigator.clipboard.writeText(result.caption);
                        toast.success("Caption copied!");
                      }}
                    >
                      Copy Caption
                    </Button>
                    {(result.contentType === "reel" || result.contentType === "image_post" || result.contentType === "story") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          toast.info("Render started — check Studio for status.");
                        }}
                      >
                        Render Visual
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar Tab */}
      {activeTab === "calendar" && (
        <Card padding="lg">
          <CalendarView
            selectedPlatforms={platforms.length > 0 ? platforms : undefined}
            onSlotClick={handleSlotClick}
          />
        </Card>
      )}

      {/* Saved Posts Tab */}
      {activeTab === "saved" && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Saved Posts</CardTitle>
            <CardDescription>Your generated content ready for scheduling or publishing.</CardDescription>
          </CardHeader>
          <SavedPosts refreshTrigger={refreshPosts} />
        </Card>
      )}
    </div>
  );
}
