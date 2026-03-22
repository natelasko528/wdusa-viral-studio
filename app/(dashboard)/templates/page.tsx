"use client";

import { useCallback, useEffect, useState } from "react";

type Template = {
  id: string;
  name: string;
  creatomateTemplateId: string;
  aspectRatio: string;
  active: boolean;
  renderscriptSource?: unknown;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [browserName, setBrowserName] = useState("WDUSA Reel (browser)");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates?all=1");
      const data = (await res.json()) as { templates?: Template[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Load failed");
      setTemplates(data.templates ?? []);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const editorUrl = (creatomateTemplateId: string) =>
    `https://app.creatomate.com/templates/${creatomateTemplateId}`;

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this template?")) return;
    setBusyId(id);
    setMsg("");
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const createViaBrowser = async () => {
    setMsg("");
    try {
      const res = await fetch("/api/browser/create-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: browserName,
          dimensions: { width: 1080, height: 1920 },
        }),
      });
      const data = (await res.json()) as { error?: string; task?: { id: string; status: string } };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(
        `Browser task ${data.task?.id ?? ""} — ${data.task?.status ?? ""}. Check output in Prisma or re-fetch tasks.`,
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  const exportScript = async (creatomateTemplateId: string) => {
    setMsg("");
    try {
      const res = await fetch("/api/browser/export-renderscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatomateTemplateId }),
      });
      const data = (await res.json()) as { error?: string; task?: unknown };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg("Export task finished — see task.output in API response (devtools) or DB.");
      console.info("export-renderscript", data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Templates</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Creatomate templates stored in Prisma. Open in the editor, export
          RenderScript via the browser agent, or run a stubbed create flow.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium">Create via browser agent</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Requires{" "}
          <code className="rounded bg-[var(--code-bg)] px-1">CREATOMATE_EMAIL</code>{" "}
          /{" "}
          <code className="rounded bg-[var(--code-bg)] px-1">CREATOMATE_PASSWORD</code>
          . On Vercel, allow long serverless duration for Playwright.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={browserName}
            onChange={(e) => setBrowserName(e.target.value)}
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void createViaBrowser()}
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-text)]"
          >
            Run create flow
          </button>
        </div>
      </section>

      {msg ? (
        <p className="rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-3 text-sm">
          {msg}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li
              key={t.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{t.name}</h3>
                  <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">
                    DB: {t.id}
                  </p>
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    Creatomate: {t.creatomateTemplateId}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.aspectRatio} · {t.active ? "active" : "inactive"}
                    {t.renderscriptSource != null ? " · has RenderScript snapshot" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={editorUrl(t.creatomateTemplateId)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                  >
                    Open editor
                  </a>
                  <button
                    type="button"
                    onClick={() => void exportScript(t.creatomateTemplateId)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium"
                  >
                    Export RenderScript
                  </button>
                  {t.active ? (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void deactivate(t.id)}
                      className="rounded-lg border border-[var(--danger-border)] px-3 py-1.5 text-xs font-medium text-[var(--danger-text)] disabled:opacity-50"
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
