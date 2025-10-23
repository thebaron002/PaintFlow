"use client";

import { notFound } from "next/navigation";
import { JobDetails } from "./components/job-details";
import type { Job, Client } from "@/app/lib/types";
import { jobs as jobsData, clients as clientsData } from "@/app/lib/data";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const isLoading = false;

  // In a real app, you would fetch this data. Here we simulate it.
  const job = jobsData.find(j => j.id === id);
  const client = job ? clientsData.find(c => c.id === job.clientId) : undefined;
  
  if (isLoading) {
    return <div>Loading...</div>; // TODO: Add a proper skeleton loader
  }

  if (!job) {
    // If we still don't have a job, return a not found page.
    // This can happen if the ID is invalid.
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
