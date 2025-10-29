
"use client";

import * as React from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Receipt, BarChart3, ArrowRight, MapPin, CalendarDays } from "lucide-react";

// Hooks / Firebase (mantive seus nomes/assinaturas)
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import type { Job as JobType } from "@/app/lib/types";

// Types (ajuste se necessário)
type Invoice = { amount: number; date?: string; isPayoutDiscount?: boolean; source?: string };
type Adjustment = { type: "Time" | "Material" | "General"; value: number; hourlyRate?: number };
type Job = {
  id: string;
  title?: string;
  clientName: string;
  workOrderNumber: string;
  address: string;
  status: "Not Started" | "In Progress" | "Complete" | "Open Payment" | "Finalized";
  startDate?: string; // ISO String
  deadline?: string; // ISO String
  budget?: number;       // usado quando não é fixed pay
  initialValue?: number; // payout quando é fixed pay
  isFixedPay?: boolean;
  invoices?: Invoice[];
  adjustments?: Adjustment[];
};

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
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
        ) : null}
      </div>
      {right ? <div className="pt-1">{right}</div> : null}
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
function sumInvoices(invoices?: Invoice[]) {
  if (!invoices?.length) return 0;
  return invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
}
function sumAdjustments(adjs?: Adjustment[], hourlyDefault = 0) {
  if (!adjs?.length) return 0;
  return adjs.reduce((sum, a) => {
    if (a.type === "Time") {
      const rate = a.hourlyRate ?? hourlyDefault;
      return sum + (a.value * rate);
    }
    return sum + a.value;
  }, 0);
}
function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------
// Quick Actions (os 3 botões grandes)
// ---------------------------------------------------------------------
function QuickActions() {
  return (
    <GlassSection className="p-4">
      <SectionHeader
        title="Quick Actions"
        subtitle="Faça o que mais importa em 1 clique."
        right={
          <div className="hidden sm:block">
            <Link href="/dashboard/jobs/new">
              <Button className="gap-2"><PlusCircle className="h-4 w-4" /> New Job</Button>
            </Link>
          </div>
        }
      />
      <Separator className="my-4" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/dashboard/jobs">
          <Card className="group cursor-pointer rounded-xl bg-white/50 p-4 shadow-sm backdrop-blur transition hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70">
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
        </Link>

        <Link href="/dashboard/jobs/new" className="sm:hidden">
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

        <Link href="/dashboard/finance">
          <Card className="group cursor-pointer rounded-xl bg-white/50 p-4 shadow-sm backdrop-blur transition hover:bg-white/80 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">Revenue Overview</div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Performance mensal</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </GlassSection>
  );
}

// ---------------------------------------------------------------------
// Revenue mini-overview (sem dependências externas de chart)
// ---------------------------------------------------------------------
function RevenueMini({ jobs, hourlyRate }: { jobs: Job[]; hourlyRate: number }) {
  // KPIs simples
  const completed = jobs.filter(j => j.status === "Complete" || j.status === "Finalized");
  const inProgress = jobs.filter(j => j.status === "In Progress");

  const totalInvoiced = completed.reduce((sum, j) => sum + sumInvoices(j.invoices), 0);
  const totalAdjustments = completed.reduce((sum, j) => sum + sumAdjustments(j.adjustments, hourlyRate), 0);

  return (
    <GlassSection className="p-4">
      <SectionHeader
        title="Revenue Overview"
        subtitle="Snapshot rápido do mês corrente"
        right={
          <Link href="/dashboard/finance">
            <Button variant="ghost" className="gap-2">
              Open Finance <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />
      <Separator className="my-4" />
      <div className="flex flex-wrap items-stretch gap-3">
        <Metric label="Invoiced (Completed)" value={currency(totalInvoiced)} />
        <Metric label="Adjustments" value={currency(totalAdjustments)} />
        <Metric label="Jobs In Progress" value={String(inProgress.length)} />
      </div>
    </GlassSection>
  );
}

// ---------------------------------------------------------------------
// Current Job snapshot (o último em progresso, fallback para Not Started)
// ---------------------------------------------------------------------
function CurrentJobCard({ job, hourlyRate }: { job: Job; hourlyRate: number }) {
  const totalInvoiced = sumInvoices(job.invoices);
  const adjustments = sumAdjustments(job.adjustments, hourlyRate);
  const payoutDiscount = job.invoices?.filter(i => i.isPayoutDiscount).reduce((s, i) => s + i.amount, 0) ?? 0;

  const remainingPayout = job.isFixedPay
    ? (job.initialValue || 0) + adjustments - payoutDiscount
    : (job.budget || 0) - totalInvoiced + adjustments;

  const sub = job.title || `${(job.clientName || "").split(" ").pop() || "Client"} #${job.workOrderNumber}`;

  return (
    <GlassSection className="p-4">
      <SectionHeader
        title="Current Job"
        subtitle="Seu projeto em foco"
        right={
          <Link href={`/dashboard/jobs/${job.id}`}>
            <Button className="gap-2">
              Open Job <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />
      <Separator className="my-4" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{sub}</div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <MapPin className="h-4 w-4" /> {job.address}
          </div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <CalendarDays className="h-4 w-4" />
            {job.startDate ? `Start: ${format(new Date(job.startDate), "MMM dd, yyyy")}` : "No start date"} · {job.deadline ? `Deadline: ${format(new Date(job.deadline), "MMM dd, yyyy")}` : "No deadline"}
          </div>
          <div className="pt-2">
            <Badge variant="outline" className="capitalize">{job.status}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Metric label="Remaining Payout" value={currency(Math.max(remainingPayout, 0))} />
          <Metric label="Total Invoiced" value={currency(totalInvoiced)} />
          <Metric label="Adjustments" value={currency(adjustments)} />
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

  // Jobs "In Progress" (pega 1 como atual)
  const inProgressQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "jobs"),
      where("status", "==", "In Progress"),
      limit(10) // Fetch more than 1 to sort on client
    );
  }, [firestore, user]);

  const { data: inProgressJobs, isLoading: loadingInProgress } = useCollection<JobType>(inProgressQuery);

  // Fallback: se não houver In Progress, pega 1 Not Started mais recente
  const notStartedQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "jobs"),
      where("status", "==", "Not Started"),
      limit(10) // Fetch more than 1 to sort on client
    );
  }, [firestore, user]);
  const { data: notStartedJobs, isLoading: loadingNotStarted } = useCollection<JobType>(notStartedQuery);

  // Para overview (pega até 50 jobs recentes; simples)
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "jobs"),
      orderBy("startDate", "desc"),
      limit(50)
    );
  }, [firestore, user]);
  const { data: recentJobs, isLoading: loadingJobs } = useCollection<JobType>(jobsQuery);

  // hourly rate básico — se quiser, troque por leitura das GeneralSettings
  const hourlyRate = 0;

  const getLatestJob = (jobs: JobType[] | null) => {
    if (!jobs || jobs.length === 0) return null;
    return jobs.sort((a, b) => new Date(b.startDate ?? 0).getTime() - new Date(a.startDate ?? 0).getTime())[0];
  }

  const currentJob = getLatestJob(inProgressJobs) || getLatestJob(notStartedJobs) || null;

  return (
    <div
      className={
        "min-h-[calc(100dvh-4rem)] w-full px-4 pb-8 pt-4 text-zinc-900 " +
        "bg-[radial-gradient(1200px_600px_at_-200px_-100px,rgba(0,0,0,0.05),transparent),radial-gradient(1200px_600px_at_120%_20%,rgba(0,0,0,0.06),transparent)] " +
        "dark:text-zinc-50 dark:bg-[radial-gradient(1000px_500px_at_-200px_-100px,rgba(255,255,255,0.08),transparent),radial-gradient(1000px_500px_at_120%_20%,rgba(255,255,255,0.06),transparent)]"
      }
    >
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Good {new Date().getHours() < 12 ? "morning" : "afternoon"}, {user?.displayName?.split(' ')[0] || 'User'} 👋</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Let’s make today productive.</p>
          </div>
        </div>
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <QuickActions />

          {/* Current job */}
          {loadingInProgress || loadingNotStarted ? (
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
            <CurrentJobCard job={currentJob} hourlyRate={hourlyRate} />
          ) : (
            <CurrentJobFallback />
          )}
        </div>

        {/* Revenue Overview */}
        <div className="flex flex-col gap-4">
          {loadingJobs ? (
            <GlassSection className="p-4">
              <SectionHeader title="Revenue Overview" subtitle="Carregando..." />
              <Separator className="my-4" />
              <div className="grid grid-cols-3 gap-3">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </GlassSection>
          ) : (
            <RevenueMini jobs={recentJobs || []} hourlyRate={hourlyRate} />
          )}

          {/* Mini Calendar Preview (opcional / pode remover) */}
          <GlassSection className="p-4">
            <SectionHeader
              title="Upcoming (3 days)"
              subtitle="Pequeno preview — abra o Calendar para completo"
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
              <div className="rounded-lg border border-zinc-200/60 bg-white/60 p-3 text-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/50">
                No events scheduled.
              </div>
            </div>
          </GlassSection>
        </div>
      </div>
    </div>
  );
}
