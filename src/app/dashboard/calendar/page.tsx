
"use client";

import type { Job } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { JobCalendar } from "./components/job-calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";

export default function CalendarPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Calendar" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Skeleton className="lg:col-span-3 h-[370px]" />
          <Skeleton className="lg:col-span-2 h-[370px]" />
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
