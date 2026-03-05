
"use client";

import type { Job, GeneralSettings } from "@/app/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Activity, CircleDollarSign, PiggyBank, Wrench, Target } from "lucide-react";
import { calculateJobPayout, calculateContractorCost, calculateJobProfit, calculateMaterialCost } from "@/app/lib/job-financials";

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
  const contractorCost = calculateContractorCost(job.invoices);
  const materialCost = calculateMaterialCost(job.invoices);
  const payout = calculateJobPayout(job, settings);
  const profit = calculateJobProfit(job, settings);
  
  const sharePercentage = settings?.sharePercentage ?? 70; // fallback to 70%
  const totalJobValue = job.initialValue > 0 && sharePercentage > 0
    ? job.initialValue / (sharePercentage / 100)
    : 0;

  const materialUsagePercentage = totalJobValue > 0 ? (materialCost / totalJobValue) * 100 : 0;

  const totalProductionDays = (job.productionDays || []).reduce((acc, day) => {
    if (day.dayType === 'full') return acc + 1;
    if (day.dayType === 'half') return acc + 0.5;
    return acc;
  }, 0);

  const dailyProfit = totalProductionDays > 1 ? profit / totalProductionDays : (totalProductionDays > 0 ? profit : 0);

  const profitColor = profit >= 0 ? "text-green-600" : "text-red-600";
  const dailyProfitColor = dailyProfit >= 0 ? "text-green-600" : "text-red-600";
  
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
            label="Contractor Cost"
            value={`$${contractorCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />
         <StatItem
            icon={Activity}
            label="Material Usage"
            value={`${materialUsagePercentage.toFixed(2)}%`}
        />
        <StatItem
            icon={PiggyBank}
            label="Profit"
            value={`$${profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor={profitColor}
        />
        <StatItem
            icon={Target}
            label="Daily Profit"
            value={`$${dailyProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            valueColor={dailyProfitColor}
        />
      </CardContent>
    </Card>
  );
}
