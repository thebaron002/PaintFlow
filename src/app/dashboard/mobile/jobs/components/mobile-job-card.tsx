"use client";

import Link from "next/link";
import { format } from "date-fns";
import { MapPin, Calendar, ChevronRight } from "lucide-react";
import type { Job } from "@/app/lib/types";
import { cn } from "@/lib/utils";

function NanoGlassCard({ className, children, onClick }: { className?: string, children: React.ReactNode, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-[24px] shadow-sm transition-all relative overflow-hidden",
                onClick && "active:scale-[0.98] active:shadow-none cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}

export function MobileJobCard({ job }: { job: Job }) {
    const price = job.initialValue || 0;
    // Using initialValue as per mockup $1234.56 style. 
    // Real logic might need calculateJobPayout(job) if complex.

    const statusLabel = job.status === "In Progress" ? "In Progress" : job.status;

    return (
        <Link href={`/dashboard/mobile/jobs/${job.id}`}>
            <NanoGlassCard className="p-5 flex flex-col gap-4">
                {/* Header: Title & Chevron */}
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                        <h3 className="text-zinc-900 font-extrabold text-[20px] leading-tight truncate">
                            {job.title || `${job.clientName.split(' ').pop()} #${job.quoteNumber}`}
                        </h3>
                        <p className="text-zinc-500 font-normal text-sm truncate mt-0.5">
                            {job.clientName}
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 mt-1 shrink-0" />
                </div>

                {/* Body: 2 Columns */}
                <div className="flex gap-4">
                    {/* Left Col: Location & Price */}
                    <div className="flex-1 flex flex-col justify-between gap-3 min-w-0">
                        {/* Address */}
                        <div className="flex items-start gap-2 text-zinc-800 text-sm font-medium">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-900" strokeWidth={2} />
                            <span className="leading-tight line-clamp-2">{job.address}</span>
                        </div>

                        {/* Price Badge (Gray Pill, Bold Text) */}
                        <div className="bg-[#F2F4F5] rounded-[14px] px-4 py-2 self-start">
                            <span className="text-zinc-950 font-extrabold text-xl tracking-tight">
                                $ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>

                    {/* Right Col: Date & Status */}
                    <div className="flex-1 flex flex-col justify-between gap-3 items-end text-right min-w-0">
                        {/* Dates */}
                        <div className="text-sm font-medium text-zinc-800 flex flex-col gap-1 items-end">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-900 shrink-0" strokeWidth={2} />
                                <span>{job.startDate ? format(new Date(job.startDate), "MMM dd, yyyy") : "-"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-zinc-900 shrink-0" strokeWidth={2} />
                                <span>
                                    {(job.status === 'Complete' || job.status === 'Finalized' || job.status === 'Open Payment') && job.deadline
                                        ? format(new Date(job.deadline), "MMM dd, yyyy")
                                        : "-"}
                                </span>
                            </div>
                        </div>

                        {/* Status Pill */}
                        <div className="bg-[#F2F4F5] px-4 py-1.5 rounded-full">
                            <span className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
                                {statusLabel}
                            </span>
                        </div>
                    </div>
                </div>
            </NanoGlassCard>
        </Link>
    );
}
