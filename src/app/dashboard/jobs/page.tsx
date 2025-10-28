
"use client";

import Link from "next/link";
import { format } from "date-fns";
import type { Job, GeneralSettings } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GlassCard } from "@/components/ui/glass-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, User } from "lucide-react";
import { JobActions } from "@/app/dashboard/job-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";


const JobsTable = ({ jobs, isLoading, hourlyRate }: { jobs: Job[] | null, isLoading: boolean, hourlyRate: number }) => {
  if (isLoading) {
    return (
      <GlassCard className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10">
                <TableHead className="hidden w-[100px] sm:table-cell text-white/80">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead className="text-white/80">Job Details</TableHead>
                <TableHead className="text-white/80">Status</TableHead>
                <TableHead className="hidden md:table-cell text-white/80">Payout</TableHead>
                <TableHead className="hidden md:table-cell text-white/80">Deadline</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-white/10">
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="w-16 h-16 rounded-md bg-white/10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32 mb-1 bg-white/20" />
                    <Skeleton className="h-4 w-48 bg-white/10" />
                    <Skeleton className="h-3 w-40 mt-1 bg-white/10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full bg-white/10" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-20 bg-white/10" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-28 bg-white/10" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 bg-white/10" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
      </GlassCard>
    )
  }

  return (
    <GlassCard className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b-white/10 hover:bg-white/5">
              <TableHead className="hidden w-[100px] sm:table-cell text-white/80">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead className="text-white/80">Job Details</TableHead>
              <TableHead className="text-white/80">Status</TableHead>
              <TableHead className="hidden md:table-cell text-white/80">Payout</TableHead>
              <TableHead className="hidden md:table-cell text-white/80">Deadline</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs?.map((job) => {
              const clientLastName = job.clientName.split(" ").pop() || "N/A";
              const generatedTitle = `${clientLastName} #${job.workOrderNumber}`;
              const jobTitle = job.title || generatedTitle;

              const totalInvoiced = job.invoices?.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;
              const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
                if (adj.type === 'Time') {
                  const rate = adj.hourlyRate ?? hourlyRate;
                  return sum + (adj.value * rate);
                }
                return sum + adj.value;
              }, 0) ?? 0;

              const totalDiscountedFromPayout = job.invoices
                ?.filter(inv => inv.isPayoutDiscount)
                .reduce((sum, inv) => sum + inv.amount, 0) ?? 0;

              const remainingPayout = job.isFixedPay 
                ? (job.initialValue || 0) + totalAdjustments - totalDiscountedFromPayout
                : (job.budget || 0) - totalInvoiced + totalAdjustments;

              return (
                <TableRow key={job.id} className="border-b-white/10 hover:bg-white/5">
                  <TableCell className="hidden sm:table-cell">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <div className="w-16 h-16 bg-white/10 rounded-md flex items-center justify-center">
                        <User className="w-8 h-8 text-white/30" />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-bold hover:underline">
                      {jobTitle}
                    </Link>
                    <div className="text-xs text-white/60 pt-1">
                      <span className="font-semibold">Client:</span> {job.clientName}
                    </div>
                    <div className="text-xs text-white/60 flex items-center pt-1">
                      <MapPin className="w-3 h-3 mr-1" /> {job.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize bg-white/15 text-white border-white/20">
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-white/90">
                    ${remainingPayout.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-white/70">
                    {format(new Date(job.deadline), "MMMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <JobActions job={job} />
                  </TableCell>
                </TableRow>
              );
            })}
             {jobs?.length === 0 && (
                <TableRow className="border-b-white/10 hover:bg-white/5">
                    <TableCell colSpan={6} className="h-24 text-center text-white/70">
                        No jobs with this status.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
    </GlassCard>
  )
};


export default function JobsPage() {
  const jobStatuses: Job["status"][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];
  const firestore = useFirestore();
  const { user } = useUser();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "global");
  }, [firestore]);
  const { data: settings } = useDoc<GeneralSettings>(settingsRef);
  const hourlyRate = settings?.hourlyRate ?? 0;

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);

  const { data: allJobs, isLoading } = useCollection<Job>(jobsQuery);

  const jobsByStatus = {
    "Not Started": allJobs?.filter(j => j.status === 'Not Started') || [],
    "In Progress": allJobs?.filter(j => j.status === 'In Progress') || [],
    "Complete": allJobs?.filter(j => j.status === 'Complete') || [],
    "Open Payment": allJobs?.filter(j => j.status === 'Open Payment') || [],
    "Finalized": allJobs?.filter(j => j.status === 'Finalized') || [],
  };
  
  return (
    <div>
      <PageHeader title="My Jobs">
        <div className="flex items-center gap-2">
            <Button asChild>
                <Link href="/dashboard/jobs/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Job
                </Link>
            </Button>
        </div>
      </PageHeader>
      <Tabs defaultValue="Not Started">
        <TabsList className="grid w-full grid-cols-5 mb-4 bg-white/10 text-white/70">
            {jobStatuses.map(status => (
                 <TabsTrigger key={status} value={status} className="data-[state=active]:bg-white/20 data-[state=active]:text-white">{status}</TabsTrigger>
            ))}
        </TabsList>
        {jobStatuses.map(status => (
          <TabsContent key={status} value={status}>
            <JobsTable jobs={jobsByStatus[status]} isLoading={isLoading} hourlyRate={hourlyRate} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
