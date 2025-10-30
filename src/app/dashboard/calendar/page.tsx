
"use client";

import * as React from "react";
import { MonthJobsCalendar } from "@/components/MonthJobsCalendar";
import { useFirestore, useUser, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import type { Job as JobType } from "@/app/lib/types";

export default function CalendarPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [monthDate, setMonthDate] = React.useState<Date>(new Date());

  // Pega até 200 jobs recentes (ajuste se quiser paginação)
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, "users", user.uid, "jobs"),
      orderBy("startDate", "desc"),
      limit(200)
    );
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<JobType>(jobsQuery);

  return (
    <div
      className="
        min-h-[calc(100dvh-4rem)]
        w-full
        px-4 py-4
        text-zinc-900
        bg-[radial-gradient(1200px_600px_at_-200px_-100px,rgba(0,0,0,0.05),transparent),radial-gradient(1200px_600px_at_120%_20%,rgba(0,0,0,0.06),transparent)]
        dark:text-zinc-50
        dark:bg-[radial-gradient(1000px_500px_at_-200px_-100px,rgba(255,255,255,0.08),transparent),radial-gradient(1000px_500px_at_120%_20%,rgba(255,255,255,0.06),transparent)]
      "
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Visualize todos os jobs do mês. Início do job = célula preenchida. Dias trabalhados = ponto.
          </p>
        </div>

        <div className="rounded-2xl border border-white/50 bg-white/70 p-4 shadow-xl backdrop-blur-md dark:bg-zinc-900/60 dark:border-white/10">
          {isLoading ? (
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                <div className="h-6 w-32 rounded-md bg-muted animate-pulse"></div>
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
              </div>
              <div className="mb-1 grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => <div key={i} className="h-8 rounded-md bg-muted animate-pulse"></div>)}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[...Array(35)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse"></div>)}
              </div>
            </div>
          ) : (
            <MonthJobsCalendar
              jobs={jobs || []}
              monthDate={monthDate}
              onMonthChange={setMonthDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
