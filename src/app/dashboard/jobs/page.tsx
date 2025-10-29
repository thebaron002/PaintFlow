
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Job } from "@/app/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Search } from "lucide-react";
import { JobCard } from "./_components/job-card";
import { Skeleton } from "@/components/ui/skeleton";

type JobStatus = Job['status'];

const statusOrder: JobStatus[] = ["In Progress", "Not Started", "Open Payment", "Complete", "Finalized"];

const filters: { label: string; value: JobStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Not Started", value: "Not Started" },
  { label: "In Progress", value: "In Progress" },
  { label: "Complete", value: "Complete" },
  { label: "Open Payment", value: "Open Payment" },
  { label: "Finalized", value: "Finalized" },
];

export default function MyJobsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [activeFilter, setActiveFilter] = useState<JobStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  const filteredAndSortedJobs = useMemo(() => {
    if (!jobs) return [];

    const filtered = jobs
      .filter(job => {
        // Filter by status
        const statusMatch = activeFilter === 'all' || job.status === activeFilter;
        if (!statusMatch) return false;

        // Filter by search term
        if (searchTerm) {
          const lowerCaseSearch = searchTerm.toLowerCase();
          const clientNameMatch = job.clientName.toLowerCase().includes(lowerCaseSearch);
          const addressMatch = job.address.toLowerCase().includes(lowerCaseSearch);
          const titleMatch = job.title?.toLowerCase().includes(lowerCaseSearch);
          const workOrderMatch = job.workOrderNumber?.toLowerCase().includes(lowerCaseSearch);
          
          return clientNameMatch || addressMatch || titleMatch || workOrderMatch;
        }

        return true;
      });

      // Sort the filtered jobs
      return filtered.sort((a, b) => {
        // Sort by status first
        const statusIndexA = statusOrder.indexOf(a.status);
        const statusIndexB = statusOrder.indexOf(b.status);
        if (statusIndexA !== statusIndexB) {
          return statusIndexA - statusIndexB;
        }
        // If statuses are the same, sort by start date (newest first)
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });

  }, [jobs, activeFilter, searchTerm]);

  return (
    <div className="min-h-full w-full bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 sm:p-8 rounded-2xl flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Jobs</h1>
          <p className="text-gray-500 text-sm">
            Gerencie seus trabalhos, status e pagamentos.
          </p>
        </div>
        <Link href="/dashboard/jobs/new" className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white font-medium shadow hover:bg-gray-800 transition-colors">
          <Plus size={18} /> New Job
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-start gap-2 sm:gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full border transition-colors",
              activeFilter === filter.value
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Campo de busca */}
      <div className="mb-6 relative">
         <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search job, client or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all"
        />
      </div>

      {/* Cards de Jobs */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : filteredAndSortedJobs.length > 0 ? (
        <div className="flex flex-col gap-4">
            {filteredAndSortedJobs.map(job => (
                <JobCard key={job.id} job={job} />
            ))}
        </div>
      ) : (
         <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-5 bg-white rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800">No Jobs Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                    No jobs match the current filter and search term.
                </p>
            </div>
        </div>
      )}
    </div>
  );
}

    