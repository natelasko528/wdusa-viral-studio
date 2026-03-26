"use client";

import { useCallback, useEffect, useState } from "react";
import type { SocialPlatform, ContentType } from "@prisma/client";
import { Skeleton } from "@/components/ui";

type CalendarSlot = {
  dayOfWeek: number;
  timeSlot: string;
  platform: SocialPlatform;
  contentType: ContentType;
  topicSuggestion: string;
  framework: string;
  frameworkName: string;
  frameworkDescription?: string;
  platformLabel: string;
  date: string;
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#E1306C",
  facebook: "#1877F2",
  tiktok: "#00f2ea",
  twitter: "#1DA1F2",
  linkedin: "#0A66C2",
  youtube_shorts: "#FF0000",
};

type Props = {
  selectedPlatforms?: SocialPlatform[];
  onSlotClick?: (slot: CalendarSlot) => void;
};

export function CalendarView({ selectedPlatforms, onSlotClick }: Props) {
  const [slots, setSlots] = useState<CalendarSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedPlatforms?.length) {
        params.set("platforms", selectedPlatforms.join(","));
      }
      const res = await fetch(`/api/content-strategy/calendar?${params}`);
      const data = (await res.json()) as { slots?: CalendarSlot[] };
      setSlots(data.slots ?? []);
    } catch {
      /* calendar is advisory */
    } finally {
      setLoading(false);
    }
  }, [selectedPlatforms]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  if (loading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  const byDay = DAY_NAMES.map((name, idx) => ({
    name,
    idx,
    slots: slots.filter((s) => s.dayOfWeek === idx),
  }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Weekly Content Calendar</h3>
        <span className="text-[10px] text-[var(--text-muted)]">{slots.length} posts/week</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {byDay.map((day) => (
          <div key={day.idx} className="space-y-1">
            <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] py-1">
              {day.name}
            </div>
            {day.slots.length === 0 ? (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--text-muted)]">
                Rest
              </div>
            ) : (
              day.slots.map((slot, i) => (
                <button
                  key={`${slot.platform}-${slot.timeSlot}-${i}`}
                  type="button"
                  onClick={() => onSlotClick?.(slot)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-left transition-all hover:shadow-sm hover:border-[var(--border-strong)] group"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: PLATFORM_COLORS[slot.platform] }}
                    />
                    <span className="text-[9px] font-medium text-[var(--text-muted)]">
                      {slot.timeSlot}
                    </span>
                  </div>
                  <div className="text-[10px] font-medium text-[var(--text-secondary)] leading-tight truncate group-hover:text-[var(--accent)]">
                    {slot.platformLabel}
                  </div>
                  <div className="mt-0.5 text-[9px] text-[var(--text-muted)] leading-tight truncate">
                    {slot.contentType.replace("_", " ")}
                  </div>
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
