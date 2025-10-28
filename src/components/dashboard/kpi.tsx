"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function KPI({
  label,
  value,
  deltaLabel,
  positive = true,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  deltaLabel?: string;
  positive?: boolean;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <GlassCard className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs/5 uppercase tracking-wider text-white/70">{label}</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{value}</h3>
          {deltaLabel && (
            <Badge
              variant="secondary"
              className={cn(
                "mt-3 bg-white/15 text-white",
                positive ? "border-emerald-400/40 text-emerald-300" : "border-rose-400/40 text-rose-300"
              )}
            >
              {deltaLabel}
            </Badge>
          )}
        </div>
        {Icon ? (
          <div className="rounded-xl bg-white/15 p-3 text-white/80">
            <Icon size={22} />
          </div>
        ) : null}
      </div>
    </GlassCard>
  );
}
