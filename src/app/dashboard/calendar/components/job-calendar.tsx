"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import type { Job } from "@/app/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { clients } from "@/app/lib/data";

export function JobCalendar({ jobs }: { jobs: Job[] }) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const jobDates = jobs.map((job) => new Date(job.deadline));

  const selectedDayJobs = date
    ? jobs.filter((job) => isSameDay(new Date(job.deadline), date))
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
            }}
            modifiers={{
              jobDeadline: jobDates,
            }}
            modifiersStyles={{
              jobDeadline: {
                color: "hsl(var(--primary-foreground))",
                backgroundColor: "hsl(var(--primary))",
              },
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
              const client = clients.find(c => c.id === job.clientId);
              return (
                <div key={job.id} className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{job.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Client: {client?.name || 'N/A'}
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
