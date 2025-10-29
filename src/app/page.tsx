"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { GlassCard } from "@/components/ui/glass-card";
import { ModernCalendar } from "@/components/calendar/ModernCalendar";
import { RecentProjects } from "@/components/dashboard/RecentProjects";
import { CompletedProjects } from "@/components/dashboard/CompletedProjects";
import { RevenueChart } from "./dashboard/components/revenue-chart";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <DashboardHeader />

      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Revenue Overview</h3>
          </div>
          <RevenueChart />
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
