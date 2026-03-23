"use client";

import { Button } from "@/components/ui";

type Props = {
  url: string;
};

export function VideoPreview({ url }: Props) {
  return (
    <div className="space-y-2">
      <div className="mx-auto overflow-hidden rounded-lg border border-[var(--border)]" style={{ maxWidth: 270 }}>
        <video
          src={url}
          controls
          playsInline
          className="w-full"
          style={{ aspectRatio: "9/16" }}
        >
          <track kind="captions" />
        </video>
      </div>
      <div className="flex justify-center gap-2">
        <a href={url} target="_blank" rel="noreferrer" download>
          <Button variant="secondary" size="sm">
            Download MP4
          </Button>
        </a>
        <a href={url} target="_blank" rel="noreferrer">
          <Button variant="ghost" size="sm">
            Open in new tab
          </Button>
        </a>
      </div>
    </div>
  );
}
