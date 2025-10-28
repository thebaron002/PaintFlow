
'use client';

import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import type { Job } from "@/app/lib/types";

import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

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

export function CompletedProjects() {
    const firestore = useFirestore();
    const { user } = useUser();

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(
            collection(firestore, 'users', user.uid, 'jobs'),
            where('status', '==', 'Complete')
        );
    }, [firestore, user]);

    const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

    return (
        <GlassCard className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Completed Projects</h3>
                 <Link href="/dashboard/jobs" className="text-sm text-zinc-700 hover:underline">
                    See all
                </Link>
            </div>
             {isLoading ? (
                <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            ) : jobs && jobs.length > 0 ? (
                <div className="space-y-3">
                    {jobs.map(job => <ProjectItem key={job.id} job={job} />)}
                </div>
            ) : (
                 <div className="h-48 rounded-xl bg-white/70 border border-white/60 shadow-soft grid place-items-center">
                    <p className="text-zinc-700">No completed jobs found.</p>
                </div>
            )}
        </GlassCard>
    );
}
