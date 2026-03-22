"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [loading, setLoading] = useState(false);
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
    // Intentional: refetch when profile changes only; category/q apply on Search.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- see above
  }, [profile]);

  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const f of facts) s.add(f.category);
    return [...s].sort();
  }, [facts]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Knowledge base</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Facts ingested from Nate landing and Window Depot Milwaukee. Filter by
          profile and category; search matches content and keys.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Profile
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            className="mt-1 block w-full min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm sm:w-auto"
          >
            <option value="nate_landing">nate_landing</option>
            <option value="corporate">corporate</option>
          </select>
        </label>
        <label className="text-xs font-medium text-[var(--text-muted)]">
          Category (optional)
          <input
            list="kb-cats"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. image, hook"
            className="mt-1 block w-full min-w-[160px] rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm sm:w-auto"
          />
          <datalist id="kb-cats">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="min-w-0 flex-1 text-xs font-medium text-[var(--text-muted)]">
          Search
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void load()}
            placeholder="Keyword…"
            className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </div>

      {err ? (
        <p className="text-sm text-[var(--danger-text)]">{err}</p>
      ) : null}

      <ul className="space-y-3">
        {facts.map((f) => (
          <li
            key={f.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4"
          >
            <div className="flex flex-wrap items-baseline gap-2 text-xs text-[var(--text-muted)]">
              <span className="rounded bg-[var(--code-bg)] px-1.5 py-0.5 font-mono">
                {f.category}
              </span>
              {f.key ? (
                <span className="font-mono text-[var(--text-secondary)]">
                  {f.key}
                </span>
              ) : null}
              <span>{f.sourceSite}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {f.content}
            </p>
            <a
              href={f.sourceUrl}
              className="mt-2 inline-block text-xs text-[var(--accent)] underline"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </li>
        ))}
      </ul>

      {!loading && facts.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">No facts match.</p>
      ) : null}
    </div>
  );
}
