"use client";

import * as React from "react";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { GeneralSettings } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface IdealDaysCalculatorProps {
    initialValue: number;
}

export function IdealDaysCalculator({ initialValue }: IdealDaysCalculatorProps) {
    const firestore = useFirestore();

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);

    const { data: settings, isLoading } = useDoc<GeneralSettings>(settingsRef);

    if (isLoading) {
        return <Skeleton className="h-10 w-24 rounded-[12px]" />;
    }

    const dailyPayTarget = settings?.dailyPayTarget || 0;

    // Logic: Initial Value / Daily Pay Target
    let idealDays = "-";
    if (dailyPayTarget > 0 && initialValue > 0) {
        const calculated = initialValue / dailyPayTarget;
        // Format to 1 decimal place if needed, otherwise integer
        idealDays = Number.isInteger(calculated)
            ? calculated.toString()
            : calculated.toFixed(1);
    }

    return (
        <div className="bg-[#F2F4F5] h-10 w-24 rounded-[12px] flex items-center justify-center">
            <span className="text-xl font-extrabold text-zinc-900">{idealDays}</span>
        </div>
    );
}
