
"use client";

import { useState, useEffect, useActionState, useMemo } from "react";
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
import type { Job, GeneralSettings, UserProfile, PayrollReport } from "@/app/lib/types";
import { ChevronDown, LoaderCircle, History, MoreHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDoc, useFirestore, useMemoFirebase, setDocumentNonBlocking, useCollection, useUser, addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, getDocs } from "firebase/firestore";
import { format, parseISO, getWeek, startOfWeek, endOfWeek, getYear } from "date-fns";
import { cn } from "@/lib/utils";
import React from "react";
import { generatePayrollReport, PayrollReportInput } from "@/ai/flows/generate-payroll-report-flow";
import { calculateJobPayout, calculateMaterialCost } from "@/app/lib/job-financials";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const JobDetailsRow = ({ job }: { job: Job }) => {
    const firestore = useFirestore();
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings } = useDoc<GeneralSettings>(settingsRef);
    const globalHourlyRate = settings?.hourlyRate ?? 0;

    const materialCost = calculateMaterialCost(job.invoices);
    
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
                        <p className="text-sm font-medium text-muted-foreground">Material Cost</p>
                        <p>${materialCost.toLocaleString()}</p>
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

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
    // The order by deadline requires a composite index, so we do it client-side.
    return query(collection(firestore, 'users', user.uid, 'jobs'), where('status', '==', 'Open Payment'));
  }, [firestore, user]);

  const { data: jobsToPay, isLoading: isLoadingJobs } = useCollection<Job>(jobsToPayQuery);
  
  const sortedJobsToPay = useMemo(() => {
    if (!jobsToPay) return [];
    return [...jobsToPay].sort((a, b) => parseISO(a.deadline).getTime() - parseISO(b.deadline).getTime());
  }, [jobsToPay]);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'payrollReports'), orderBy('sentDate', 'desc'), limit(10));
  }, [firestore, user]);

  const { data: pastReports, isLoading: isLoadingReports } = useCollection<PayrollReport>(reportsQuery);


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
  
  const handleGenerateAndSave = async () => {
    if (!sortedJobsToPay || sortedJobsToPay.length === 0 || !firestore || !user) {
      toast({
        variant: "destructive",
        title: "No Jobs for Payroll",
        description: "There are no jobs with 'Open Payment' status to include in the report.",
      });
      return;
    }
    
    setIsGenerating(true);

    try {
        const now = new Date();
        const currentWeek = getWeek(now);
        const currentYear = getYear(now);
        
        // Check for existing report for the current week and year
        const reportsCollectionRef = collection(firestore, 'users', user.uid, 'payrollReports');
        const existingReportQuery = query(reportsCollectionRef, 
            where('weekNumber', '==', currentWeek),
            where('year', '==', currentYear)
        );
        const existingReportSnap = await getDocs(existingReportQuery);

        if (!existingReportSnap.empty) {
            toast({
                variant: "destructive",
                title: "Report Already Exists",
                description: `A payroll report for week ${currentWeek} of ${currentYear} has already been saved.`,
            });
            setIsGenerating(false);
            return;
        }

        const start = startOfWeek(now);
        const end = endOfWeek(now);
        const totalPayout = sortedJobsToPay.reduce((acc, job) => acc + calculateJobPayout(job, settings), 0);

        const reportInput: PayrollReportInput = {
            jobs: sortedJobsToPay.map(job => {
                const payout = calculateJobPayout(job, settings);
                return {
                    ...job,
                    quoteNumber: job.quoteNumber || (job as any).workOrderNumber || 'N/A',
                    startDate: format(new Date(job.startDate), "MM/dd/yyyy"),
                    deadline: format(new Date(job.deadline), "MM/dd/yyyy"),
                    payout: parseFloat(payout.toFixed(2)),
                    notes: job.specialRequirements || "N/A",
                }
            }),
            currentDate: format(now, "MM/dd/yyyy"),
            weekNumber: currentWeek,
            startDate: format(start, "MM/dd/yyyy"),
            endDate: format(end, "MM/dd/yyyy"),
            businessName: userProfile?.businessName || "",
            businessLogoUrl: userProfile?.businessLogoUrl || "",
            totalPayout: parseFloat(totalPayout.toFixed(2)),
        };
        
        await generatePayrollReport(reportInput);
        
        const newReport: Omit<PayrollReport, 'id'> = {
            weekNumber: currentWeek,
            year: currentYear,
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            sentDate: now.toISOString(),
            recipientCount: 0,
            totalPayout,
            jobCount: sortedJobsToPay.length,
            jobIds: sortedJobsToPay.map(j => j.id),
        };
        await addDocumentNonBlocking(reportsCollectionRef, newReport);
        
        toast({
            title: "Report Generated & Saved",
            description: "The payroll report has been saved to your history.",
        });

    } catch (error) {
      console.error("Failed to generate or save report:", error);
      toast({
          variant: "destructive",
          title: "Process Failed",
          description: "Could not generate or save the payroll report.",
      });
    } finally {
        setIsGenerating(false);
    }
  };

  const handleDeleteReport = () => {
    if (!reportToDelete || !firestore || !user) return;
    const reportRef = doc(firestore, "users", user.uid, "payrollReports", reportToDelete);
    deleteDocumentNonBlocking(reportRef);
    toast({
        title: "Report Deleted",
        description: "The selected payroll report has been deleted.",
    });
    setReportToDelete(null);
  };


  return (
    <div>
      <PageHeader title="Payroll" />
      <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Jobs Ready for Payout</CardTitle>
              <CardDescription>
                These jobs have the status "Open Payment" and are ready to be processed for payroll.
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
                  ) : sortedJobsToPay && sortedJobsToPay.length > 0 ? sortedJobsToPay.map(job => {
                     const jobTitle = job.title || `${job.clientName.split(" ").pop() || "N/A"} #${job.quoteNumber}`;
                     const payout = calculateJobPayout(job, settings);

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
          
          <div className="flex justify-end">
             <Button onClick={handleGenerateAndSave} disabled={isGenerating || isLoading || !sortedJobsToPay || sortedJobsToPay.length === 0}>
                {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <History className="mr-2 h-4 w-4" />}
                {isGenerating ? 'Saving...' : 'Save Report to History'}
              </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Report History</CardTitle>
              <CardDescription>A log of your past generated payroll reports.</CardDescription>
            </CardHeader>
            <CardContent>
               <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Week</TableHead>
                    <TableHead>Date Saved</TableHead>
                    <TableHead>Jobs</TableHead>
                    <TableHead className="text-right">Total Payout</TableHead>
                    <TableHead className="w-[50px] text-right">Actions</TableHead>
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
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : pastReports && pastReports.length > 0 ? (
                    pastReports.map(report => (
                      <TableRow key={report.id} className="group">
                        <TableCell onClick={() => handleReportClick(report.id)} className="cursor-pointer">
                          <div className="font-medium">Week {report.weekNumber}, {report.year}</div>
                        </TableCell>
                        <TableCell onClick={() => handleReportClick(report.id)} className="cursor-pointer">{format(new Date(report.sentDate), "MMM dd, yyyy")}</TableCell>
                        <TableCell onClick={() => handleReportClick(report.id)} className="cursor-pointer">{report.jobCount}</TableCell>
                        <TableCell onClick={() => handleReportClick(report.id)} className="text-right cursor-pointer">${report.totalPayout.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem disabled>Edit</DropdownMenuItem>
                                <DropdownMenuItem 
                                    className="text-destructive"
                                    onSelect={() => setReportToDelete(report.id)}
                                >
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No reports have been saved yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      </div>

       <AlertDialog open={!!reportToDelete} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this payroll report.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteReport}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

    