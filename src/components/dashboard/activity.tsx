"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type Activity = { id: string; who: string; what: string; when: string };

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <h3 className="text-white text-lg font-semibold mb-4">Recent Activity</h3>
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarFallback className="bg-white/10 text-white">{a.who.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-white/90">
                <span className="font-medium text-white">{a.who}</span> {a.what}
              </p>
              <p className="text-xs text-white/60">{a.when}</p>
            </div>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
