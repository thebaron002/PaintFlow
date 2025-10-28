"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input"; // shadcn
import { Bell, Search } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
          Income Tracker
        </h1>
        <p className="text-zinc-700 mt-2">
          Acompanhe seu faturamento e métricas semanais.
        </p>
      </div>
      <GlassCard className="flex items-center gap-3">
        <Search className="size-4 text-zinc-600" />
        <Input
          placeholder="Buscar..."
          className="border-none bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />
        <div className="ml-auto inline-flex size-10 items-center justify-center rounded-full bg-white/70 shadow-soft">
          <Bell className="size-4" />
        </div>
      </GlassCard>
    </div>
  );
}
