"use client";

import { Button, StatusBadge } from "@/components/ui";
import { VideoPreview } from "@/components/studio/video-preview";

type RenderJob = {
  id: string;
  status: string;
  creatomateRenderId: string | null;
  outputUrl: string | null;
  error: string | null;
};

type Props = {
  job: RenderJob;
  pollMsg: string;
  onRefresh: () => void;
};

export function RenderStatus({ job, pollMsg, onRefresh }: Props) {
  return (
    <div className="mt-4 space-y-3 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] p-3" data-testid="studio-render-status">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">Job</span>
            <code className="text-xs font-mono">{job.id.slice(0, 12)}…</code>
          </div>
          <StatusBadge status={job.status} />
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>

      {job.status === "succeeded" && job.outputUrl ? (
        <VideoPreview url={job.outputUrl} />
      ) : null}

      {job.outputUrl && job.status !== "succeeded" ? (
        <p className="break-all text-xs">
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
        <p className="text-xs text-[var(--danger-text)]">{job.error}</p>
      ) : null}

      {pollMsg && pollMsg !== job.status ? (
        <p className="text-[11px] text-[var(--text-muted)]">{pollMsg}</p>
      ) : null}
    </div>
  );
}
