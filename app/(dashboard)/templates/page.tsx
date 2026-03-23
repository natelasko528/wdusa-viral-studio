"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";

type Template = {
  id: string;
  name: string;
  creatomateTemplateId: string;
  aspectRatio: string;
  active: boolean;
  renderscriptSource?: unknown;
};

export default function TemplatesPage() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
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
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void load(); }, [load]);

  const editorUrl = (id: string) => `https://app.creatomate.com/templates/${id}`;

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this template?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Template deactivated");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const createViaBrowser = async () => {
    try {
      const res = await fetch("/api/browser/create-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: browserName, dimensions: { width: 1080, height: 1920 } }),
      });
      const data = (await res.json()) as { error?: string; task?: { id: string; status: string } };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.info(`Browser task ${data.task?.id ?? ""} — ${data.task?.status ?? ""}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const exportScript = async (creatomateTemplateId: string) => {
    try {
      const res = await fetch("/api/browser/export-renderscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatomateTemplateId }),
      });
      const data = (await res.json()) as { error?: string; task?: unknown };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Export task finished");
      console.info("export-renderscript", data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Templates</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Creatomate templates stored in Prisma. Open in the editor, export RenderScript, or create new ones.
        </p>
      </div>

      <Card>
        <CardTitle>Create via browser agent</CardTitle>
        <CardDescription>
          Requires <code className="rounded bg-[var(--code-bg)] px-1">CREATOMATE_EMAIL</code> / <code className="rounded bg-[var(--code-bg)] px-1">CREATOMATE_PASSWORD</code>.
        </CardDescription>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Input value={browserName} onChange={(e) => setBrowserName(e.target.value)} />
          </div>
          <Button onClick={() => void createViaBrowser()}>
            Run create flow
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          description="Create a template via the browser agent or add one in Creatomate."
          icon={
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] opacity-50">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          }
        />
      ) : (
        <ul className="space-y-3">
          {templates.map((t) => (
            <li key={t.id}>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-medium">{t.name}</h3>
                    <p className="font-mono text-xs text-[var(--text-muted)]">
                      {t.creatomateTemplateId}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{t.aspectRatio}</Badge>
                      <Badge variant={t.active ? "success" : "default"}>
                        {t.active ? "active" : "inactive"}
                      </Badge>
                      {t.renderscriptSource != null ? (
                        <Badge variant="accent">RenderScript</Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={editorUrl(t.creatomateTemplateId)} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">Open editor</Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => void exportScript(t.creatomateTemplateId)}>
                      Export RenderScript
                    </Button>
                    {t.active ? (
                      <Button variant="danger" size="sm" disabled={busyId === t.id} onClick={() => void deactivate(t.id)}>
                        Deactivate
                      </Button>
                    ) : null}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
