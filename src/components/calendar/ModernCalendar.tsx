"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

type Props = {
  selected?: Date;
  onSelect?: (d?: Date) => void;
  busyDays?: string[]; // YYYY-MM-DD
};

export function ModernCalendar({ selected, onSelect, busyDays = [] }: Props) {
  const busy = new Set(busyDays);

  return (
    <GlassCard className="p-0 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Calendar</h3>
        <Badge variant="secondary" className="bg-white/70">
          iOS / macOS style
        </Badge>
      </div>

      <div className="px-2 pb-2">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={onSelect}
          weekStartsOn={0}
          className={cn(
            "[--rdp-accent-color:#111827] [--rdp-background-color:rgba(255,255,255,0.9)]",
            "rdp"
          )}
          styles={{
            caption: { fontWeight: 600, color: "#111827" },
            day: { borderRadius: 12 },
            head_cell: { color: "#6b7280" },
            nav: { color: "#111827" },
            day_selected: {
              backgroundColor: "rgba(17,24,39,1)",
              color: "white",
            },
            day_outside: { color: "#c9ced6" },
          }}
          modifiers={{
            busy: (date) => busy.has(date.toISOString().slice(0, 10)),
          }}
          modifiersClassNames={{
            busy:
              "!relative after:content-[''] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:size-1.5 after:rounded-full after:bg-zinc-900",
          }}
        />
      </div>
    </GlassCard>
  );
}
