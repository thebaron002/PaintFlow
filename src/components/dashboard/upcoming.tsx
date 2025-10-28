"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";

type Job = { id: string; title: string; date: string; address: string; status: "In Progress" | "Scheduled" | "Completed" };

export function Upcoming({ items }: { items: Job[] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <h3 className="text-white text-lg font-semibold mb-4">Upcoming</h3>
      <ul className="space-y-4">
        {items.map((j) => (
          <li key={j.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="text-white font-medium">{j.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays size={16} /> {j.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={16} /> {j.address}
                </span>
              </div>
            </div>
            <Badge className="bg-white/15 text-white border-white/20">{j.status}</Badge>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
