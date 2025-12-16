import * as React from "react";
import { cn } from "@/lib/utils";

export function DetailCard({ title, children, className }: { title?: string, children: React.ReactNode, className?: string }) {
    return (
        <div className={cn("bg-white rounded-[24px] p-5 shadow-sm mb-4", className)}>
            {title && <h3 className="text-lg font-bold text-zinc-900 mb-3">{title}</h3>}
            {children}
        </div>
    );
}

export function SectionRow({ label, value, valueClass }: { label: string, value: string | number, valueClass?: string }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-[15px] font-medium text-zinc-500">{label}</span>
            <span className={cn("text-[15px] font-bold text-zinc-900", valueClass)}>{value}</span>
        </div>
    );
}
