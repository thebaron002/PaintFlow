
"use client";

import { useParams } from 'next/navigation';
import { JobDetails } from "./components/job-details";
import type { Job, CrewMember } from "@/app/lib/types";
import { useDoc, useFirestore, useMemoFirebase, useCollection, useUser } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";

export default function JobDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, "users", user.uid, "jobs", id);
  }, [firestore, user, id]);

  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);
  
  const crewRef = useMemoFirebase(() => {
    if(!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'crew');
  }, [firestore, user]);
  const { data: allCrew, isLoading: isLoadingCrew } = useCollection<CrewMember>(crewRef);

  const isLoading = isLoadingJob || isLoadingCrew;

  if (isLoading) {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-64" />
            </div>
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
        quoteNumber: "N/A",
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
        adjustments: [],
        crew: [],
    }

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <JobDetails job={staticJob} allCrew={[]} jobTitle="Job Not Found" />
      </div>
    );
  }
  
  const clientLastName = (job.clientName || "").split(" ").pop() || "N/A";
  const jobTitle = job.title || `${clientLastName} #${job.quoteNumber}`;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <JobDetails job={job} allCrew={allCrew || []} jobTitle={jobTitle} />
    </div>
  );
}
