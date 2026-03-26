"use client";

import Link from "next/link";
import { Select } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";

type VideoTemplate = {
  id: string;
  name: string;
  creatomateTemplateId: string;
  aspectRatio: string;
  active: boolean;
};

type Props = {
  templates: VideoTemplate[];
  templateId: string;
  onTemplateChange: (id: string) => void;
  loading?: boolean;
};

export function TemplateForm({ templates, templateId, onTemplateChange, loading }: Props) {
  if (loading) {
    return (
      <div data-testid="template-form-skeleton">
        <Skeleton className="h-[58px] w-full" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div
        className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--code-bg)]/60 px-4 py-4 text-center"
        data-testid="template-form-empty"
      >
        <p className="text-sm text-[var(--text-secondary)]">
          No active video templates in the database. Add one under{" "}
          <Link href="/templates" className="font-medium text-[var(--accent)] underline underline-offset-2">
            Templates
          </Link>{" "}
          or run <code className="rounded bg-[var(--surface-raised)] px-1 font-mono text-xs">npm run db:seed</code>.
        </p>
      </div>
    );
  }

  return (
    <Select
      label="Video template"
      value={templateId}
      onChange={(e) => onTemplateChange(e.target.value)}
      data-testid="studio-template-select"
    >
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.aspectRatio})
        </option>
      ))}
    </Select>
  );
}
