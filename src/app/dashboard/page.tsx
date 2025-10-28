"use client";

import { KPI } from "@/components/dashboard/kpi";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { Upcoming } from "@/components/dashboard/upcoming";
import { RecentActivity } from "@/components/dashboard/activity";
import { GlassCard } from "@/components/ui/glass-card";
import { DollarSign, ClipboardList, Users, Calendar } from "lucide-react";

const revenue = [
  { name: "W1", value: 820 },
  { name: "W2", value: 1260 },
  { name: "W3", value: 980 },
  { name: "W4", value: 1480 },
  { name: "W5", value: 1310 },
  { name: "W6", value: 1710 },
  { name: "W7", value: 1560 },
  { name: "W8", value: 1925 },
];

const upcoming = [
  { id: "1", title: "Holly Carson – Hank", date: "Oct 29", address: "Lake St Louis, MO", status: "In Progress" as const },
  { id: "2", title: "Kitchen – White Sands", date: "Oct 31", address: "St Charles, MO", status: "Scheduled" as const },
  { id: "3", title: "Deck repaint – Willow", date: "Nov 03", address: "O'Fallon, MO", status: "Scheduled" as const },
];

const activity = [
  { id: "a", who: "Josh", what: "assigned crew to job #142", when: "2h ago" },
  { id: "b", who: "Henrique", what: "added invoice $200.33 (Sherwin-Williams)", when: "4h ago" },
  { id: "c", who: "Nina", what: "updated schedule for job #138", when: "Yesterday" },
];

export default function DashboardPage() {
  return (
    <div
      className="
        relative
        -m-4 sm:-m-6
        min-h-[calc(100vh-theme(spacing.14))]
        bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(96,165,250,0.20),transparent),
             radial-gradient(1000px_600px_at_90%_0%,rgba(168,85,247,0.18),transparent),
             linear-gradient(180deg,#0B0F13_0%,#0B0F13_100%)]
        px-4 py-6 sm:px-6 lg:px-8
      "
    >
      <div className="mx-auto max-w-7xl">
        {/* header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Dashboard</h1>
            <p className="text-white/70">Snapshot of your painting business</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI label="Revenue (30d)" value="$12,430" deltaLabel="+8.2% vs last 30d" icon={DollarSign} />
          <KPI label="Open Jobs" value="12" deltaLabel="+1 new" icon={ClipboardList} />
          <KPI label="Active Crew" value="5" deltaLabel="0 today" icon={Users} />
          <KPI label="This Week" value="9 appts" deltaLabel="+2 added" icon={Calendar} />
        </div>

        {/* Main grid */}
        <div className="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart data={revenue} />
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              <Upcoming items={upcoming} />
              <RecentActivity items={activity} />
            </div>
          </div>

          {/* Right rail – notas/atalhos (exemplo) */}
          <div className="space-y-6">
            <GlassCard className="p-6">
              <h3 className="text-white text-lg font-semibold mb-3">Quick Actions</h3>
              <ul className="space-y-2 text-white/90">
                <li>• New Job</li>
                <li>• Add Invoice</li>
                <li>• Assign Crew</li>
              </ul>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-white text-lg font-semibold mb-3">Tips</h3>
              <p className="text-white/70">
                Use consistent labor & material rates in Settings to get instant profitability on each Job.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
