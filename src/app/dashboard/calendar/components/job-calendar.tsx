
"use client";

import * as React from "react";
import { format, isSameDay, isFuture, isPast } from "date-fns";
import type { Job } from "@/app/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function JobCalendar({ jobs }: { jobs: Job[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const jobStartDates = jobs.map((job) => new Date(job.startDate));
  const productionDays = jobs.flatMap(job => job.productionDays?.map(d => new Date(d)) ?? []);

  const selectedDayJobs = date
    ? jobs.filter((job) => isSameDay(new Date(job.deadline), date) || isSameDay(new Date(job.startDate), date) || (job.productionDays || []).some(d => isSameDay(new Date(d), date)))
    : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="lg:col-span-4">
        <CardContent className="p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="p-0"
            classNames={{
              root: "w-full",
              months: "w-full",
              month: "w-full",
              table: "w-full",
              head_row: "w-full",
              row: "w-full",
              caption_label: "font-headline",
              day_selected: "bg-transparent text-primary hover:bg-transparent hover:text-primary focus:bg-transparent focus:text-primary font-bold",
              day_today: "bg-accent text-accent-foreground",
            }}
            modifiers={{
              jobStart: jobStartDates,
              productionDay: productionDays,
            }}
            modifiersClassNames={{
              jobStart: "bg-chart-1/30",
              productionDay: "relative",
            }}
            components={{
                DayContent: (props) => {
                    const isProductionDay = productionDays.some(d => isSameDay(d, props.date));
                    return (
                        <div className="relative h-full w-full flex items-center justify-center">
                            {props.date.getDate()}
                            {isProductionDay && <div className="absolute bottom-1 h-1 w-1 rounded-full bg-chart-1" />}
                        </div>
                    );
                }
            }}
          />
        </CardContent>
      </Card>
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="font-headline">
            {date ? format(date, "MMMM dd, yyyy") : "Select a day"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {selectedDayJobs.length > 0 ? (
            selectedDayJobs.map((job) => {
              return (
                <div key={job.id} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{job.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Client: {job.clientName || 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Address: {job.address}
                  </p>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">No jobs scheduled for this day.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
