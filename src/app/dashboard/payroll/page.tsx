
"use client";

import { useState, useEffect, useTransition, useActionState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Job, GeneralSettings, UserProfile, PayrollReport } from "@/app/lib/types";
import { Send, ChevronDown, LoaderCircle, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, useUser, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore";
import { format, getWeek, startOfWeek, endOfWeek, getYear } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";
import { generatePayrollReport, PayrollReportInput } from "@/ai/flows/generate-payroll-report-flow";
import { sendEmail } from "@/app/actions/send-email";


const JobDetailsRow = ({ job }: { job: Job }) => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);
    const globalHourlyRate = settings?.hourlyRate ?? 0;

    const materialCost = job.invoices
        ?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
    const materialUsagePercentage = job.initialValue > 0 ? (materialCost / job.initialValue) * 100 : 0;
    
    const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
        if (adj.type === 'Time') {
            const rate = adj.hourlyRate ?? globalHourlyRate;
            return sum + (adj.value * rate);
        }
        return sum + adj.value;
    }, 0) ?? 0;

    const totalInvoiced = job.invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;


    return (
         <TableRow className="bg-muted hover:bg-muted">
            <TableCell colSpan={5} className="p-0">
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                        <p>{format(new Date(job.startDate), "MMM dd, yyyy")}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Material Usage</p>
                        <p>{materialUsagePercentage.toFixed(2)}%</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Invoiced</p>
                        <p>${totalInvoiced.toLocaleString()}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Adjustments</p>
                        <p>${totalAdjustments.toLocaleString()}</p>
                    </div>
                   
                    <div className="space-y-1 lg:col-span-4">
                        <p className="text-sm font-medium text-muted-foreground">Notes</p>
                        <p className="text-sm">{job.specialRequirements || "No notes for this job."}</p>
                    </div>
                </div>
            </TableCell>
        </TableRow>
    )
}

export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [sendEmailState, sendEmailAction] = useActionState(sendEmail, {
    error: null,
    success: false,
  });

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "global");
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<GeneralSettings>(settingsRef);
  
  const userProfileRef = useMemoFirebase(() => {
      if (!firestore || !user) return null;
      return doc(firestore, "users", user.uid);
  }, [firestore, user]);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

  const jobsToPayQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'jobs'), where('status', '==', 'Open Payment'));
  }, [firestore, user]);

  const { data: jobsToPay, isLoading: isLoadingJobs } = useCollection<Job>(jobsToPayQuery);
  
  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'payrollReports'), orderBy('sentDate', 'desc'), limit(10));
  }, [firestore, user]);

  const { data: pastReports, isLoading: isLoadingReports } = useCollection<PayrollReport>(reportsQuery);

  const [recipients, setRecipients] = useState<string[]>([]);

  useEffect(() => {
    if (settings?.reportRecipients) {
      setRecipients(settings.reportRecipients);
    }
  }, [settings]);
  
  useEffect(() => {
    if (sendEmailState.success) {
      toast({
        title: "Report Sent!",
        description: "The payroll report has been successfully sent.",
      });

      // Save report to history
      if (jobsToPay && jobsToPay.length > 0 && user) {
        const now = new Date();
        const start = startOfWeek(now);
        const end = endOfWeek(now);
        const totalPayout = jobsToPay.reduce((acc, job) => {
            const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
                if (adj.type === 'Time') {
                    const rate = adj.hourlyRate ?? settings?.hourlyRate ?? 0;
                    return sum + (adj.value * rate);
                }
                return sum + adj.value;
            }, 0) ?? 0;
            const totalInvoiced = (job.invoices || []).reduce((sum, invoice) => sum + invoice.amount, 0);
            return acc + (job.initialValue - totalInvoiced + totalAdjustments);
        }, 0);

        const newReport: Omit<PayrollReport, 'id'> = {
            weekNumber: getWeek(now),
            year: getYear(now),
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            sentDate: now.toISOString(),
            recipientCount: recipients.filter(r => r).length,
            totalPayout,
            jobCount: jobsToPay.length,
            jobIds: jobsToPay.map(j => j.id),
        };
        addDocumentNonBlocking(collection(firestore!, 'users', user.uid, 'payrollReports'), newReport);
      }
    }
    if (sendEmailState.error) {
       toast({
        variant: "destructive",
        title: "Sending Failed",
        description: `Could not send the payroll report: ${sendEmailState.error}`,
      });
    }
  }, [sendEmailState, toast, jobsToPay, firestore, recipients, settings?.hourlyRate, user]);


  const isLoading = isLoadingJobs || isLoadingSettings || isLoadingProfile || isLoadingReports;

  const handleJobClick = (jobId: string) => {
    router.push(`/dashboard/jobs/${jobId}`);
  };

  const handleReportClick = (reportId: string) => {
    router.push(`/dashboard/payroll/${reportId}`);
  }
  
  const toggleRow = (jobId: string) => {
    setExpandedJobId(prevId => (prevId === jobId ? null : jobId));
  }

  const handleRecipientChange = (index: number, value: string) => {
    const newRecipients = [...recipients];
    newRecipients[index] = value;
    setRecipients(newRecipients);
  };

  const handleSaveRecipients = () => {
    if (!firestore) return;
    const settingsRef = doc(firestore, 'settings', 'global');
    setDocumentNonBlocking(settingsRef, { reportRecipients: recipients }, { merge: true });
    toast({
      title: "Recipients Saved",
      description: "The weekly report recipients have been updated.",
    });
  };

  const handleGenerateAndSend = () => {
    if (!jobsToPay || jobsToPay.length === 0) {
      toast({
        variant: "destructive",
        title: "No Jobs for Payroll",
        description: "There are no jobs with 'Open Payment' status to include in the report.",
      });
      return;
    }
     if (recipients.filter(r => r).length === 0) {
      toast({
        variant: "destructive",
        title: "No Recipients",
        description: "Please add at least one recipient to send the report.",
      });
      return;
    }

    startTransition(async () => {
        try {
            const now = new Date();
            const start = startOfWeek(now);
            const end = endOfWeek(now);

            const totalPayout = jobsToPay.reduce((acc, job) => {
                const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
                    if (adj.type === 'Time') {
                        const rate = adj.hourlyRate ?? settings?.hourlyRate ?? 0;
                        return sum + (adj.value * rate);
                    }
                    return sum + adj.value;
                }, 0) ?? 0;
                const totalInvoiced = job.invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
                return acc + ((job.initialValue ?? 0) - totalInvoiced + totalAdjustments);
            }, 0);


        const reportInput: PayrollReportInput = {
            jobs: jobsToPay.map(job => {
                const materialCost = job.invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
                const materialUsage = job.initialValue > 0 ? (materialCost / job.initialValue) * 100 : 0;
                const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
                    if (adj.type === 'Time') {
                        const rate = adj.hourlyRate ?? settings?.hourlyRate ?? 0;
                        return sum + (adj.value * rate);
                    }
                    return sum + adj.value;
                }, 0) ?? 0;
                const totalInvoiced = job.invoices?.reduce((sum, inv) => sum + inv.amount, 0) ?? 0;
                const payout = (job.initialValue ?? 0) - totalInvoiced + totalAdjustments;

                return {
                    ...job,
                    startDate: format(new Date(job.startDate), "MM/dd/yyyy"),
                    deadline: format(new Date(job.deadline), "MM/dd/yyyy"),
                    payout: parseFloat(payout.toFixed(2)),
                    materialUsage: parseFloat(materialUsage.toFixed(2)),
                    notes: job.specialRequirements || "N/A",
                }
            }),
            currentDate: format(now, "MM/dd/yyyy"),
            weekNumber: getWeek(now),
            startDate: format(start, "MM/dd/yyyy"),
            endDate: format(end, "MM/dd/yyyy"),
            businessName: userProfile?.businessName || "",
            businessLogoUrl: userProfile?.businessLogoUrl || "",
            totalPayout: parseFloat(totalPayout.toFixed(2)),
        };
        
        const report = await generatePayrollReport(reportInput);
        
        const formData = new FormData();
        recipients.filter(r => r).forEach(r => formData.append('to', r));
        formData.append('subject', report.subject);
        formData.append('html', report.body);

        sendEmailAction(formData);

        } catch (error) {
        console.error("Failed to generate or send report:", error);
        toast({
            variant: "destructive",
            title: "Process Failed",
            description: "Could not generate or send the payroll report.",
        });
        }
    });
  };


  return (
    <div>
      <PageHeader title="Payroll" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
           <Card>
            <CardHeader>
              <CardTitle>Jobs Ready for Payout</CardTitle>
              <CardDescription>
                These jobs have the status "Open Payment" and are ready to be processed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Completion Date</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                    <TableHead className="w-[100px] text-center">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingJobs ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-5 w-32 mb-1" />
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                         <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : jobsToPay && jobsToPay.length > 0 ? jobsToPay.map(job => {
                     const clientLastName = job.clientName.split(" ").pop() || "N/A";
                     const jobTitle = `${clientLastName} #${job.quoteNumber}`;
                     const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
                        if (adj.type === 'Time') {
                            const rate = adj.hourlyRate ?? settings?.hourlyRate ?? 0;
                            return sum + (adj.value * rate);
                        }
                        return sum + adj.value;
                    }, 0) ?? 0;
                     const totalInvoiced = (job.invoices || []).reduce((sum, invoice) => sum + invoice.amount, 0);
                     const payout = job.initialValue - totalInvoiced + totalAdjustments;
                    return (
                        <React.Fragment key={job.id}>
                           <TableRow>
                            <TableCell>
                              <div 
                                className="font-medium cursor-pointer hover:underline"
                                onClick={() => handleJobClick(job.id)}
                              >
                                {jobTitle}
                              </div>
                              <div className="text-sm text-muted-foreground">{job.address}</div>
                            </TableCell>
                            <TableCell>{format(new Date(job.deadline), "MMM dd, yyyy")}</TableCell>
                            <TableCell className="text-right">${payout.toLocaleString()}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="sm" onClick={() => toggleRow(job.id)}>
                                    <span className="sr-only">Toggle Details</span>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform", expandedJobId === job.id && "rotate-180")} />
                                </Button>
                            </TableCell>
                          </TableRow>
                          {expandedJobId === job.id && <JobDetailsRow job={job} />}
                       </React.Fragment>
                    )
                  }) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">
                        No jobs are currently awaiting payment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>A log of your past sent payroll reports.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead className="text-right">Total Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingReports ? (
                     [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pastReports && pastReports.length > 0 ? (
                    pastReports.map(report => (
                      <TableRow key={report.id} onClick={() => handleReportClick(report.id)} className="cursor-pointer">
                        <TableCell>
                          <div className="font-medium">Week {report.weekNumber}, {report.year}</div>
                        </TableCell>
                        <TableCell>{format(new Date(report.sentDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{report.jobCount}</TableCell>
                        <TableCell className="text-right">${report.totalPayout.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No reports have been sent yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Report</CardTitle>
              <CardDescription>
                Manage the recipients for the weekly payroll summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
               {isLoadingSettings ? <Skeleton className="h-24 w-full" /> : (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="email1">Primary Recipient</Label>
                    <Input 
                      id="email1" 
                      type="email" 
                      value={recipients[0] || ""}
                      onChange={(e) => handleRecipientChange(0, e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email2">Secondary Recipient</Label>
                    <Input 
                      id="email2" 
                      type="email" 
                      value={recipients[1] || ""}
                      onChange={(e) => handleRecipientChange(1, e.target.value)}
                    />
                  </div>
                </>
               )}
               <Button variant="outline" onClick={handleSaveRecipients} disabled={isLoadingSettings}>Save Recipients</Button>
               <Button onClick={handleGenerateAndSend} disabled={isPending || isLoading}>
                    {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isPending ? 'Sending...' : 'Send Report Now'}
                </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
