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
import { collection, query, orderBy, limit, where, doc, getDocs } from "firebase/firestore";

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

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, "users", user.uid, "jobs"),
            where("status", "==", "Open Payment")
        );
    }, [firestore, user]);
    const { data: jobsToPay, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

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
    const sortedJobs = React.useMemo(() => {
        if (!jobsToPay) return [];
        return [...jobsToPay].sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());
    }, [jobsToPay]);

    const totalPayout = React.useMemo(() => {
        if (!sortedJobs || !settings) return 0;
        return sortedJobs.reduce((acc, job) => acc + calculateJobPayout(job, settings), 0);
    }, [sortedJobs, settings]);

    // -- Handlers --
    const handleGenerateReport = async () => {
        if (!sortedJobs.length || !firestore || !user) {
            toast({
                variant: "destructive",
                title: "No Jobs Ready",
                description: "Complete jobs and set to 'Open Payment' first.",
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
                jobCount: sortedJobs.length,
                jobIds: sortedJobs.map(j => j.id),
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

                {/* 2. Main Summary Card */}
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
                                {sortedJobs.length} PENDING JOBS
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={isGenerating || sortedJobs.length === 0}
                        className={cn(
                            "w-full h-14 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            isGenerating || sortedJobs.length === 0
                                ? "bg-zinc-100 text-zinc-400 grayscale cursor-not-allowed"
                                : "bg-[#FF5A5F] text-white shadow-lg shadow-rose-100 font-bold"
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

                {/* 3. Pending Jobs List */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Awaiting Payout</h2>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{sortedJobs.length} Total</span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoadingJobs ? (
                            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)
                        ) : sortedJobs.length > 0 ? (
                            sortedJobs.map((job) => (
                                <NanoGlassCard key={job.id} className="p-4" onClick={() => router.push(`/dashboard/mobile/jobs/${job.id}`)}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-zinc-900 font-bold text-base truncate">
                                                {job.title || job.clientName.split(' ')[0]} #{job.quoteNumber || "000"}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1 text-zinc-500 text-xs">
                                                <Calendar className="w-3 h-3" />
                                                <span>Comp. {job.deadline ? format(new Date(job.deadline), "MMM dd") : "TBD"}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-zinc-950 font-extrabold text-lg tracking-tight">
                                                $ {calculateJobPayout(job, settings).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                    </div>
                                </NanoGlassCard>
                            ))
                        ) : (
                            <div className="py-8 text-center text-zinc-400 bg-white/50 rounded-[24px] border border-dashed border-zinc-200">
                                <Plus className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-medium uppercase tracking-widest">No jobs ready for payment</p>
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
