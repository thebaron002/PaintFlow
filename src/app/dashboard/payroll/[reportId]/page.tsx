
"use client";

import { useState, useEffect, useActionState } from "react";
import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import type { Job, PayrollReport, UserProfile, GeneralSettings } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { generatePayrollReport, PayrollReportInput } from "@/ai/flows/generate-payroll-report-flow";
import { format } from "date-fns";
import { sendEmail } from "@/app/actions/send-email";
import { useToast } from "@/hooks/use-toast";
import { calculateJobPayout, calculateMaterialCost } from "@/app/lib/job-financials";

export default function ReportDetailsPage() {
    const params = useParams();
    const reportId = params.reportId as string;
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(true);
    const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null);

    const [sendEmailState, sendEmailAction, isResending] = useActionState(sendEmail, {
        error: null,
        success: false,
    });

    const reportRef = useMemoFirebase(() => {
        if (!firestore || !user || !reportId) return null;
        return doc(firestore, "users", user.uid, "payrollReports", reportId);
    }, [firestore, user, reportId]);

    const { data: report, isLoading: isLoadingReport } = useDoc<PayrollReport>(reportRef);

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user || !report?.jobIds || report.jobIds.length === 0) return null;
        return query(collection(firestore, 'users', user.uid, 'jobs'), where('__name__', 'in', report.jobIds));
    }, [firestore, user, report?.jobIds]);

    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
    
    const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, "users", user.uid);
    }, [firestore, user]);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);


    useEffect(() => {
        const regenerateEmail = async () => {
            if (report && jobs && userProfile && settings) {
                setIsGenerating(true);
                try {
                    const reportInput: PayrollReportInput = {
                        jobs: jobs.map(job => {
                            const materialCost = calculateMaterialCost(job.invoices);
                            const materialUsage = job.initialValue > 0 ? (materialCost / job.initialValue) * 100 : 0;
                            const payout = calculateJobPayout(job, settings);

                            return {
                                ...job,
                                quoteNumber: job.quoteNumber || (job as any).workOrderNumber || 'N/A',
                                startDate: format(new Date(job.startDate), "MM/dd/yyyy"),
                                deadline: format(new Date(job.deadline), "MM/dd/yyyy"),
                                payout: parseFloat(payout.toFixed(2)),
                                materialUsage: parseFloat(materialUsage.toFixed(2)),
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
                    console.error("Failed to re-generate report email:", error);
                } finally {
                    setIsGenerating(false);
                }
            }
        };

        regenerateEmail();
    }, [report, jobs, userProfile, settings]);

    useEffect(() => {
        if (sendEmailState.success && !isResending) {
            toast({
                title: "Report Resent!",
                description: "The payroll report has been successfully resent.",
            });
        }
        if (sendEmailState.error && !isResending) {
            toast({
                variant: "destructive",
                title: "Resend Failed",
                description: `Could not resend the report: ${sendEmailState.error}`,
            });
        }
    }, [sendEmailState, isResending, toast]);


    const handleResend = () => {
        if (!generatedEmail || !settings?.reportRecipients || settings.reportRecipients.length === 0) {
            toast({
                variant: "destructive",
                title: "Cannot Resend",
                description: "Email content is not available or no recipients are configured in settings.",
            });
            return;
        }

        const formData = new FormData();
        settings.reportRecipients!.filter(r => r).forEach(r => formData.append('to', r));
        formData.append('subject', generatedEmail.subject);
        formData.append('html', generatedEmail.body);
        sendEmailAction(formData);
    };

    const isLoading = isLoadingReport || isLoadingJobs || isLoadingProfile || isGenerating;
    const pageTitle = report ? `Report: Week ${report.weekNumber}, ${report.year}` : "Report Details";

    return (
        <div>
            <PageHeader title={pageTitle}>
                <div className="flex items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard/payroll">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Payroll
                        </Link>
                    </Button>
                    <form action={handleResend}>
                        <Button type="submit" disabled={isResending || isLoading}>
                            {isResending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {isResending ? 'Resending...' : 'Resend Report'}
                        </Button>
                    </form>
                </div>
            </PageHeader>

            <Card>
                <CardHeader>
                    <CardTitle>Sent Email Preview</CardTitle>
                    <CardDescription>
                        This is a copy of the email that was sent on {report ? format(new Date(report.sentDate), 'PPP p') : '...'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </div>
                    ) : generatedEmail ? (
                        <div className="space-y-4">
                             <div>
                                <h3 className="font-semibold">Subject:</h3>
                                <p>{generatedEmail.subject}</p>
                             </div>
                             <div className="border rounded-lg p-4 bg-muted/20">
                                <div dangerouslySetInnerHTML={{ __html: generatedEmail.body }} />
                             </div>
                        </div>
                    ) : (
                        <p>Could not generate email preview.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
