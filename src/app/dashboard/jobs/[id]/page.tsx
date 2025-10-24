"use client";

import { JobDetails } from "./components/job-details";
import type { Job, Client } from "@/app/lib/types";
import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !id) return null;
    return doc(firestore, "jobs", id);
  }, [firestore, id]);

  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);

  const clientRef = useMemoFirebase(() => {
    if (!firestore || !job?.clientId) return null;
    return doc(firestore, "clients", job.clientId);
  }, [firestore, job?.clientId]);

  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  const isLoading = isLoadingJob || isLoadingClient;

  if (isLoading) {
    return (
        <div className="p-4 sm:px-6 sm:py-0">
            <Skeleton className="h-10 w-64 mb-8" />
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 grid gap-6">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
                <div className="lg:col-span-1 grid gap-6">
                    <Skeleton className="h-24" />
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
        clientId: "N/A",
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
     const staticClient: Client = {
        id: 'client-not-found',
        name: "Unknown Client",
        phone: "N/A",
        email: "N/A",
        avatarUrl: ""
    }

    return <JobDetails job={staticJob} client={staticClient} jobTitle="Job Not Found" />;
  }
  
  const clientLastName = client?.name.split(" ").pop() || "N/A";
  const jobTitle = `${clientLastName} #${job.workOrderNumber}`;

  return <JobDetails job={job} client={client} jobTitle={jobTitle} />;
}
