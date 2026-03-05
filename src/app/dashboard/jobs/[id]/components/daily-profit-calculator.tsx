"use client";

import * as React from "react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job, GeneralSettings } from "@/app/lib/types";
import { calculateJobProfit } from "@/app/lib/job-financials";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyProfitCalculatorProps {
    job: Job;
}

export function DailyProfitCalculator({ job }: DailyProfitCalculatorProps) {
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);

    const { data: settings, isLoading } = useDoc<GeneralSettings>(settingsRef);

    if (isLoading) {
        return <Skeleton className="h-4 w-20 rounded-md" />;
    }

    const profit = calculateJobProfit(job, settings || null);
    const productionDaysCount = job.productionDays?.length || 0;

    let dailyProfit = "-";
    if (productionDaysCount > 0) {
        const calculated = profit / productionDaysCount;
        dailyProfit = `$ ${calculated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    return (
        <span className="text-[15px] font-bold text-green-500">{dailyProfit}</span>
    );
}
