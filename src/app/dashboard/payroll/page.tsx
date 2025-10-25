
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from 'react-dom';
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
import type { Job, GeneralSettings } from "@/app/lib/types";
import { Send, ChevronDown, LoaderCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection } from "@/firebase";
import { doc, collection, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";
import { generatePayrollReport } from "@/ai/flows/generate-payroll-report-flow";
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
                        <p>{materialUsagePercentage.toFixed(1)}%</p>
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

function SendReportButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
      {pending ? "Sending..." : "Send Report Now"}
    </Button>
  );
}

export default function PayrollPage() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<{ subject: string, body: string } | null>(null);

  const [sendEmailState, sendEmailAction] = useFormState(sendEmail, {
    error: null,
    success: false,
  });

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "global");
  }, [firestore]);

  const { data: settings, isLoading: isLoadingSettings } = useDoc<GeneralSettings>(settingsRef);
  
  const jobsToPayQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'jobs'), where('status', '==', 'Open Payment'));
  }, [firestore]);

  const { data: jobsToPay, isLoading: isLoadingJobs } = useCollection<Job>(jobsToPayQuery);

  const [recipients, setRecipients] = useState<string[]>([]);

  useEffect(() => {
    if (settings?.reportRecipients) {
      setRecipients(settings.reportRecipients);
    }
  }, [settings]);
  
  useEffect(() => {
    if(sendEmailState.success) {
      toast({
        title: "Report Sent!",
        description: "The payroll report has been successfully sent.",
      });
      setGeneratedReport(null);
    }
    if (sendEmailState.error) {
       toast({
        variant: "destructive",
        title: "Sending Failed",
        description: `Could not send the payroll report: ${sendEmailState.error}`,
      });
    }
  }, [sendEmailState, toast])


  const isLoading = isLoadingJobs || isLoadingSettings;

  const handleJobClick = (jobId: string) => {
    router.push(`/dashboard/jobs/${jobId}`);
  };
  
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

    const handleGenerateReport = async () => {
    if (!jobsToPay || jobsToPay.length === 0) {
      toast({
        variant: "destructive",
        title: "No Jobs for Payroll",
        description: "There are no jobs with 'Open Payment' status to include in the report.",
      });
      return;
    }
    setIsGenerating(true);
    try {
      const report = await generatePayrollReport({
        jobs: jobsToPay,
        currentDate: format(new Date(), "MMMM dd, yyyy"),
        globalHourlyRate: settings?.hourlyRate ?? 0,
      });
      setGeneratedReport(report);
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate the payroll report.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div>
      <PageHeader title="Payroll" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                    <TableHead className="w-[100px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
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
                     const jobTitle = `${clientLastName} #${job.workOrderNumber}`;
                     const totalInvoiced = job.invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
                     const payout = job.initialValue - totalInvoiced;
                    return (
                        <React.Fragment key={job.id}>
                           <TableRow>
                            <TableCell 
                                onClick={() => handleJobClick(job.id)}
                                className="cursor-pointer hover:underline"
                            >
                              <div className="font-medium">{jobTitle}</div>
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
               <Button variant="outline" onClick={handleSaveRecipients}>Save Recipients</Button>
                <form action={sendEmailAction}>
                  {recipients.filter(r => r).map(r => <input key={r} type="hidden" name="to" value={r} />)}
                  <input type="hidden" name="subject" value={generatedReport?.subject} />
                  <input type="hidden" name="html" value={generatedReport?.body} />

                  <Button onClick={handleGenerateReport} type="button" className="w-full mb-2" disabled={isGenerating}>
                      {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                      {isGenerating ? "Generating..." : "Generate Report"}
                  </Button>
                  <SendReportButton disabled={!generatedReport || recipients.length === 0} />
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
