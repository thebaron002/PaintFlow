"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MonthJobsCalendar } from "@/components/MonthJobsCalendar";
import type { Job } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";


export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // mês atual exibido no calendário
  const [monthDate, setMonthDate] = React.useState<Date>(new Date());
  // dia clicado no calendário (yyyy-MM-dd)
  const [selectedDayISO, setSelectedDayISO] = React.useState<string | null>(null);

  // pega todos os jobs do user (se quiser limitar no futuro: query ordenada)
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "jobs");
  }, [firestore, user]);

  const { data: jobs = [], isLoading } = useCollection<Job>(jobsQuery);

  // quais dias têm atividade nesse mês?
  // também vamos montar o map dia -> jobs daquele dia
  const { daysMap, orderedDays } = React.useMemo(() => {
    const map: Record<string, Job[]> = {};
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);

    function add(dayISO: string, job: Job) {
      if (!map[dayISO]) map[dayISO] = [];
      // evitar duplicar o mesmo job 2x no mesmo dia
      if (!map[dayISO].some((jj) => jj.id === job.id)) {
        map[dayISO].push(job);
      }
    }
    
    const getDate = (d: string | Date) => {
        if (typeof d === 'string') return parseISO(d);
        return d;
    }

    for (const job of jobs) {
      // startDate conta se está dentro do mês mostrado
      if (job.startDate) {
        const d = getDate(job.startDate);
        if (isWithinInterval(d, { start, end })) {
          add(format(d, 'yyyy-MM-dd'), job);
        }
      }

      // productionDays também contam se estão no mês
      if (job.productionDays?.length) {
        for (const p of job.productionDays) {
          const d = getDate(p);
          if (isWithinInterval(d, { start, end })) {
            add(format(d, 'yyyy-MM-dd'), job);
          }
        }
      }
    }

    // ordenar as chaves de dia em ordem cronológica
    const uniqueDays = Object.keys(map).sort((a, b) => {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });

    return {
      daysMap: map,
      orderedDays: uniqueDays,
    };
  }, [jobs, monthDate]);

  // se o cara clicou num dia no calendário, a lista vai focar esse dia primeiro
  const displayDays = React.useMemo(() => {
    if (selectedDayISO && daysMap[selectedDayISO]) {
      return [selectedDayISO, ...orderedDays.filter((d) => d !== selectedDayISO)];
    }
    return orderedDays;
  }, [orderedDays, selectedDayISO, daysMap]);

  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full px-4 py-4 text-zinc-900",
        // fundo gradiente leve estilo que estamos usando
        "bg-[radial-gradient(1200px_600px_at_-200px_-100px,rgba(0,0,0,0.05),transparent),radial-gradient(1200px_600px_at_120%_20%,rgba(0,0,0,0.06),transparent)]",
        "dark:text-zinc-50",
        "dark:bg-[radial-gradient(1000px_500px_at_-200px_-100px,rgba(255,255,255,0.08),transparent),radial-gradient(1000px_500px_at_120%_20%,rgba(255,255,255,0.06),transparent)]"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        {/* COLUNA ESQUERDA: Calendário */}
        <section className="lg:w-[480px] lg:shrink-0">
          <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60">
            <h1 className="mb-2 text-xl font-bold tracking-tight">Calendar</h1>
            <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
              Tap a day to see the jobs. Start day = filled block.
              Worked day = dot.
            </p>
            {isLoading ? (
               <div className="w-full">
                <div className="mb-4 flex items-center justify-between">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="mb-1 grid grid-cols-7 gap-2">
                  {[...Array(7)].map((_, i) => <Skeleton key={i} className="h-8 rounded-md" />)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(35)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
                </div>
              </div>
            ) : (
                <MonthJobsCalendar
                jobs={jobs}
                monthDate={monthDate}
                onMonthChange={setMonthDate}
                onSelectDay={(isoDay) => setSelectedDayISO(isoDay)}
                />
            )}
          </div>
        </section>

        {/* COLUNA DIREITA: Lista de dias e jobs */}
        <section className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Jobs this month
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {format(monthDate, "MMMM yyyy")} • {orderedDays.length} work day
                  {orderedDays.length === 1 ? "" : "s"}
                </p>
              </div>

              {selectedDayISO ? (
                <div className="text-right">
                  <div className="text-[10px] uppercase text-zinc-500 dark:text-zinc-400">
                    Selected day
                  </div>
                  <div className="text-sm font-medium">
                    {format(parseISO(selectedDayISO), "MMM d, yyyy")}
                  </div>
                </div>
              ) : null}
            </div>

            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Loading jobs...
              </div>
            )}

            {!isLoading && displayDays.length === 0 && (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground rounded-lg bg-background/50">
                No jobs scheduled this month.
              </div>
            )}

            <div className="space-y-6">
              {displayDays.map((dayISO) => {
                const dayJobs = daysMap[dayISO];
                if (!dayJobs) return null;

                const pretty = format(parseISO(dayISO), "EEE, MMM d");

                return (
                  <div
                    key={dayISO}
                    className={cn(
                      "rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60",
                      selectedDayISO === dayISO
                        ? "ring-2 ring-zinc-900 dark:ring-white/40"
                        : ""
                    )}
                  >
                    <div className="mb-3 flex items-baseline justify-between">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {pretty}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {dayISO}
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {dayJobs.map((job) => {
                        const displayTitle =
                          job.title ||
                          `${job.clientName.split(" ").pop() || ""} #${
                            job.workOrderNumber
                          }`;

                        return (
                          <li
                            key={job.id}
                            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                  {displayTitle}
                                </div>
                                <div className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                                  {job.clientName}
                                </div>
                                <div className="truncate text-[11px] text-zinc-600 dark:text-zinc-400">
                                  {job.address}
                                </div>
                              </div>

                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 text-[10px] capitalize",
                                  job.status === "In Progress" &&
                                    "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-300",
                                  job.status === "Complete" &&
                                    "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/10 dark:text-emerald-300",
                                  job.status === "Open Payment" &&
                                    "border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-400/40 dark:bg-cyan-400/10 dark:text-cyan-300",
                                  job.status === "Finalized" &&
                                    "border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-500/40 dark:bg-zinc-700/30 dark:text-zinc-300"
                                )}
                              >
                                {job.status}
                              </Badge>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
