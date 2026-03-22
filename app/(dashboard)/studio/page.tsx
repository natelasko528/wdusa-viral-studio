"use client";

import { useCallback, useEffect, useState } from "react";

type VideoTemplate = {
  id: string;
  name: string;
  creatomateTemplateId: string;
  aspectRatio: string;
  active: boolean;
};

type RenderJob = {
  id: string;
  status: string;
  creatomateRenderId: string | null;
  outputUrl: string | null;
  error: string | null;
};

function pickIdNameList(raw: unknown, keys: string[]): { id: string; name: string }[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  let arr: unknown = o.accounts ?? o.users ?? o.data ?? o.items;
  if (!Array.isArray(arr) && o.socialMediaPosting) {
    const smp = o.socialMediaPosting as Record<string, unknown>;
    arr = smp.accounts;
  }
  if (!Array.isArray(arr)) return [];
  return (arr as Record<string, unknown>[])
    .map((row) => {
      const id = String(row.id ?? row.accountId ?? row.userId ?? "");
      let name = "";
      for (const k of keys) {
        const v = row[k];
        if (typeof v === "string" && v) {
          name = v;
          break;
        }
      }
      if (!name) name = id || "—";
      return { id, name };
    })
    .filter((x) => x.id);
}

export default function StudioPage() {
  const [mode, setMode] = useState<"template" | "renderscript">("template");
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [hook, setHook] = useState("");
  const [subhead, setSubhead] = useState("");
  const [cta, setCta] = useState("Book your FREE estimate");
  const [phone, setPhone] = useState("(414) 312-5213");
  const [imageUrlsText, setImageUrlsText] = useState("");
  const [headshotUrl, setHeadshotUrl] = useState("");
  const [campaignProfile, setCampaignProfile] = useState("nate_landing");

  const [job, setJob] = useState<RenderJob | null>(null);
  const [pollMsg, setPollMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [summary, setSummary] = useState("");
  const [scheduleMsg, setScheduleMsg] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/templates");
        const data = (await res.json()) as {
          templates?: VideoTemplate[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? "Failed to load templates");
        const list = data.templates ?? [];
        setTemplates(list);
        setTemplateId((prev) => prev || list[0]?.id || "");
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const loadGhl = useCallback(async () => {
    try {
      const [aRes, uRes] = await Promise.all([
        fetch("/api/ghl/accounts"),
        fetch("/api/ghl/users"),
      ]);
      const aJson = (await aRes.json()) as unknown;
      const uJson = (await uRes.json()) as unknown;
      if (aRes.ok) {
        setAccounts(
          pickIdNameList(aJson, ["name", "platform", "accountName", "title"]),
        );
      }
      if (uRes.ok) {
        setUsers(
          pickIdNameList(uJson, ["name", "firstName", "email", "lastName"]),
        );
      }
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    void loadGhl();
  }, [loadGhl]);

  const pollJob = useCallback(async (id: string) => {
    setPollMsg("Polling…");
    const res = await fetch(`/api/renders/${id}`);
    const data = (await res.json()) as { job?: RenderJob; error?: string };
    if (!res.ok) {
      setPollMsg(data.error ?? "Poll failed");
      return;
    }
    setJob(data.job ?? null);
    setPollMsg(data.job?.status ?? "");
  }, []);

  useEffect(() => {
    if (!job?.id || job.status === "succeeded" || job.status === "failed") {
      return;
    }
    const t = setInterval(() => {
      void pollJob(job.id);
    }, 2500);
    return () => clearInterval(t);
  }, [job?.id, job?.status, pollJob]);

  const startRender = async () => {
    setLoading(true);
    setPollMsg("");
    try {
      const imageUrls = imageUrlsText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      const body =
        mode === "template"
          ? {
              mode: "template" as const,
              campaignProfile,
              videoTemplateId: templateId,
              hook: hook || undefined,
              subhead: subhead || undefined,
              cta: cta || undefined,
            }
          : {
              mode: "renderscript" as const,
              campaignProfile,
              hook: hook || "Upgrade your home",
              subhead: subhead || "Window Depot USA · Milwaukee",
              cta: cta || "Book your FREE estimate",
              phone: phone || undefined,
              imageUrls: imageUrls.length ? imageUrls : undefined,
              headshotUrl: headshotUrl.trim() || undefined,
            };
      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { job?: RenderJob; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Render failed");
      setJob(data.job ?? null);
      setPollMsg(data.job?.status ?? "");
    } catch (e) {
      setPollMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const schedule = async () => {
    if (!job?.id) {
      setScheduleMsg("Start a render first.");
      return;
    }
    setScheduleMsg("");
    try {
      const res = await fetch("/api/ghl/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderJobId: job.id,
          accountIds: selectedAccounts,
          userId,
          scheduleDate,
          summary: summary || hook || "WDUSA Reel",
          type: "reel",
        }),
      });
      const data = (await res.json()) as { error?: string; scheduledPost?: { id: string } };
      if (!res.ok) throw new Error(data.error ?? "Schedule failed");
      setScheduleMsg(`Scheduled (${data.scheduledPost?.id ?? "ok"})`);
    } catch (e) {
      setScheduleMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Studio</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Render with a Creatomate template or template-free RenderScript, then
          schedule to GoHighLevel.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Campaign profile
        </h2>
        <select
          value={campaignProfile}
          onChange={(e) => setCampaignProfile(e.target.value)}
          className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
        >
          <option value="nate_landing">nate_landing</option>
          <option value="corporate">corporate</option>
        </select>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("template")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "template"
                ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            Template
          </button>
          <button
            type="button"
            onClick={() => setMode("renderscript")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "renderscript"
                ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            RenderScript
          </button>
        </div>

        {mode === "template" ? (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Video template
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.aspectRatio})
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Phone on CTA card
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Background image URLs (one per line or comma-separated)
              <textarea
                value={imageUrlsText}
                onChange={(e) => setImageUrlsText(e.target.value)}
                rows={3}
                placeholder="https://…"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-xs"
              />
            </label>
            <label className="block text-xs font-medium text-[var(--text-muted)]">
              Headshot URL (optional)
              <input
                value={headshotUrl}
                onChange={(e) => setHeadshotUrl(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        <div className="mt-4 grid gap-3 sm:grid-cols-1">
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Hook
            <input
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Subhead
            <textarea
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            CTA
            <input
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => void startRender()}
          className="mt-4 w-full rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50"
        >
          {loading ? "Starting…" : "Start render"}
        </button>

        {job ? (
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-3 text-xs">
            <p>
              <span className="text-[var(--text-muted)]">Job:</span>{" "}
              <span className="font-mono">{job.id}</span>
            </p>
            <p>
              <span className="text-[var(--text-muted)]">Status:</span> {job.status}
            </p>
            {job.outputUrl ? (
              <p className="mt-2 break-all">
                <a
                  href={job.outputUrl}
                  className="text-[var(--accent)] underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {job.outputUrl}
                </a>
              </p>
            ) : null}
            {job.error ? (
              <p className="mt-2 text-[var(--danger-text)]">{job.error}</p>
            ) : null}
            <button
              type="button"
              onClick={() => void pollJob(job.id)}
              className="mt-2 rounded border border-[var(--border)] px-2 py-1 text-[11px]"
            >
              Refresh status
            </button>
            <p className="mt-1 text-[var(--text-muted)]">{pollMsg}</p>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Schedule (GoHighLevel)
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Render must finish with an output URL. Pick accounts and a future
          time.
        </p>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Accounts
            </p>
            <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
              {accounts.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)]">
                  None loaded (check GHL env).
                </span>
              ) : (
                accounts.map((a) => (
                  <label
                    key={a.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(a.id)}
                      onChange={() => toggleAccount(a.id)}
                    />
                    {a.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <label className="block text-xs font-medium text-[var(--text-muted)]">
            User (required by GHL API)
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Schedule (local datetime)
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>

          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Caption / summary
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>

          <button
            type="button"
            onClick={() => void schedule()}
            className="w-full rounded-lg border border-[var(--border-strong)] py-2 text-sm font-medium"
          >
            Schedule post
          </button>
          {scheduleMsg ? (
            <p className="text-xs text-[var(--text-muted)]">{scheduleMsg}</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
