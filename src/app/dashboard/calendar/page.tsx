

"use client";

import * as React from "react";
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MonthJobsCalendar } from "@/components/MonthJobsCalendar";
import type { Job } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [monthDate, setMonthDate] = React.useState<Date>(new Date());
  const [selectedDayISO, setSelectedDayISO] = React.useState<string | null>(
    null
  );

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "jobs"), orderBy("startDate", "desc"));
  }, [firestore, user]);

  const { data: allJobs, isLoading } = useCollection<Job>(jobsQuery);

  const jobsInMonth = React.useMemo(() => {
    if (!allJobs) return [];
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    
    const getDate = (d: string | Date) => {
      if (typeof d === 'string') return parseISO(d);
      return d;
    }

    return allJobs.filter(job => {
      const hasActivityInMonth = 
        (job.startDate && isWithinInterval(getDate(job.startDate), { start, end })) ||
        (job.productionDays || []).some(day => isWithinInterval(getDate(day.date), { start, end }));
      return hasActivityInMonth;
    });
  }, [allJobs, monthDate]);

  // If a day is selected, move the jobs from that day to the top
  const sortedJobs = React.useMemo(() => {
    if (!selectedDayISO) return jobsInMonth;
    
    const jobsForDay: Job[] = [];
    const otherJobs: Job[] = [];

    jobsInMonth.forEach(job => {
      const hasActivityOnSelectedDay = 
        job.startDate === selectedDayISO || 
        (job.productionDays || []).some(pd => pd.date === selectedDayISO);
      
      if (hasActivityOnSelectedDay) {
        jobsForDay.push(job);
      } else {
        otherJobs.push(job);
      }
    });

    return [...jobsForDay, ...otherJobs];
  }, [jobsInMonth, selectedDayISO]);


  const getDaysForJobInMonth = (job: Job) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const days: string[] = [];

    if (job.startDate && isWithinInterval(parseISO(job.startDate), { start, end })) {
        days.push(job.startDate);
    }
    (job.productionDays || []).forEach(day => {
        if (isWithinInterval(parseISO(day.date), { start, end })) {
            days.push(day.date);
        }
    });
    return [...new Set(days)].sort();
  }

  return (
    <div
      className={cn(
        "min-h-[100dvh] w-full px-4 py-4 text-zinc-900",
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
                jobs={allJobs || []}
                monthDate={monthDate}
                onMonthChange={setMonthDate}
                onSelectDay={(isoDay) => setSelectedDayISO(isoDay)}
                />
            )}
          </div>
        </section>

        {/* COLUNA DIREITA: Lista de jobs */}
        <section className="flex-1 min-w-0">
          <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/60">
            <div className="mb-4 flex items-baseline justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Jobs this month
                </h2>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  {format(monthDate, "MMMM yyyy")} • {jobsInMonth.length} job
                  {jobsInMonth.length === 1 ? "" : "s"}
                </p>
              </div>

              {selectedDayISO && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedDayISO(null)}>
                  Clear selection
                </Button>
              )}
            </div>

            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            )}

            {!isLoading && sortedJobs.length === 0 && (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground rounded-lg bg-background/50">
                No jobs scheduled this month.
              </div>
            )}

            <div className="space-y-4">
              {sortedJobs.map((job) => {
                 const jobDays = getDaysForJobInMonth(job);
                 const displayTitle = job.title || `${job.clientName.split(" ").pop() || ""} #${job.quoteNumber}`;

                return (
                  <Link href={`/dashboard/jobs/${job.id}`} key={job.id}
                    className={cn(
                      "block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60",
                      selectedDayISO && (job.startDate === selectedDayISO || job.productionDays.some(pd => pd.date === selectedDayISO))
                        ? "ring-2 ring-primary dark:ring-primary/70"
                        : "hover:border-zinc-300 dark:hover:border-zinc-700"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                          {displayTitle}
                        </div>
                        <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {job.clientName}
                        </div>
                        <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                          {job.address}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 text-[10px] capitalize",
                          job.status === "In Progress" && "border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-400/40 dark:bg-blue-400/10 dark:text-blue-300",
                          job.status === "Complete" && "border-green-400 bg-green-50 text-green-700 dark:border-green-400/40 dark:bg-green-400/10 dark:text-green-300",
                          job.status === "Open Payment" && "border-yellow-400 bg-yellow-50 text-yellow-700 dark:border-yellow-400/40 dark:bg-yellow-400/10 dark:text-yellow-300",
                          job.status === "Finalized" && "border-zinc-400 bg-zinc-100 text-zinc-700 dark:border-zinc-500/40 dark:bg-zinc-700/30 dark:text-zinc-300"
                        )}
                      >
                        {job.status}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-start gap-2">
                        <CalendarDays className="h-4 w-4 mt-0.5 shrink-0 text-zinc-500 dark:text-zinc-400" />
                        <div className="flex flex-wrap gap-1.5">
                            {jobDays.map(day => (
                                <Badge key={day} variant={day === job.startDate ? "default" : "secondary"}
                                className={cn(
                                    day === job.startDate ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                    "text-[10px]"
                                )}>
                                    {format(parseISO(day), "d MMM")}
                                </Badge>
                            ))}
                        </div>
                    </div>

                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
