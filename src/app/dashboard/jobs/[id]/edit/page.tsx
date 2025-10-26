
"use client";

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { EditJobForm } from "./components/edit-job-form";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function EditJobPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, "users", user.uid, "jobs", id);
  }, [firestore, user, id]);

  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);
  
  const clientLastName = (job?.clientName || "").split(" ").pop() || "N/A";
  const jobTitle = job ? `${clientLastName} #${job.workOrderNumber}` : "Edit Job";

  const handleSuccess = () => {
    router.push(`/dashboard/jobs/${id}`);
  };

  if (isLoadingJob) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!job) {
    return (
      <div>
        <PageHeader title="Job not found" />
        <p>This job could not be found. It may have been deleted.</p>
        <Button variant="outline" asChild className="mt-4">
            <Link href="/dashboard/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Edit: ${jobTitle}`}>
         <Button variant="outline" asChild>
            <Link href={`/dashboard/jobs/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Link>
          </Button>
      </PageHeader>
      <EditJobForm job={job} onSuccess={handleSuccess} />
    </div>
  );
}
