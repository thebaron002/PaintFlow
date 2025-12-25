"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, getWeek, getYear, startOfWeek, endOfWeek } from "date-fns";
import {
    Wallet,
    Calendar,
    ChevronRight,
    History,
    MoreVertical,
    Check,
    AlertCircle,
    LoaderCircle,
    RefreshCw,
    X,
    Plus,
    DollarSign,
    Briefcase
} from "lucide-react";

// Types
import type { Job, PayrollReport, GeneralSettings } from "@/app/lib/types";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Firebase
import {
    useUser,
    useFirestore,
    useMemoFirebase,
    useCollection,
    useDoc,
    addDocumentNonBlocking,
    deleteDocumentNonBlocking
} from "@/firebase";
import { collection, query, orderBy, limit, where, doc, getDocs, updateDoc, writeBatch } from "firebase/firestore";

// Shared Logic
import { calculateJobPayout } from "@/app/lib/job-financials";
import { FloatingNav } from "../components/floating-nav";

// ---------------------------------------------------------------------
// NANO-UI COMPONENTS (v4)
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------

export default function MobilePayrollPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isGenerating, setIsGenerating] = React.useState(false);

    // -- Data Fetching --
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);

    const [selectedJobIds, setSelectedJobIds] = React.useState<Set<string>>(new Set());
    const [isMovingJobs, setIsMovingJobs] = React.useState(false);

    const openPaymentJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "users", user.uid, "jobs"),
            where("status", "==", "Open Payment")
        );
    }, [firestore, user]);
    const { data: jobsToPay, isLoading: isLoadingOpenPayment } = useCollection<Job>(openPaymentJobsQuery);

    const completeJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "users", user.uid, "jobs"),
            where("status", "==", "Complete")
        );
    }, [firestore, user]);
    const { data: completeJobs, isLoading: isLoadingCompleteJobs } = useCollection<Job>(completeJobsQuery);

    const reportsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "users", user.uid, "payrollReports"),
            orderBy("sentDate", "desc"),
            limit(10)
        );
    }, [firestore, user]);
    const { data: pastReports, isLoading: isLoadingReports } = useCollection<PayrollReport>(reportsQuery);

    // -- Derived State --
    const sortedOpenJobs = React.useMemo(() => {
        if (!jobsToPay) return [];
        return [...jobsToPay].sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());
    }, [jobsToPay]);

    const sortedCompleteJobs = React.useMemo(() => {
        if (!completeJobs) return [];
        return [...completeJobs].sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());
    }, [completeJobs]);

    const totalPayout = React.useMemo(() => {
        if (!sortedOpenJobs || !settings) return 0;
        return sortedOpenJobs.reduce((acc, job) => acc + calculateJobPayout(job, settings), 0);
    }, [sortedOpenJobs, settings]);

    // -- Handlers --
    const handleToggleSelection = (jobId: string) => {
        const newSet = new Set(selectedJobIds);
        if (newSet.has(jobId)) newSet.delete(jobId);
        else newSet.add(jobId);
        setSelectedJobIds(newSet);
    };

    const handleMoveToOpenPayment = async () => {
        if (selectedJobIds.size === 0 || !firestore || !user) return;

        setIsMovingJobs(true);
        try {
            const batch = writeBatch(firestore);
            selectedJobIds.forEach((jobId) => {
                const jobRef = doc(firestore, "users", user.uid, "jobs", jobId);
                batch.update(jobRef, { status: "Open Payment" });
            });
            await batch.commit();
            setSelectedJobIds(new Set());
            toast({ title: "Updated! 💸", description: `${selectedJobIds.size} jobs moved to payroll.` });
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: "Failed to update jobs." });
        } finally {
            setIsMovingJobs(false);
        }
    };

    const handleGenerateReport = async () => {
        if (!sortedOpenJobs.length || !firestore || !user) {
            toast({
                variant: "destructive",
                title: "No Jobs Ready",
                description: "Complete jobs and move them to payroll first.",
            });
            return;
        }

        setIsGenerating(true);
        try {
            const now = new Date();
            const week = getWeek(now);
            const year = getYear(now);

            // Basic dupe check (matching original logic)
            const reportsCollection = collection(firestore, 'users', user.uid, 'payrollReports');
            const q = query(reportsCollection, where('weekNumber', '==', week), where('year', '==', year));
            const snap = await getDocs(q);

            if (!snap.empty) {
                toast({ variant: "destructive", title: "Already Generated", description: `Weekly report for week ${week} exists.` });
                setIsGenerating(false);
                return;
            }

            const newReport = {
                weekNumber: week,
                year,
                startDate: startOfWeek(now).toISOString(),
                endDate: endOfWeek(now).toISOString(),
                sentDate: now.toISOString(),
                recipientCount: 0,
                totalPayout,
                jobCount: sortedOpenJobs.length,
                jobIds: sortedOpenJobs.map(j => j.id),
            };

            await addDocumentNonBlocking(reportsCollection, newReport);
            toast({ title: "Report Saved! 📄", description: "Weekly payroll history updated." });
        } catch (err) {
            console.error(err);
            toast({ variant: "destructive", title: "Error", description: "Failed to generate report." });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteReport = (reportId: string) => {
        if (!firestore || !user) return;
        const ref = doc(firestore, "users", user.uid, "payrollReports", reportId);
        deleteDocumentNonBlocking(ref);
        toast({ title: "Report Deleted" });
    };

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden">
            <div className="px-5 pt-16 max-w-md mx-auto">

                {/* 1. Header */}
                <div className="mb-8">
                    <h3 className="text-zinc-500 font-semibold text-xl mb-1">Weekly Summary,</h3>
                    <h1 className="text-4xl font-extrabold text-black leading-[1.1] tracking-tight">
                        Payroll &<br />Payouts
                    </h1>
                </div>

                {/* 2. Completed Jobs Selection */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Completed Jobs</h2>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{sortedCompleteJobs.length} To Approve</span>
                    </div>

                    <NanoGlassCard className="p-1 pb-4 bg-white border border-zinc-100 shadow-sm">
                        <div className="flex flex-col">
                            {isLoadingCompleteJobs ? (
                                <div className="p-4 space-y-3">
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                    <Skeleton className="h-12 w-full rounded-xl" />
                                </div>
                            ) : sortedCompleteJobs.length > 0 ? (
                                <>
                                    <div className="flex flex-col max-h-[300px] overflow-y-auto px-1">
                                        {sortedCompleteJobs.map((job) => (
                                            <div
                                                key={job.id}
                                                onClick={() => handleToggleSelection(job.id)}
                                                className={cn(
                                                    "flex items-center gap-4 p-4 rounded-2xl transition-all active:scale-[0.98]",
                                                    selectedJobIds.has(job.id) ? "bg-zinc-50" : "bg-transparent hover:bg-zinc-50/50"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                    selectedJobIds.has(job.id) ? "bg-emerald-500 border-emerald-500" : "border-zinc-200"
                                                )}>
                                                    {selectedJobIds.has(job.id) && <Check className="w-4 h-4 text-white" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-zinc-900 font-bold text-sm truncate">
                                                        {job.title || job.clientName.split(' ')[0]} #{job.quoteNumber || "000"}
                                                    </h4>
                                                    <p className="text-zinc-400 text-[10px] font-bold tracking-widest uppercase">
                                                        $ {calculateJobPayout(job, settings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="px-4 mt-4">
                                        <button
                                            onClick={handleMoveToOpenPayment}
                                            disabled={selectedJobIds.size === 0 || isMovingJobs}
                                            className={cn(
                                                "w-full h-12 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-md active:scale-[0.95]",
                                                selectedJobIds.size > 0
                                                    ? "bg-[#FF5A5F] text-white shadow-rose-100"
                                                    : "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                                            )}
                                        >
                                            {isMovingJobs ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                            <span>Move to Payroll ({selectedJobIds.size})</span>
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="py-10 text-center text-zinc-400">
                                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest px-4 leading-relaxed">
                                        No new completed jobs found
                                    </p>
                                </div>
                            )}
                        </div>
                    </NanoGlassCard>
                </div>

                {/* 3. Main Summary Card */}
                <NanoGlassCard className="p-6 mb-8 bg-white border border-zinc-100 shadow-sm">
                    <div className="flex flex-col gap-1 mb-6">
                        <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Ready for Payout</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-extrabold text-zinc-950 tracking-tighter">
                                $ {totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">
                                {sortedOpenJobs.length} PENDING IN REPORT
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || sortedOpenJobs.length === 0}
                        className={cn(
                            "w-full h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            isGenerating || sortedOpenJobs.length === 0
                                ? "bg-zinc-100 text-zinc-400 grayscale cursor-not-allowed"
                                : "bg-zinc-950 text-white font-bold"
                        )}
                    >
                        {isGenerating ? (
                            <LoaderCircle className="w-5 h-5 animate-spin" />
                        ) : (
                            <RefreshCw className="w-5 h-5" />
                        )}
                        <span>{isGenerating ? "Generating..." : "Generate Weekly Report"}</span>
                    </button>
                </NanoGlassCard>

                {/* 4. Ready for Payout List */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Ready for Payout</h2>
                        <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Included</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoadingOpenPayment ? (
                            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[24px]" />)
                        ) : sortedOpenJobs.length > 0 ? (
                            sortedOpenJobs.map((job) => (
                                <NanoGlassCard key={job.id} className="p-4" onClick={() => router.push(`/dashboard/mobile/jobs/${job.id}`)}>
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-zinc-900 font-bold text-sm truncate">
                                                {job.title || job.clientName.split(' ')[0]} #{job.quoteNumber || "000"}
                                            </h4>
                                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-tighter mt-1">
                                                {format(parseISO(job.deadline), "MMM dd")} • {job.address.split(',')[0]}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-zinc-950 font-extrabold text-sm tracking-tight">
                                                $ {calculateJobPayout(job, settings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 ml-2" />
                                    </div>
                                </NanoGlassCard>
                            ))
                        ) : (
                            <div className="py-6 text-center text-zinc-400 bg-white/30 rounded-[24px] border border-dashed border-zinc-200">
                                <p className="text-[10px] font-bold uppercase tracking-widest">Payroll is empty</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Past Reports History */}
                <div className="mb-8 pb-4">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Report History</h2>
                        <History className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoadingReports ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[24px]" />)
                        ) : pastReports && pastReports.length > 0 ? (
                            pastReports.map((report) => (
                                <NanoGlassCard
                                    key={report.id}
                                    className="p-4 flex items-center justify-between border-l-4 border-l-blue-500"
                                    onClick={() => router.push(`/dashboard/mobile/payroll/${report.id}`)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-zinc-900 font-bold text-sm">Week {report.weekNumber}, {report.year}</h4>
                                            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-tighter">
                                                {format(new Date(report.sentDate), "MMM dd, yyyy")} • {report.jobCount} Jobs
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <div className="text-zinc-950 font-bold text-sm">
                                                $ {report.totalPayout.toLocaleString()}
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <button className="p-1 hover:bg-zinc-100 rounded-full transition-colors">
                                                    <MoreVertical className="w-4 h-4 text-zinc-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-xl border-zinc-100 shadow-xl">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteReport(report.id);
                                                    }}
                                                    className="text-destructive font-medium focus:bg-red-50"
                                                >
                                                    Delete Report
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </NanoGlassCard>
                            ))
                        ) : (
                            <p className="text-center py-6 text-zinc-400 text-xs italic">No reports found.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* Bottom Nav */}
            <FloatingNav />
        </div>
    );
}
