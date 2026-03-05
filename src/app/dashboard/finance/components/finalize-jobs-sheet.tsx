"use client";

import * as React from "react";
import { format } from "date-fns";
import { Check, LoaderCircle, ReceiptText, ChevronRight, CheckCircle2, Circle } from "lucide-react";

// Types
import type { Job, GeneralSettings } from "@/app/lib/types";
import { calculateJobPayout } from "@/app/lib/job-financials";

// Firebase
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";

// UI Components
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose
} from "@/components/ui/sheet";

interface FinalizeJobsSheetProps {
    jobs: Job[];
    settings: GeneralSettings | null | undefined;
}

export function FinalizeJobsSheet({ jobs, settings }: FinalizeJobsSheetProps) {
    const firestore = useFirestore();
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedJobIds, setSelectedJobIds] = React.useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Filter jobs that are ready to be finalized
    const jobsToFinalize = React.useMemo(() => {
        return jobs.filter(job =>
            (job.status === 'Complete' || job.status === 'Open Payment') &&
            !job.finalizationDate
        ).sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime());
    }, [jobs]);

    // Calculate total value of selected jobs
    const selectedTotal = React.useMemo(() => {
        return jobsToFinalize
            .filter(job => selectedJobIds.includes(job.id))
            .reduce((sum, job) => sum + calculateJobPayout(job, settings || null), 0);
    }, [jobsToFinalize, selectedJobIds, settings]);

    // Toggle selection
    const toggleJob = (jobId: string) => {
        setSelectedJobIds(prev =>
            prev.includes(jobId)
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    // Toggle all
    const toggleAll = () => {
        if (selectedJobIds.length === jobsToFinalize.length) {
            setSelectedJobIds([]);
        } else {
            setSelectedJobIds(jobsToFinalize.map(j => j.id));
        }
    };

    // Handle Finalization
    const handleFinalize = async () => {
        if (!firestore) return;
        setIsSubmitting(true);

        try {
            // Process updates
            const now = new Date().toISOString();

            selectedJobIds.forEach(jobId => {
                const jobRef = doc(firestore, "users", "henrique", "jobs", jobId); // Ideally usera.uid, but for now assuming context or passed prop. 
                // Wait, I need the user ID. I should probably pass user ID or use useUser hook inside here.
                // Let's fix this in the next step or assume the component is used inside a context where user is available.
                // Actually, I'll use the useUser hook here as well.
            });

            // Since I need user ID and didn't import useUser, I will fix this in the implementation below.
        } catch (error) {
            console.error("Error finalizing jobs:", error);
        }
    };

    // Refined implementation with correct user context
    return <FinalizeJobsSheetImplementation jobs={jobs} settings={settings} jobsToFinalize={jobsToFinalize} selectedTotal={selectedTotal} selectedJobIds={selectedJobIds} toggleJob={toggleJob} toggleAll={toggleAll} isOpen={isOpen} setIsOpen={setIsOpen} />;
}

// Breaking it down to allow hook usage cleanly
import { useUser } from "@/firebase";

function FinalizeJobsSheetImplementation({
    jobs, settings, jobsToFinalize, selectedTotal, selectedJobIds, toggleJob, toggleAll, isOpen, setIsOpen
}: any) {
    const { user } = useUser();
    const firestore = useFirestore();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleFinalize = async () => {
        if (!firestore || !user) return;
        setIsSubmitting(true);

        try {
            const now = new Date().toISOString();

            // Loop through selected jobs and update them
            for (const jobId of selectedJobIds) {
                const jobRef = doc(firestore, "users", user.uid, "jobs", jobId);

                // Using non-blocking update for speed/UX
                updateDocumentNonBlocking(jobRef, {
                    status: 'Finalized',
                    finalizationDate: now
                });
            }

            // Close sheet after a small delay to simulate processing
            setTimeout(() => {
                setIsSubmitting(false);
                setIsOpen(false);
            }, 500);

        } catch (error) {
            console.error("Error finalizing:", error);
            setIsSubmitting(false);
        }
    };

    if (jobsToFinalize.length === 0) return null;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <button className="bg-white p-3 rounded-[24px] shadow-sm border border-zinc-100 flex flex-col items-center gap-2 active:scale-95 transition-all relative overflow-hidden group">
                    {/* Badge for count */}
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center border border-amber-200">
                        <span className="text-[9px] font-bold text-amber-700">{jobsToFinalize.length}</span>
                    </div>

                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                        <CheckCircle2 className="w-5 h-5 text-amber-500" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-tight text-center text-zinc-900 leading-tight">Finalize<br />Jobs</span>
                </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92%] rounded-t-[32px] p-0 overflow-hidden border-none flex flex-col">
                <div className="flex-1 flex flex-col pt-6 overflow-hidden">
                    <SheetHeader className="px-6 pb-4 shrink-0">
                        <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-4" />
                        <div className="flex items-center justify-between">
                            <div>
                                <SheetTitle className="text-2xl font-black tracking-tight">Finalize Jobs</SheetTitle>
                                <SheetDescription className="font-medium">Close jobs to update your revenue.</SheetDescription>
                            </div>
                            <Button variant="ghost" size="sm" onClick={toggleAll} className="font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                                {selectedJobIds.length === jobsToFinalize.length ? "Deselect All" : "Select All"}
                            </Button>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 pb-20">
                        <div className="flex flex-col gap-3">
                            {jobsToFinalize.map((job: Job) => {
                                const isSelected = selectedJobIds.includes(job.id);
                                const payout = calculateJobPayout(job, settings || null);

                                return (
                                    <div
                                        key={job.id}
                                        onClick={() => toggleJob(job.id)}
                                        className={cn(
                                            "p-4 rounded-[20px] border transition-all active:scale-[0.98] cursor-pointer flex items-center gap-4",
                                            isSelected
                                                ? "bg-amber-50 border-amber-200 shadow-sm"
                                                : "bg-white border-zinc-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                            isSelected ? "bg-amber-500 border-amber-500" : "border-zinc-200 bg-white"
                                        )}>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={cn("font-bold text-sm truncate", isSelected ? "text-amber-950" : "text-zinc-900")}>
                                                {job.title || `Job #${job.quoteNumber}`}
                                            </h4>
                                            <p className="text-[10px] text-zinc-500 font-medium truncate">{job.address}</p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span className={cn("font-black text-sm", isSelected ? "text-amber-700" : "text-zinc-900")}>
                                                $ {payout.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-6 bg-white border-t border-zinc-100 shrink-0 mb-safe">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Selected</span>
                            <span className="text-2xl font-black text-zinc-900">$ {selectedTotal.toLocaleString()}</span>
                        </div>
                        <Button
                            className="w-full h-14 rounded-2xl bg-zinc-950 font-black text-white hover:bg-zinc-800 disabled:opacity-50 text-lg shadow-lg shadow-zinc-200"
                            onClick={handleFinalize}
                            disabled={selectedJobIds.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <LoaderCircle className="w-5 h-5 mr-2 animate-spin" />
                                    Finalizing...
                                </>
                            ) : (
                                `Finalize ${selectedJobIds.length} Job${selectedJobIds.length !== 1 ? 's' : ''}`
                            )}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
