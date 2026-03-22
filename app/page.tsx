"use client";

import { useCallback, useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  creatomateTemplateId: string;
  aspectRatio: string;
};

type KbFact = {
  id: string;
  category: string;
  key: string | null;
  content: string;
};

type RenderJob = {
  id: string;
  status: string;
  creatomateRenderId: string | null;
  outputUrl: string | null;
  error: string | null;
};

export default function Home() {
  const [profile, setProfile] = useState<"nate_landing" | "corporate">(
    "nate_landing",
  );
  const [templates, setTemplates] = useState<Template[]>([]);
  const [facts, setFacts] = useState<KbFact[]>([]);
  const [hook, setHook] = useState("");
  const [subhead, setSubhead] = useState("Milwaukee · Window Depot USA");
  const [cta, setCta] = useState("Book your FREE in-home estimate");
  const [templateId, setTemplateId] = useState("");
  const [job, setJob] = useState<RenderJob | null>(null);
  const [pollMsg, setPollMsg] = useState("");
  const [accountsJson, setAccountsJson] = useState<string>("");
  const [usersJson, setUsersJson] = useState<string>("");
  const [accountIdsInput, setAccountIdsInput] = useState("");
  const [userId, setUserId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/templates");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "templates");
    setTemplates(data.templates ?? []);
  }, []);

  const loadKb = useCallback(async () => {
    const res = await fetch(`/api/kb?profile=${profile}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "kb");
    setFacts(data.facts ?? []);
  }, [profile]);

  useEffect(() => {
    loadTemplates().catch(() => {});
  }, [loadTemplates]);

  useEffect(() => {
    if (templates.length > 0 && !templateId) {
      setTemplateId(templates[0].id);
    }
  }, [templates, templateId]);

  useEffect(() => {
    loadKb().catch(() => {});
  }, [loadKb]);

  useEffect(() => {
    const hooks = facts.filter((f) => f.category === "hook");
    if (hooks[0] && !hook) setHook(hooks[0].content.slice(0, 200));
  }, [facts, hook]);

  async function startRender() {
    setErr(null);
    setBusy("render");
    try {
      const res = await fetch("/api/renders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignProfile: profile,
          videoTemplateId: templateId || undefined,
          hook,
          subhead,
          cta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "render");
      setJob(data.job);
      setPollMsg("Rendering… poll status below.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Render failed");
    } finally {
      setBusy(null);
    }
  }

  async function pollJob() {
    if (!job?.id) return;
    setErr(null);
    setBusy("poll");
    try {
      const res = await fetch(`/api/renders/${job.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "poll");
      setJob(data.job);
      setPollMsg(
        data.job?.outputUrl
          ? "Render complete. Use the video URL in GHL schedule."
          : `Creatomate: ${data.creatomate?.status ?? "unknown"}`,
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Poll failed");
    } finally {
      setBusy(null);
    }
  }

  async function loadGhlAccounts() {
    setErr(null);
    setBusy("ghl-accounts");
    try {
      const res = await fetch("/api/ghl/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "accounts");
      setAccountsJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "GHL accounts failed");
    } finally {
      setBusy(null);
    }
  }

  async function loadGhlUsers() {
    setErr(null);
    setBusy("ghl-users");
    try {
      const res = await fetch("/api/ghl/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "users");
      setUsersJson(JSON.stringify(data, null, 2));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "GHL users failed");
    } finally {
      setBusy(null);
    }
  }

  async function schedulePost() {
    if (!job?.id || !job.outputUrl) {
      setErr("Need a completed render with outputUrl first.");
      return;
    }
    setErr(null);
    setBusy("schedule");
    try {
      const accountIds = accountIdsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch("/api/ghl/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          renderJobId: job.id,
          accountIds,
          userId,
          scheduleDate: scheduleDate || new Date().toISOString(),
          summary: caption || `${cta}\nhttps://wdusa-nate-landing.vercel.app/`,
          type: "reel",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "schedule");
      setPollMsg(`Scheduled in GHL. Post row id: ${data.scheduledPost?.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Schedule failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            WDUSA Viral Studio
          </h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Creatomate renders + KB from your landing and corporate sites, then
            GoHighLevel Social Planner for Reels. Default contact data follows{" "}
            <a
              className="text-amber-400 underline"
              href="https://wdusa-nate-landing.vercel.app/"
              target="_blank"
              rel="noreferrer"
            >
              Nate landing
            </a>
            .
          </p>
        </header>

        {err && (
          <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        )}

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Campaign profile</h2>
          <div className="flex gap-3 flex-wrap">
            {(["nate_landing", "corporate"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setProfile(p)}
                className={`rounded-lg px-3 py-1.5 text-sm border ${
                  profile === p
                    ? "border-amber-500/80 bg-amber-500/10 text-amber-100"
                    : "border-zinc-700 text-zinc-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500">
            Use <strong>nate_landing</strong> for (414) 312-5213 and your Vercel
            booking URL in KB facts.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-3">
          <h2 className="text-sm font-medium text-zinc-300">
            Knowledge base (filtered)
          </h2>
          <ul className="text-xs text-zinc-400 space-y-2 max-h-48 overflow-y-auto font-mono">
            {facts.slice(0, 40).map((f) => (
              <li key={f.id}>
                <span className="text-zinc-500">{f.category}</span>
                {f.key ? `/${f.key}` : ""}: {f.content.slice(0, 160)}
                {f.content.length > 160 ? "…" : ""}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Video (Creatomate)</h2>
          <label className="block text-xs text-zinc-500 space-y-1">
            Template (from DB)
            <select
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.creatomateTemplateId.slice(0, 24)}…
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            Hook-Text
            <textarea
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm min-h-[72px]"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
            />
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            Subhead-Text
            <input
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={subhead}
              onChange={(e) => setSubhead(e.target.value)}
            />
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            CTA-Text
            <input
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startRender()}
              disabled={busy !== null}
              className="rounded-lg bg-amber-500 text-zinc-950 px-4 py-2 text-sm font-medium disabled:opacity-40"
            >
              {busy === "render" ? "Starting…" : "Start render"}
            </button>
            <button
              type="button"
              onClick={() => pollJob()}
              disabled={!job?.id || busy !== null}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm disabled:opacity-40"
            >
              {busy === "poll" ? "Polling…" : "Refresh render status"}
            </button>
          </div>
          {job && (
            <pre className="text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 overflow-x-auto text-zinc-400">
              {JSON.stringify(job, null, 2)}
            </pre>
          )}
          {pollMsg && (
            <p className="text-xs text-zinc-500">{pollMsg}</p>
          )}
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">
            GoHighLevel schedule
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadGhlAccounts()}
              disabled={busy !== null}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Load accounts
            </button>
            <button
              type="button"
              onClick={() => loadGhlUsers()}
              disabled={busy !== null}
              className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs disabled:opacity-40"
            >
              Load users
            </button>
          </div>
          {accountsJson && (
            <pre className="text-[10px] max-h-36 overflow-auto bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-500">
              {accountsJson.slice(0, 4000)}
              {accountsJson.length > 4000 ? "…" : ""}
            </pre>
          )}
          {usersJson && (
            <pre className="text-[10px] max-h-36 overflow-auto bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-500">
              {usersJson.slice(0, 4000)}
              {usersJson.length > 4000 ? "…" : ""}
            </pre>
          )}
          <label className="block text-xs text-zinc-500 space-y-1">
            accountIds (comma-separated from API response)
            <input
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={accountIdsInput}
              onChange={(e) => setAccountIdsInput(e.target.value)}
              placeholder="id1,id2"
            />
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            userId (required by GHL Schema A)
            <input
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            scheduleDate (ISO)
            <input
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              placeholder="2026-03-25T22:00:00.000Z"
            />
          </label>
          <label className="block text-xs text-zinc-500 space-y-1">
            Caption / summary
            <textarea
              className="w-full rounded-lg bg-zinc-950 border border-zinc-700 px-3 py-2 text-sm min-h-[64px]"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() => schedulePost()}
            disabled={busy !== null}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            {busy === "schedule" ? "Scheduling…" : "Schedule reel"}
          </button>
        </section>
      </div>
    </div>
  );
}
