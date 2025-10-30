
"use client";

import type { Job, GeneralSettings } from "@/app/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, CircleDollarSign, PiggyBank, Wrench } from "lucide-react";

interface JobAnalysisCardProps {
  job: Job;
  settings: GeneralSettings | null;
}

const StatItem = ({ icon: Icon, label, value, valueColor }: { icon: React.ElementType, label: string, value: string, valueColor?: string }) => (
    <div className="flex items-start gap-3">
        <div className="bg-muted p-2 rounded-md">
            <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-semibold", valueColor)}>{value}</p>
        </div>
    </div>
);

export function JobAnalysisCard({ job, settings }: JobAnalysisCardProps) {
  const materialCost = job.invoices
    ?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

  const globalHourlyRate = settings?.hourlyRate ?? 0;
  const totalAdjustmentsValue = job.adjustments?.reduce((sum, adj) => {
    if (adj.type === "Time") {
      const rate = adj.hourlyRate ?? globalHourlyRate;
      return sum + adj.value * rate;
    }
    return sum + adj.value;
  }, 0) ?? 0;
  
  const baseValue = job.isFixedPay ? job.initialValue : job.budget;
  const payout = baseValue + totalAdjustmentsValue;
  const profit = payout - materialCost;

  const profitColor = profit >= 0 ? "text-green-600" : "text-red-600";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Analysis</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-6">
        <StatItem 
            icon={CircleDollarSign} 
            label="Payout" 
            value={`$${payout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatItem
            icon={Wrench}
            label="Material Cost"
            value={`$${materialCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
        <StatItem
            icon={PiggyBank}
            label="Profit"
            value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor={profitColor}
        />
      </CardContent>
    </Card>
  );
}
