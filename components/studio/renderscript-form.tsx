"use client";

import { Input, Textarea } from "@/components/ui";

type Props = {
  phone: string;
  onPhoneChange: (v: string) => void;
  imageUrlsText: string;
  onImageUrlsChange: (v: string) => void;
  headshotUrl: string;
  onHeadshotChange: (v: string) => void;
};

export function RenderScriptForm({
  phone,
  onPhoneChange,
  imageUrlsText,
  onImageUrlsChange,
  headshotUrl,
  onHeadshotChange,
}: Props) {
  return (
    <div className="space-y-3">
      <Input
        label="Phone on CTA card"
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
      />
      <Textarea
        label="Background image URLs"
        hint="One per line or comma-separated"
        value={imageUrlsText}
        onChange={(e) => onImageUrlsChange(e.target.value)}
        rows={3}
        placeholder="https://…"
        className="font-mono text-xs"
      />
      <Input
        label="Headshot URL (optional)"
        value={headshotUrl}
        onChange={(e) => onHeadshotChange(e.target.value)}
      />
    </div>
  );
}
