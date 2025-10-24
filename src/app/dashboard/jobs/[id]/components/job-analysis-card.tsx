
"use client";

import type { Job, GeneralSettings } from "@/app/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, TrendingDown, TrendingUp, ClipboardList } from "lucide-react";

interface JobAnalysisCardProps {
  job: Job;
  settings: GeneralSettings | null;
}

const StatItem = ({ icon: Icon, label, value, valueColor, subtext }: { icon: React.ElementType, label: string, value: string, valueColor?: string, subtext?: string }) => (
    <div className="flex items-start gap-3">
        <div className="bg-muted p-2 rounded-md">
            <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className={cn("text-lg font-semibold", valueColor)}>{value}</p>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </div>
    </div>
);

export function JobAnalysisCard({ job, settings }: JobAnalysisCardProps) {
  // 1. Calculate Total Material Cost from adjustments
  const materialCost = job.adjustments
    ?.filter((adj) => adj.type === "Material")
    .reduce((sum, adj) => sum + adj.value, 0) ?? 0;

  // 2. Calculate Total Adjustments value (for profit calculation)
  const globalHourlyRate = settings?.hourlyRate ?? 0;
  const totalAdjustmentsValue = job.adjustments?.reduce((sum, adj) => {
    if (adj.type === "Time") {
      const rate = adj.hourlyRate ?? globalHourlyRate;
      return sum + adj.value * rate;
    }
    // General adjustments can be positive or negative. Material adjustments are added to the payout.
    return sum + adj.value;
  }, 0) ?? 0;

  // 3. Calculate Profit. This should be the total amount paid/payable to you minus your costs.
  // The client pays initialValue + totalAdjustmentsValue.
  // The cost is materialCost (assuming you pay for materials out of pocket initially).
  const totalRevenue = job.initialValue + totalAdjustmentsValue;
  const profit = totalRevenue - materialCost;

  // 4. Calculate Daily Profit
  const dailyPayTarget = settings?.dailyPayTarget ?? 0;
  const numProductionDays = job.productionDays?.length || 0;
  const dailyProfit = numProductionDays > 0 ? profit / numProductionDays : 0;
  const dailyProfitColor = dailyProfit < dailyPayTarget ? "text-red-600" : "text-green-600";
  const dailyProfitIcon = dailyProfit < dailyPayTarget ? TrendingDown : TrendingUp;

  // 5. Calculate Material Usage Percentage
  const idealMaterialCostPercentage = settings?.idealMaterialCostPercentage ?? 0;
  const materialUsagePercentage = job.initialValue > 0 ? (materialCost / job.initialValue) * 100 : 0;
  const materialUsageColor = materialUsagePercentage > idealMaterialCostPercentage ? "text-red-600" : "text-green-600";
  const materialUsageIcon = materialUsagePercentage > idealMaterialCostPercentage ? TrendingDown : TrendingUp;
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Analysis</CardTitle>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-6">
        <StatItem 
            icon={Activity} 
            label="Profit" 
            value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
        />
        <StatItem
            icon={dailyProfitIcon}
            label="Daily Profit"
            value={`$${dailyProfit.toFixed(2)}`}
            valueColor={dailyProfitColor}
            subtext={`Target: $${dailyPayTarget.toLocaleString()}/day`}
        />
        <StatItem
            icon={ClipboardList}
            label="Material Cost"
            value={`$${materialCost.toLocaleString()}`}
            subtext={`Ideal: $${job.idealMaterialCost.toLocaleString()}`}
        />
        <StatItem
            icon={materialUsageIcon}
            label="Material Usage"
            value={`${materialUsagePercentage.toFixed(1)}%`}
            valueColor={materialUsageColor}
            subtext={`Ideal: ${idealMaterialCostPercentage}%`}
        />
      </CardContent>
    </Card>
  );
}
