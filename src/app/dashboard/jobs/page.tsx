"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import type { Job as JobType } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import { JobCard } from "./_components/job-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS: { key: JobType['status'] | 'all', label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Not Started', label: 'Not Started' },
  { key: 'In Progress', label: 'In Progress' },
  { key: 'Complete', label: 'Complete' },
  { key: 'Open Payment', label: 'Open Payment' },
  { key: 'Finalized', label: 'Finalized' },
] as const;


export default function JobsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('all');
  const [q, setQ] = useState("");
  const firestore = useFirestore();
  const { user } = useUser();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "users", user.uid, "jobs");
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<JobType>(jobsQuery);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    const byTab = (j: JobType) => {
      if (tab === 'all') return true;
      return j.status === tab;
    };
    
    const byQuery = (j: JobType) => {
      const searchTerm = q.toLowerCase();
      return (
        j.title?.toLowerCase().includes(searchTerm) ||
        j.clientName?.toLowerCase().includes(searchTerm) ||
        j.address?.toLowerCase().includes(searchTerm) ||
        j.workOrderNumber?.toLowerCase().includes(searchTerm)
      );
    };

    return jobs.filter(byTab).filter(byQuery);
  }, [jobs, tab, q]);

  return (
    <div className="pt-2 sm:pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] px-4 sm:px-6 max-w-6xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">My Jobs</h1>
          <p className="text-muted-foreground text-sm">Gerencie seus trabalhos, status e pagamentos.</p>
        </div>

        <div className="flex sm:justify-end">
          <Button asChild size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/dashboard/jobs/new"><Plus /> New Job</Link>
          </Button>
        </div>
      </div>

       {/* Tabs: roláveis no mobile */}
      <div className="mt-4">
        <Tabs value={tab} onValueChange={(v: any) => setTab(v)} className="w-full">
          <TabsList
            className="flex flex-wrap h-auto justify-start
              bg-transparent p-0 gap-2
            "
          >
            {TABS.map(t => (
                 <TabsTrigger
                    key={t.key}
                    value={t.key}
                    onClick={() => setTab(t.key)}
                    className="
                      shrink-0 rounded-full px-4 py-2 text-sm font-medium
                      bg-white/70 backdrop-blur border border-black/10
                      data-[state=active]:bg-black data-[state=active]:text-white
                      data-[state=active]:border-black
                    "
                >
                    {t.label}
                </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      
        {/* Search */}
        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search job, client or address..."
              className="pl-9 h-11 w-full"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      
      {/* Lista de cards */}
      <div className="flex-1 overflow-y-auto mt-4 sm:mt-6 -mx-4 px-4">
        <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
                [...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)
            ) : filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
                ))
            ) : (
                <div className="text-center py-16">
                <p className="text-muted-foreground">No jobs found for the selected filter.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
