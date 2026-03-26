"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { CampaignSelect } from "@/components/studio/campaign-select";
import { RenderModeToggle } from "@/components/studio/render-mode-toggle";
import { TemplateForm } from "@/components/studio/template-form";
import { RenderScriptForm } from "@/components/studio/renderscript-form";
import { RenderStatus } from "@/components/studio/render-status";
import { ScheduleForm } from "@/components/studio/schedule-form";

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
        if (typeof v === "string" && v) { name = v; break; }
      }
      if (!name) name = id || "—";
      return { id, name };
    })
    .filter((x) => x.id);
}

export default function StudioPage() {
  const { toast } = useToast();
  const [mode, setMode] = useState<"template" | "renderscript">("template");
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
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
        const data = (await res.json()) as { templates?: VideoTemplate[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Failed to load templates");
        const list = data.templates ?? [];
        setTemplates(list);
        setTemplateId((prev) => prev || list[0]?.id || "");
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("Failed to load templates:", e);
        toast.error(msg);
      } finally {
        setTemplatesLoading(false);
      }
    })();
  }, [toast]);

  const loadGhl = useCallback(async () => {
    try {
      const [aRes, uRes] = await Promise.all([fetch("/api/ghl/accounts"), fetch("/api/ghl/users")]);
      const aJson = (await aRes.json()) as unknown;
      const uJson = (await uRes.json()) as unknown;
      if (aRes.ok) setAccounts(pickIdNameList(aJson, ["name", "platform", "accountName", "title"]));
      if (uRes.ok) setUsers(pickIdNameList(uJson, ["name", "firstName", "email", "lastName"]));
    } catch { /* GHL is optional */ }
  }, []);

  useEffect(() => { void loadGhl(); }, [loadGhl]);

  const pollJob = useCallback(async (id: string) => {
    setPollMsg("Polling…");
    const res = await fetch(`/api/renders/${id}`);
    const data = (await res.json()) as { job?: RenderJob; error?: string };
    if (!res.ok) { setPollMsg(data.error ?? "Poll failed"); return; }
    const updated = data.job ?? null;
    setJob(updated);
    setPollMsg(updated?.status ?? "");
    if (updated?.status === "succeeded") toast.success("Render complete!");
    if (updated?.status === "failed") toast.error("Render failed");
  }, [toast]);

  useEffect(() => {
    if (!job?.id || job.status === "succeeded" || job.status === "failed") return;
    const t = setInterval(() => { void pollJob(job.id); }, 2500);
    return () => clearInterval(t);
  }, [job?.id, job?.status, pollJob]);

  const startRender = async () => {
    setLoading(true);
    setPollMsg("");
    try {
      const imageUrls = imageUrlsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const body =
        mode === "template"
          ? { mode: "template" as const, campaignProfile, videoTemplateId: templateId, hook: hook || undefined, subhead: subhead || undefined, cta: cta || undefined }
          : { mode: "renderscript" as const, campaignProfile, hook: hook || "Upgrade your home", subhead: subhead || "Window Depot USA · Milwaukee", cta: cta || "Book your FREE estimate", phone: phone || undefined, imageUrls: imageUrls.length ? imageUrls : undefined, headshotUrl: headshotUrl.trim() || undefined };
      const res = await fetch("/api/renders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as { job?: RenderJob; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Render failed");
      setJob(data.job ?? null);
      setPollMsg(data.job?.status ?? "");
      toast.info("Render started — polling for status…");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setPollMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const schedule = async () => {
    if (!job?.id) { toast.error("Start a render first."); return; }
    setScheduleMsg("");
    try {
      const res = await fetch("/api/ghl/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ renderJobId: job.id, accountIds: selectedAccounts, userId, scheduleDate, summary: summary || hook || "WDUSA Reel", type: "reel" }),
      });
      const data = (await res.json()) as { error?: string; scheduledPost?: { id: string } };
      if (!res.ok) throw new Error(data.error ?? "Schedule failed");
      const msg = `Scheduled (${data.scheduledPost?.id ?? "ok"})`;
      setScheduleMsg(msg);
      toast.success(msg);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setScheduleMsg(msg);
      toast.error(msg);
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Studio</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Render with a Creatomate template or template-free RenderScript, then schedule to GoHighLevel.
        </p>
      </div>

      <Card>
        <CampaignSelect value={campaignProfile} onChange={setCampaignProfile} />
      </Card>

      <Card>
        <RenderModeToggle mode={mode} onChange={setMode} />

        <div className="mt-4">
          {mode === "template" ? (
            <TemplateForm templates={templates} templateId={templateId} onTemplateChange={setTemplateId} loading={templatesLoading} />
          ) : (
            <RenderScriptForm phone={phone} onPhoneChange={setPhone} imageUrlsText={imageUrlsText} onImageUrlsChange={setImageUrlsText} headshotUrl={headshotUrl} onHeadshotChange={setHeadshotUrl} />
          )}
        </div>

        <div className="mt-4 space-y-3">
          <Input label="Hook" value={hook} onChange={(e) => setHook(e.target.value)} />
          <Textarea label="Subhead" value={subhead} onChange={(e) => setSubhead(e.target.value)} rows={2} />
          <Input label="CTA" value={cta} onChange={(e) => setCta(e.target.value)} />
        </div>

        <Button
          className="mt-4 w-full"
          size="lg"
          loading={loading}
          disabled={mode === "template" && (!templateId || templates.length === 0)}
          data-testid="studio-start-render"
          onClick={() => void startRender()}
        >
          {loading ? "Starting…" : "Start render"}
        </Button>

        {job ? <RenderStatus job={job} pollMsg={pollMsg} onRefresh={() => void pollJob(job.id)} /> : null}
      </Card>

      <ScheduleForm
        accounts={accounts}
        users={users}
        selectedAccounts={selectedAccounts}
        onToggleAccount={toggleAccount}
        userId={userId}
        onUserChange={setUserId}
        scheduleDate={scheduleDate}
        onDateChange={setScheduleDate}
        summary={summary}
        onSummaryChange={setSummary}
        onSchedule={() => void schedule()}
        scheduleMsg={scheduleMsg}
      />
    </div>
  );
}
