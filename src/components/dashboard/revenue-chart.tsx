"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

type P = { data: { name: string; value: number }[] };

export function RevenueChart({ data }: P) {
  return (
    <GlassCard className="p-4 sm:p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h3 className="text-white text-lg font-semibold">Revenue (last 8 weeks)</h3>
        <span className="text-white/60 text-sm">USD</span>
      </div>

      <div className="h-[220px] sm:h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.15} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.6)" }} tickMargin={8} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.6)" }} tickFormatter={(v) => `$${v}`} width={42} />
            <Tooltip
              contentStyle={{
                background: "rgba(18,18,20,0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 12,
                color: "#fff",
              }}
              formatter={(val: any) => [`$${val}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#93C5FD"
              strokeWidth={2.2}
              fill="url(#revGradient)"
              dot={{ r: 2.5, fill: "#93C5FD" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
