
'use client';

import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Job } from "@/app/lib/types";

import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

const ProjectItem = ({ job }: { job: Job }) => {
    const clientLastName = job.clientName?.split(" ").pop() || "N/A";
    const jobTitle = job.title || `${clientLastName} #${job.workOrderNumber}`;

    return (
        <Link href={`/dashboard/jobs/${job.id}`}>
            <div className="rounded-xl bg-white/70 p-4 border border-white/60 shadow-soft hover:bg-white/90 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium truncate">{jobTitle}</p>
                        </div>
                        <p className="text-sm text-zinc-700 mt-1">{job.clientName}</p>
                    </div>
                </div>
            </div>
        </Link>
    );
};

const ProjectList = ({ title, jobs }: { title: string, jobs: Job[] }) => (
    <div>
        <h4 className="font-semibold text-zinc-800 mb-2">{title}</h4>
        {jobs.length > 0 ? (
            <div className="space-y-3">
                {jobs.map(job => <ProjectItem key={job.id} job={job} />)}
            </div>
        ) : (
            <div className="rounded-xl bg-white/70 p-4 border border-white/60 shadow-soft text-center">
                <p className="text-sm text-zinc-500">Nenhum job com este status.</p>
            </div>
        )}
    </div>
);


export function RecentProjects() {
    const firestore = useFirestore();
    const { user } = useUser();

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'jobs'),
            where('status', 'in', ['In Progress', 'Not Started'])
        );
    }, [firestore, user]);

    const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

    const inProgressJobs = jobs?.filter(job => job.status === 'In Progress') ?? [];
    const notStartedJobs = jobs?.filter(job => job.status === 'Not Started') ?? [];

    return (
        <GlassCard>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Active Projects</h3>
                <Link href="/dashboard/jobs" className="text-sm text-zinc-700 hover:underline">
                    See all
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : (
                <div className="space-y-6">
                    <ProjectList title="In Progress" jobs={inProgressJobs} />
                    <Separator className="bg-white/50" />
                    <ProjectList title="Not Started" jobs={notStartedJobs} />
                </div>
            )}
        </GlassCard>
    );
}
