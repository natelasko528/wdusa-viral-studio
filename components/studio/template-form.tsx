"use client";

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
    return <Skeleton className="h-[58px] w-full" />;
  }

  return (
    <Select
      label="Video template"
      value={templateId}
      onChange={(e) => onTemplateChange(e.target.value)}
    >
      {templates.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name} ({t.aspectRatio})
        </option>
      ))}
    </Select>
  );
}
