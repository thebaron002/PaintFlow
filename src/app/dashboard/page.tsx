

"use client";

import * as React from "react";
import Link from "next/link";
import { format, startOfToday, addDays, isWithinInterval, parseISO, isSameDay, formatDistanceToNow, isFuture, isPast } from "date-fns";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Receipt, ArrowRight, MapPin, CalendarDays, CalendarCheck } from "lucide-react";
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore";
import type { Job as JobType, GeneralSettings } from "@/app/lib/types";
import { useToast } from "@/hooks/use-toast";
import { JobSelectionModal } from "./components/job-selection-modal";
import { AddInvoiceForm } from "./jobs/[id]/components/add-invoice-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RevenueChart } from "./components/revenue-chart";
import { cn } from "@/lib/utils";
import { calculateJobPayout, calculateMaterialCost } from "@/app/lib/job-financials";

// Types (ajuste se necessário)
type Invoice = { amount: number; date?: string; isPayoutDiscount?: boolean; source?: string };
type Adjustment = { type: "Time" | "Material" | "General"; value: number; hourlyRate?: number };
type Job = JobType;

// ---------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------
function GlassSection({ className = "", children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={
        "rounded-2xl border border-white/50 bg-white/70 shadow-xl backdrop-blur-md " +
        "dark:bg-zinc-900/60 dark:border-white/10 " + className
      }
    >
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div>{right}</div> : null}
    </div>
  );
}

function Metric({
  label,
  value,
  help,
}: {
  label: string;
  value: string;
  help?: string;
}) {
  return (
    <div className="flex min-w-[140px] flex-col rounded-xl border border-zinc-200/60 bg-white/60 p-4 text-zinc-900 shadow-sm backdrop-blur sm:min-w-[160px] dark:bg-zinc-900/50 dark:text-zinc-50 dark:border-white/10">
      <span className="text-xs uppercase tracking-wide text-zinc-500">{label}</span>
      <span className="mt-1 text-2xl font-bold">{value}</span>
      {help ? <span className="mt-1 text-xs text-zinc-500">{help}</span> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Data helpers
// ---------------------------------------------------------------------

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------
// Quick Actions (os 3 botões grandes)
// ---------------------------------------------------------------------
function QuickActions({ inProgressJobs }: { inProgressJobs: Job[] }) {
    const { toast } = useToast();
    const [isJobSelectionOpen, setJobSelectionOpen] = React.useState(false);
    const [isSingleJobInvoiceOpen, setSingleJobInvoiceOpen] = React.useState(false);
    
    // This is needed to get all possible invoice origins for the combobox inside AddInvoiceForm
    const { user } = useUser();
    const firestore = useFirestore();
    const allJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'jobs');
    }, [firestore, user]);
    const { data: allJobs } = useCollection<Job>(allJobsQuery);
    const invoiceOrigins = [...new Set(allJobs?.flatMap(j => j.invoices?.map(i => i.origin)).filter(Boolean) ?? [])];


    const handleAddInvoiceClick = () => {
        if (!inProgressJobs || inProgressJobs.length === 0) {
            toast({
                variant: "destructive",
                title: "No Active Jobs",
                description: "You must have at least one job 'In Progress' to add an invoice.",
            });
            return;
        }

        if (inProgressJobs.length > 1) {
            setJobSelectionOpen(true);
        } else {
            setSingleJobInvoiceOpen(true);
        }
    };

    const handleInvoiceFormSuccess = () => {
        toast({
          title: "Invoice Added!",
          description: "The new invoice has been added successfully.",
        });
        setSingleJobInvoiceOpen(false);
    }

    const singleJob = inProgressJobs?.[0];

    return (
    <>
        <GlassSection className="p-4">
        <SectionHeader
            title="Quick Actions"
            subtitle="Faça o que mais importa em 1 clique."
        />
        <Separator className="my-4" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Card 
                className="group cursor-pointer rounded-xl bg-white/50 p-4 shadow-sm backdrop-blur transition hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70"
                onClick={handleAddInvoiceClick}
            >
                <CardContent className="p-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                        <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-semibold">Add Invoice</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">Lançar no job atual</div>
                    </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5" />
                </div>
                </CardContent>
            </Card>

            <Link href="/dashboard/jobs/new">
            <Card className="group cursor-pointer rounded-xl bg-white/50 p-4 shadow-sm backdrop-blur transition hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70">
                <CardContent className="p-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                        <PlusCircle className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="font-semibold">New Job</div>
                        <div className="text-xs text-zinc-600 dark:text-zinc-400">Criar projeto</div>
                    </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5" />
                </div>
                </CardContent>
            </Card>
            </Link>
        </div>
        </GlassSection>
        
        {/* Modal for multiple jobs */}
        <JobSelectionModal 
            jobs={inProgressJobs}
            isOpen={isJobSelectionOpen}
            onOpenChange={setJobSelectionOpen}
        />

        {/* Modal for single job */}
        {singleJob && (
            <Dialog open={isSingleJobInvoiceOpen} onOpenChange={setSingleJobInvoiceOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">{singleJob.title}</DialogTitle>
                    </DialogHeader>
                    <AddInvoiceForm 
                        jobId={singleJob.id}
                        existingInvoices={singleJob.invoices || []}
                        origins={invoiceOrigins}
                        onSuccess={handleInvoiceFormSuccess}
                    />
                </DialogContent>
            </Dialog>
        )}
    </>
    );
}

// ---------------------------------------------------------------------
// Current Job snapshot (o último em progresso, fallback para Not Started)
// ---------------------------------------------------------------------
function CurrentJobCard({ job, settings }: { job: Job; settings: GeneralSettings | null }) {
  const payout = calculateJobPayout(job, settings);
  const materialCost = calculateMaterialCost(job.invoices);
  
  const sub = job.title || `${(job.clientName || "").split(" ").pop() || "Client"} #${job.quoteNumber}`;

  return (
    <GlassSection className="p-4">
      <SectionHeader
        title="Current Job"
        subtitle="Seu projeto em foco"
        right={
          <Link href={`/dashboard/jobs/${job.id}`}>
            <Button variant="secondary" size="icon" className="rounded-full">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />
      <Separator className="my-4" />
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 flex-1">
          <div className="flex flex-col gap-2">
            <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{sub}</div>
            <a 
              href={`https://maps.apple.com/?q=${encodeURIComponent(job.address)}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:underline"
            >
              <MapPin className="h-4 w-4" /> {job.address}
            </a>
            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <CalendarDays className="h-4 w-4" />
              {job.startDate ? `Start: ${format(new Date(job.startDate), "MMM dd, yyyy")}` : "No start date"} · {job.deadline ? `Deadline: ${format(new Date(job.deadline), "MMM dd, yyyy")}` : "No deadline"}
            </div>
            <div className="pt-2">
              <Badge variant="outline" className="capitalize">{job.status}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Metric label="Remaining Payout" value={currency(Math.max(payout, 0))} />
            <Metric label="Material Cost" value={currency(materialCost)} />
          </div>
        </div>
      </div>
    </GlassSection>
  );
}

function CurrentJobFallback() {
  return (
    <GlassSection className="p-4">
      <SectionHeader
        title="Current Job"
        subtitle="Você ainda não tem um job em progresso."
        right={
          <Link href="/dashboard/jobs/new">
            <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Job</Button>
          </Link>
        }
      />
      <Separator className="my-4" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </GlassSection>
  );
}

// ---------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "global");
  }, [firestore]);
  const { data: settings } = useDoc<GeneralSettings>(settingsRef);

  // Query for all jobs to be used across the dashboard
  const allJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "jobs"),
      orderBy("startDate", "desc")
    );
  }, [firestore, user]);

  const { data: allJobs, isLoading: loadingAllJobs } = useCollection<Job>(allJobsQuery);

  // Jobs "In Progress"
  const inProgressJobs = React.useMemo(() => {
    return allJobs?.filter(job => job.status === "In Progress") || [];
  }, [allJobs]);

  // Fallback: se não houver In Progress, pega 1 Not Started mais próximo do futuro
  const notStartedJobs = React.useMemo(() => {
    const today = startOfToday();
    return allJobs?.filter(job => {
        const startDate = parseISO(job.startDate);
        return job.status === "Not Started" && (isSameDay(startDate, today) || isFuture(startDate));
    })
    .sort((a,b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()) || [];
  }, [allJobs]);
  
  // Upcoming Jobs for the next 7 days
  const upcomingJobs = React.useMemo(() => {
    if (!allJobs) return [];
    
    const today = startOfToday();
    const nextWeek = addDays(today, 7);
    
    const upcoming = allJobs.map(job => {
      const allDates = [job.startDate, ...(job.productionDays?.map(pd => pd.date) || [])];
      const nextActivityDate = allDates
        .map(d => parseISO(d))
        .filter(d => isWithinInterval(d, { start: today, end: nextWeek }))
        .sort((a,b) => a.getTime() - b.getTime())[0];
        
      return nextActivityDate ? { job, nextActivityDate } : null;
    }).filter((item): item is { job: Job, nextActivityDate: Date } => item !== null);
    
    return upcoming.sort((a, b) => a!.nextActivityDate.getTime() - b!.nextActivityDate.getTime());
    
  }, [allJobs]);
  
  const getLatestInProgressJob = (jobs: Job[] | null) => {
    if (!jobs || jobs.length === 0) return null;
    // sort by start date descending for in progress jobs
    return [...jobs].sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())[0];
  }

  const currentJob = getLatestInProgressJob(inProgressJobs) || notStartedJobs[0];
  const isLoading = loadingAllJobs;

  return (
    <div
      className={
        "min-h-full w-full p-4 sm:p-6 text-zinc-900 " +
        "bg-[radial-gradient(1200px_600px_at_-200px_-100px,rgba(0,0,0,0.05),transparent),radial-gradient(1200px_600px_at_120%_20%,rgba(0,0,0,0.06),transparent)] " +
        "dark:text-zinc-50 dark:bg-[radial-gradient(1000px_500px_at_-200px_-100px,rgba(255,255,255,0.08),transparent),radial-gradient(1000px_500px_at_120%_20%,rgba(255,255,255,0.06),transparent)]"
      }
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.displayName?.split(' ')[0] || 'User'} 👋</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Let’s make today productive.</p>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <QuickActions inProgressJobs={inProgressJobs || []} />

          {/* Current job */}
          {isLoading ? (
            <GlassSection className="p-4">
              <SectionHeader title="Current Job" subtitle="Carregando..." />
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </GlassSection>
          ) : currentJob ? (
            <CurrentJobCard job={currentJob} settings={settings} />
          ) : (
            <CurrentJobFallback />
          )}
        </div>

        {/* Side Column */}
        <div className="flex flex-col gap-4">
          <RevenueChart />
          
          <GlassSection className="p-4">
            <SectionHeader
              title="Upcoming"
              subtitle="Jobs scheduled for the next 7 days"
              right={
                <Link href="/dashboard/calendar">
                  <Button variant="ghost" className="gap-2">
                    Open Calendar <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              }
            />
            <Separator className="my-4" />
            <div className="grid grid-cols-1 gap-3">
             {isLoading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : upcomingJobs && upcomingJobs.length > 0 ? (
                upcomingJobs.map(({ job, nextActivityDate }) => (
                  <Link href={`/dashboard/jobs/${job!.id}`} key={job!.id + nextActivityDate.toISOString()} className="block rounded-lg border border-zinc-200/60 bg-white/60 p-3 text-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/50 hover:bg-white/80 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="font-semibold truncate pr-2">{job!.title || `${job!.clientName} #${job!.quoteNumber}`}</span>
                         <Badge variant="secondary" className={cn(isSameDay(nextActivityDate, new Date()) && "bg-primary/10 text-primary border-primary/20")}>
                           <CalendarCheck className="h-3 w-3 mr-1.5" />
                           {formatDistanceToNow(nextActivityDate, { addSuffix: true })}
                        </Badge>
                     </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-lg border border-zinc-200/60 bg-white/60 p-3 text-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/50 text-center text-muted-foreground">
                  No jobs scheduled for the next 7 days.
                </div>
              )}
            </div>
          </GlassSection>
        </div>
      </div>
    </div>
  );
}
