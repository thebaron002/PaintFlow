
"use client";

import { useState } from "react";
import Image from "next/image";
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
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, User, Upload } from "lucide-react";
import { JobActions } from "@/app/dashboard/job-actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, doc } from "firebase/firestore";


const JobsTable = ({ jobs, isLoading, hourlyRate }: { jobs: Job[] | null, isLoading: boolean, hourlyRate: number }) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Job Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Payout</TableHead>
                <TableHead className="hidden md:table-cell">Deadline</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="hidden sm:table-cell">
                    <Skeleton className="w-16 h-16 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-40 mt-1" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Skeleton className="h-5 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Job Details</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Payout</TableHead>
              <TableHead className="hidden md:table-cell">Deadline</TableHead>
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
                <TableRow key={job.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                        <User className="w-8 h-8 text-muted-foreground" />
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-bold hover:underline">
                      {jobTitle}
                    </Link>
                    <div className="text-xs text-muted-foreground pt-1">
                      <span className="font-semibold">Client:</span> {job.clientName}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center pt-1">
                      <MapPin className="w-3 h-3 mr-1" /> {job.address}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`capitalize`}>
                      {job.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    ${remainingPayout.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {format(new Date(job.deadline), "MMMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <JobActions job={job} />
                  </TableCell>
                </TableRow>
              );
            })}
             {jobs?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        No jobs with this status.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
};

const JobsTabContent = ({ status, hourlyRate }: { status: Job["status"], hourlyRate: number }) => {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'jobs'), where('status', '==', status));
  }, [firestore, user, status]);

  const { data: filteredJobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
  
  return (
    <TabsContent value={status}>
      <JobsTable jobs={filteredJobs} isLoading={isLoadingJobs} hourlyRate={hourlyRate} />
    </TabsContent>
  );
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
  
  return (
    <div>
      <PageHeader title="My Jobs">
        <div className="flex items-center gap-2">
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Migrate Jobs
            </Button>
            <Button asChild>
                <Link href="/dashboard/jobs/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Job
                </Link>
            </Button>
        </div>
      </PageHeader>
      <Tabs defaultValue="Not Started">
        <TabsList className="grid w-full grid-cols-5 mb-4">
            {jobStatuses.map(status => (
                 <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
            ))}
        </TabsList>
        {jobStatuses.map(status => (
          <JobsTabContent key={status} status={status} hourlyRate={hourlyRate} />
        ))}
      </Tabs>
    </div>
  );
}
