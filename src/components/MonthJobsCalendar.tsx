"use client";

import * as React from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  parseISO,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Job } from "@/app/lib/types";

// util local yyyy-MM-dd
function toYYYYMMDD(d: Date | string) {
  const date = typeof d === 'string' ? parseISO(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


type DayInfo = {
  date: Date;
  isCurrentMonth: boolean;
  hasAnyStart: boolean;
  hasAnyProduction: boolean;
};

type MonthJobsCalendarProps = {
  jobs: Job[];
  monthDate: Date;
  onMonthChange?: (d: Date) => void;
  onSelectDay?: (isoDay: string) => void; // novo
};

export function MonthJobsCalendar({
  jobs,
  monthDate,
  onMonthChange,
  onSelectDay,
}: MonthJobsCalendarProps) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // domingo
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // pré-calcula lookup de dias
  const { dayInfoList } = React.useMemo(() => {
    const daysArr = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const startsSet = new Set<string>();
    const prodSet = new Set<string>();

    for (const job of jobs) {
      if (job.startDate) {
        startsSet.add(toYYYYMMDD(job.startDate));
      }
      if (job.productionDays?.length) {
        for (const p of job.productionDays) {
          prodSet.add(toYYYYMMDD(p));
        }
      }
    }

    const info: DayInfo[] = daysArr.map((d) => {
      const iso = toYYYYMMDD(d);
      return {
        date: d,
        isCurrentMonth: isSameMonth(d, monthStart),
        hasAnyStart: startsSet.has(iso),
        hasAnyProduction: prodSet.has(iso),
      };
    });

    return { dayInfoList: info };
  }, [jobs, gridStart, gridEnd, monthStart]);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      {/* header mês */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => onMonthChange?.(subMonths(monthDate, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-lg font-semibold">
          {format(monthDate, "MMMM yyyy", { locale: enUS })}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={() => onMonthChange?.(addMonths(monthDate, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* nomes dos dias da semana */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground sm:text-xs sm:gap-2">
        {weekDays.map((wd) => (
          <div key={wd} className="py-2">{wd}</div>
        ))}
      </div>

      {/* grid dias */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-[11px] sm:text-sm">
        {dayInfoList.map((d) => {
          const isoDay = toYYYYMMDD(d.date);
          const isToday = isSameDay(d.date, new Date());

          // estilos base da célula
          const baseCell =
            "group relative flex h-16 sm:h-20 flex-col items-center justify-center rounded-lg border text-center shadow-sm transition-colors";

          const cellClasses = cn(
            baseCell,
            d.isCurrentMonth
              ? "bg-white border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-50"
              : "bg-zinc-50 border-zinc-200/70 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800/70 dark:text-zinc-600",
            d.hasAnyStart &&
              "bg-primary text-primary-foreground border-primary shadow-sm",
            isToday && !d.hasAnyStart &&
              "ring-2 ring-primary/50",
            "active:scale-[0.97] touch-manipulation"
          );

          return (
            <button
              key={isoDay}
              className={cellClasses}
              onClick={() => onSelectDay?.(isoDay)}
            >
              <div className="text-xs font-semibold sm:text-sm">
                {format(d.date, "d")}
              </div>

              {/* pontinho de produção */}
              {d.hasAnyProduction && !d.hasAnyStart && (
                <div className={cn(
                    "absolute bottom-2 h-1.5 w-1.5 rounded-full",
                    d.isCurrentMonth ? "bg-primary" : "bg-muted-foreground",
                    d.hasAnyStart ? "bg-primary-foreground" : ""
                )} />
              )}

              {/* Today badge */}
              {isToday && !d.hasAnyStart && (
                <div className="absolute right-1 top-1">
                  <Badge
                    variant="secondary"
                    className="h-4 px-1.5 text-[9px] sm:h-5 sm:text-[10px] bg-primary/10 text-primary border-primary/20"
                  >
                    Today
                  </Badge>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* legenda */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-zinc-600 sm:text-sm dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 rounded bg-primary" />
          <span>Start day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative h-4 w-6 rounded border border-zinc-200 bg-white dark:bg-zinc-800 dark:border-zinc-700">
            <div className="absolute bottom-[2px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-primary" />
          </div>
          <span>Worked day</span>
        </div>
      </div>
    </div>
  );
}
