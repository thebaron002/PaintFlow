"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
    ArrowLeft,
    Calendar,
    Briefcase,
    DollarSign,
    Mail,
    Share2,
    LoaderCircle,
    Copy,
    ChevronRight,
    Wallet,
    AlertCircle,
    Check,
    RefreshCw
} from "lucide-react";

// Types
import type { Job, PayrollReport, UserProfile, GeneralSettings } from "@/app/lib/types";

// Firebase
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Shared Logic
import { calculateJobPayout } from "@/app/lib/job-financials";
import { generatePayrollReport, PayrollReportInput } from "@/ai/flows/generate-payroll-report-flow";
import { FloatingNav } from "../../components/floating-nav";

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

export default function MobileReportDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const reportId = params.reportId as string;

    const [isGeneratingEmail, setIsGeneratingEmail] = React.useState(true);
    const [generatedEmail, setGeneratedEmail] = React.useState<{ subject: string; body: string } | null>(null);

    // -- Data Fetching --
    const reportRef = useMemoFirebase(() => {
        if (!firestore || !user || !reportId) return null;
        return doc(firestore, "users", user.uid, "payrollReports", reportId);
    }, [firestore, user, reportId]);
    const { data: report, isLoading: isLoadingReport } = useDoc<PayrollReport>(reportRef);

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !report?.jobIds?.length) return null;
        return query(collection(firestore, "users", user.uid, "jobs"), where("__name__", "in", report.jobIds));
    }, [firestore, user, report?.jobIds]);
    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);

    const [isSending, setIsSending] = React.useState(false);
    const [recipientEmail, setRecipientEmail] = React.useState("");
    const [sendCopyToCarra, setSendCopyToCarra] = React.useState(true);

    // Update recipientEmail when user data is available
    React.useEffect(() => {
        if (user?.email && !recipientEmail) {
            setRecipientEmail(user.email);
        }
    }, [user, recipientEmail]);

    // -- AI Email Generation --
    React.useEffect(() => {
        const regenerateEmail = async () => {
            if (report && jobs && userProfile && settings) {
                setIsGeneratingEmail(true);
                try {
                    const sortedJobs = [...jobs].sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());

                    const reportInput: PayrollReportInput = {
                        jobs: sortedJobs.map(job => {
                            const payout = calculateJobPayout(job, settings);
                            const jobTitle = job.title || `${job.clientName.split(" ").pop() || "N/A"} #${job.quoteNumber}`;

                            return {
                                ...job,
                                title: jobTitle,
                                quoteNumber: job.quoteNumber || (job as any).workOrderNumber || 'N/A',
                                startDate: format(new Date(job.startDate), "MM/dd/yyyy"),
                                deadline: format(new Date(job.deadline), "MM/dd/yyyy"),
                                payout: parseFloat(payout.toFixed(2)),
                                notes: job.specialRequirements || "N/A",
                            }
                        }),
                        currentDate: format(new Date(report.sentDate), "MM/dd/yyyy"),
                        weekNumber: report.weekNumber,
                        startDate: format(new Date(report.startDate), "MM/dd/yyyy"),
                        endDate: format(new Date(report.endDate), "MM/dd/yyyy"),
                        businessName: userProfile.businessName || "",
                        businessLogoUrl: userProfile.businessLogoUrl || "",
                        totalPayout: report.totalPayout,
                    };

                    const emailContent = await generatePayrollReport(reportInput);
                    setGeneratedEmail(emailContent);
                } catch (error) {
                    console.error("Failed to generate report preview:", error);
                } finally {
                    setIsGeneratingEmail(false);
                }
            }
        };

        regenerateEmail();
    }, [report, jobs, userProfile, settings]);

    const handleSendEmail = async () => {
        if (!generatedEmail || !report || !user?.email || !recipientEmail) {
            toast({ variant: "destructive", title: "Cannot Send", description: "Missing email content, user data or recipient email." });
            return;
        }

        setIsSending(true);
        try {
            const response = await fetch('/api/send-payroll-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractorEmail: recipientEmail,
                    userEmail: user.email,
                    weekNumber: report.weekNumber,
                    year: report.year,
                    startDate: format(new Date(report.startDate), "MM/dd/yyyy"),
                    endDate: format(new Date(report.endDate), "MM/dd/yyyy"),
                    totalPayout: report.totalPayout,
                    jobCount: report.jobCount,
                    customName: userProfile?.name || "PaintFlow",
                    businessName: userProfile?.businessName || "PaintFlow",
                    customSubject: generatedEmail.subject,
                    customHtml: generatedEmail.body,
                    additionalCc: sendCopyToCarra ? "carra.stinnett@fivestarpainting.com" : null
                }),
            });

            if (response.ok) {
                toast({ title: "Email Sent! 📧", description: `Report sent to ${user.email}` });
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.details || "Failed to send");
            }
        } catch (error: any) {
            console.error(error);
            toast({ variant: "destructive", title: "Error", description: error.message || "Could not send email." });
        } finally {
            setIsSending(false);
        }
    };

    const handleCopy = () => {
        if (generatedEmail) {
            navigator.clipboard.writeText(`${generatedEmail.subject}\n\n${generatedEmail.body.replace(/<[^>]*>?/gm, '')}`);
            toast({ title: "Copied to Clipboard", description: "Email content copied without HTML tags." });
        }
    };

    const isLoading = isLoadingReport || isLoadingJobs || isGeneratingEmail;

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden">
            <div className="px-5 pt-16 max-w-md mx-auto">

                {/* 1. Header with Back Button */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm active:scale-95 transition-transform"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-900" />
                        </button>

                        <button
                            onClick={handleSendEmail}
                            disabled={isSending || !generatedEmail}
                            className={cn(
                                "h-10 px-4 rounded-full flex items-center gap-2 shadow-sm transition-all active:scale-95",
                                isSending || !generatedEmail ? "bg-zinc-100 text-zinc-400" : "bg-zinc-950 text-white"
                            )}
                        >
                            {isSending ? (
                                <LoaderCircle className="w-4 h-4 animate-spin" />
                            ) : (
                                <Mail className="w-4 h-4" />
                            )}
                            <span className="text-xs font-bold uppercase tracking-widest">{isSending ? "Sending..." : "Send to Me"}</span>
                        </button>
                    </div>
                    <h3 className="text-zinc-500 font-semibold text-xl mb-1">Report Details,</h3>
                    <h1 className="text-4xl font-extrabold text-black leading-[1.1] tracking-tight">
                        Week {report?.weekNumber || '--'}<br />{report?.year || '--'}
                    </h1>
                </div>

                {/* 2. Summary Card */}
                {isLoadingReport ? (
                    <Skeleton className="h-40 w-full rounded-[24px] mb-8" />
                ) : (
                    <NanoGlassCard className="p-6 mb-8 bg-white border border-zinc-100 shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Total Payout</span>
                                <span className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                                    $ {report?.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Jobs Included</span>
                                <span className="text-2xl font-extrabold text-zinc-950 tracking-tight">
                                    {report?.jobCount}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-50 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-zinc-600 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Period: {report ? `${format(new Date(report.startDate), "MMM dd")} - ${format(new Date(report.endDate), "MMM dd")}` : '--'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-600 text-sm">
                                <Mail className="w-4 h-4" />
                                <span className="font-medium">Generated: {report ? format(new Date(report.sentDate), "MMM dd, p") : '--'}</span>
                            </div>
                        </div>
                    </NanoGlassCard>
                )}

                {/* 2.5 Recipient Input */}
                <div className="mb-4">
                    <h2 className="text-lg font-extrabold text-zinc-900 mb-4 px-1">Recipient</h2>
                    <NanoGlassCard className="p-4 bg-white border border-zinc-100 shadow-sm">
                        <div className="flex flex-col gap-1">
                            <label className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-1">Send to</label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="Enter recipient email"
                                className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-zinc-950 p-1 placeholder:text-zinc-300"
                            />
                        </div>
                    </NanoGlassCard>
                </div>

                {/* 2.6 Additional CC */}
                <div className="mb-8">
                    <NanoGlassCard
                        className={cn(
                            "p-4 border transition-all",
                            sendCopyToCarra ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-zinc-100 shadow-sm"
                        )}
                        onClick={() => setSendCopyToCarra(!sendCopyToCarra)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                    sendCopyToCarra ? "bg-emerald-500 border-emerald-500" : "border-zinc-200"
                                )}>
                                    {sendCopyToCarra && <Check className="w-4 h-4 text-white" />}
                                </div>
                                <div>
                                    <h4 className="text-zinc-900 font-bold text-xs">Copy Carra Stinnett</h4>
                                    <p className="text-zinc-400 text-[10px] font-medium tracking-tight">carra.stinnett@fivestarpainting.com</p>
                                </div>
                            </div>
                        </div>
                    </NanoGlassCard>
                </div>

                {/* 3. AI Email Preview */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Email Preview</h2>
                        <button
                            onClick={handleCopy}
                            className="p-2 bg-white rounded-full shadow-sm active:scale-95 transition-transform"
                            disabled={!generatedEmail}
                        >
                            <Copy className="w-4 h-4 text-zinc-600" />
                        </button>
                    </div>

                    <NanoGlassCard className="p-5 bg-white border border-zinc-100 shadow-sm min-h-[200px]">
                        {isLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-full" />
                            </div>
                        ) : generatedEmail ? (
                            <div className="text-[13px] leading-relaxed text-zinc-800 font-medium">
                                <div className="mb-4 pb-4 border-b border-zinc-50">
                                    <span className="text-zinc-400 font-bold uppercase text-[10px] block mb-1 tracking-widest">Subject</span>
                                    <p className="font-bold">{generatedEmail.subject}</p>
                                </div>
                                <div
                                    className="prose prose-sm max-w-none text-zinc-800"
                                    dangerouslySetInnerHTML={{ __html: generatedEmail.body }}
                                />
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
                                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-xs uppercase font-bold tracking-widest">Preview unavailable</p>
                            </div>
                        )}
                    </NanoGlassCard>
                </div>

                {/* 4. Included Jobs List */}
                <div className="mb-8">
                    <h2 className="text-lg font-extrabold text-zinc-900 mb-4 px-1">Jobs in Report</h2>
                    <div className="flex flex-col gap-3">
                        {isLoadingJobs ? (
                            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[24px]" />)
                        ) : jobs && jobs.length > 0 ? (
                            jobs.map(job => (
                                <NanoGlassCard
                                    key={job.id}
                                    className="p-4"
                                    onClick={() => router.push(`/dashboard/mobile/jobs/${job.id}`)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex-1 min-w-0 pr-4">
                                            <h4 className="text-zinc-900 font-bold text-sm truncate">
                                                {job.title || job.clientName.split(' ')[0]} #{job.quoteNumber || "000"}
                                            </h4>
                                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-tighter mt-1 truncate">
                                                {job.address}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="text-zinc-950 font-extrabold text-sm tracking-tight">
                                                $ {calculateJobPayout(job, settings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-300 ml-2" />
                                    </div>
                                </NanoGlassCard>
                            ))
                        ) : (
                            <p className="text-center py-6 text-zinc-400 text-xs italic">No jobs found in this record.</p>
                        )}
                    </div>
                </div>

            </div>

            <FloatingNav />
        </div>
    );
}
