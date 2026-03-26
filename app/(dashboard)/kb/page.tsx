"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { SkeletonRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

type KbFact = {
  id: string;
  category: string;
  key: string | null;
  content: string;
  sourceUrl: string;
  sourceSite: string;
};

export default function KbPage() {
  const [profile, setProfile] = useState("nate_landing");
  const [category, setCategory] = useState("");
  const [q, setQ] = useState("");
  const [facts, setFacts] = useState<KbFact[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const params = new URLSearchParams({ profile });
      if (category.trim()) params.set("category", category.trim());
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/kb?${params}`);
      const data = (await res.json()) as { facts?: KbFact[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setFacts(data.facts ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const f of facts) s.add(f.category);
    return [...s].sort();
  }, [facts]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Knowledge Base</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Facts ingested from Nate landing and Window Depot Milwaukee. Filter by profile and category.
        </p>
      </div>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="min-w-[160px]">
            <Select label="Profile" value={profile} onChange={(e) => setProfile(e.target.value)}>
              <option value="nate_landing">nate_landing</option>
              <option value="corporate">corporate</option>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Category
              <input
                list="kb-cats"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. image, hook"
                className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <datalist id="kb-cats">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
          </div>
          <div className="min-w-0 flex-1">
            <Input
              label="Search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void load()}
              placeholder="Keyword…"
            />
          </div>
          <Button loading={loading} data-testid="kb-search" onClick={() => void load()}>
            Search
          </Button>
        </div>
      </Card>

      {err ? <p className="text-sm text-[var(--danger-text)]">{err}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
        </div>
      ) : facts.length === 0 ? (
        <EmptyState
          title="No facts match"
          description="Try adjusting your profile, category, or search terms."
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] opacity-50">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          }
        />
      ) : (
        <ul className="space-y-3">
          {facts.map((f) => (
            <li key={f.id}>
              <Card padding="md">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{f.category}</Badge>
                  {f.key ? (
                    <span className="font-mono text-xs text-[var(--text-secondary)]">{f.key}</span>
                  ) : null}
                  <span className="text-[11px] text-[var(--text-muted)]">{f.sourceSite}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-primary)]">{f.content}</p>
                <a
                  href={f.sourceUrl}
                  className="mt-2 inline-block text-xs text-[var(--accent)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Source
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
