
"use client";

import { useParams } from 'next/navigation';
import { JobDetails } from "./components/job-details";
import type { Job } from "@/app/lib/types";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "jobs", id);
  }, [firestore, id]);

  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);

  if (isLoadingJob) {
    return (
        <div className="p-4 sm:px-6 sm:py-0">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 grid gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                <div className="lg:col-span-1 grid gap-6">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-40" />
                    <Skeleton className="h-40" />
                </div>
            </div>
      </div>
    );
  }

  if (!job) {
     const staticJob: Job = {
        id: 'job-not-found',
        title: "Job Not Found",
        workOrderNumber: "N/A",
        address: "N/A",
        clientName: "N/A",
        startDate: new Date().toISOString(),
        deadline: new Date().toISOString(),
        specialRequirements: "N/A",
        status: "Not Started",
        budget: 0,
        initialValue: 0,
        idealMaterialCost: 0,
        idealNumberOfDays: 0,
        productionDays: [],
        isFixedPay: false,
        invoices: [],
        adjustments: []
    }

    return <JobDetails job={staticJob} jobTitle="Job Not Found" />;
  }
  
  const clientLastName = (job.clientName || "").split(" ").pop() || "N/A";
  const jobTitle = `${clientLastName} #${job.workOrderNumber}`;

  return <JobDetails job={job} jobTitle={jobTitle} />;
}
