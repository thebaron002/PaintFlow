
"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import type { Job } from "@/app/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function JobCalendar({ jobs }: { jobs: Job[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const jobStartDates = jobs.map((job) => new Date(job.startDate));
  const productionDays = jobs.flatMap(job => job.productionDays?.map(d => new Date(d)) ?? []);

  const selectedDayJobs = date
    ? jobs.filter((job) => 
        isSameDay(new Date(job.startDate), date) || 
        (job.productionDays || []).some(d => isSameDay(new Date(d), date))
      )
    : [];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <div className="lg:col-span-4">
        <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="glass-card p-4 rounded-lg border"
            modifiers={{
              jobStart: jobStartDates,
              productionDay: productionDays,
            }}
            modifiersClassNames={{
              jobStart: "bg-chart-1/30",
              today: "text-accent-foreground bg-accent",
              selected: "text-primary-foreground bg-primary hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            }}
            components={{
                DayContent: (props) => {
                    const isProductionDay = productionDays.some(d => isSameDay(d, props.date));
                    return (
                        <div className="relative h-full w-full flex items-center justify-center">
                            {props.date.getDate()}
                            {isProductionDay && <div className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-chart-1" />}
                        </div>
                    );
                }
            }}
          />
      </div>
      <div className="lg:col-span-3 glass-card p-4">
        <h3 className="font-headline text-xl font-bold mb-4">
            {date ? format(date, "MMMM dd, yyyy") : "Select a day"}
        </h3>
        <div className="grid gap-4">
          {selectedDayJobs.length > 0 ? (
            selectedDayJobs.map((job) => {
              return (
                <div key={job.id} className="bg-background/40 dark:bg-background/20 p-4 rounded-lg border border-white/30">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{job.title}</p>
                    <Badge variant="outline" className="capitalize bg-transparent border-foreground/30">
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground/80 dark:text-muted-foreground">
                    Client: {job.clientName || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground/80 dark:text-muted-foreground">
                    Address: {job.address}
                  </p>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground/80 dark:text-muted-foreground">No jobs scheduled for this day.</p>
          )}
        </div>
      </div>
    </div>
  );
}
