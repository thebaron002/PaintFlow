import { jobs, clients } from "@/app/lib/data";
import { notFound } from "next/navigation";
import { JobDetails } from "./components/job-details";
import type { Job } from "@/app/lib/types";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const job: Job | undefined = jobs.find((j) => j.id === id);

  if (!job) {
    notFound();
  }

  const client = clients.find((c) => c.id === job.clientId);
  const jobTitle = `${client?.name || "N/A"} #${job.workOrderNumber}`;

  return <JobDetails job={job} client={client} jobTitle={jobTitle} />;
}
