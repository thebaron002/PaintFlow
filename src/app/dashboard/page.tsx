
"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { ModernCalendar } from "@/components/calendar/ModernCalendar";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { CompletedProjects } from "@/components/dashboard/CompletedProjects";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Gráfico “Income Tracker” fake para agora */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Income Tracker</h3>
            <div className="rounded-xl bg-white/70 px-3 py-1 text-sm shadow-soft">
              Week
            </div>
          </div>

          {/* placeholder do gráfico */}
          <div className="grid grid-cols-7 gap-6 pt-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-2 rounded-full bg-zinc-900"
                  style={{ height: `${40 + i * 12}px` }}
                />
                <span className="text-sm text-zinc-700">
                  {"SMTWTFS"[i]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <RecentProjects />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <ModernCalendar busyDays={["2025-10-23", "2025-10-24", "2025-10-27"]} />
        <CompletedProjects />
      </div>
    </div>
  );
}
