"use client";

import { useDoc, useCollection, useMemoFirebase } from "@/firebase";
import { doc, collection } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { notFound } from "next/navigation";
import { JobDetails } from "./components/job-details";
import type { Job, Client } from "@/app/lib/types";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const firestore = useFirestore();

  const jobRef = useMemoFirebase(() => doc(firestore, "jobs", id), [firestore, id]);
  const { data: job, isLoading: isLoadingJob } = useDoc<Job>(jobRef);
  
  const clientId = job?.clientId;

  const clientRef = useMemoFirebase(() => {
    if (!clientId) return undefined;
    return doc(firestore, "clients", clientId);
  }, [firestore, clientId]);
  const { data: client, isLoading: isLoadingClient } = useDoc<Client>(clientRef);

  if (isLoadingJob || isLoadingClient) {
    return <div>Loading...</div>; // TODO: Add a proper skeleton loader
  }

  if (!job) {
    notFound();
  }

  const clientLastName = client?.name.split(" ").pop() || "N/A";
  const jobTitle = `${clientLastName} #${job.workOrderNumber}`;

  return <JobDetails job={job} client={client} jobTitle={jobTitle} />;
}
