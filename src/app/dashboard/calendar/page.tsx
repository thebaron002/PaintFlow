"use client";

import { useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import type { Job } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { JobCalendar } from "./components/job-calendar";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarPage() {
  const firestore = useFirestore();
  
  const jobsQuery = useMemoFirebase(() => collection(firestore, 'jobs'), [firestore]);
  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Calendar" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="lg:col-span-4 h-[370px]" />
          <Skeleton className="lg:col-span-3 h-[370px]" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Calendar" />
      <JobCalendar jobs={jobs || []} />
    </div>
  );
}
