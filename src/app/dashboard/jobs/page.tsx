"use client";

import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { Job, Client } from "@/app/lib/types";
import { useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { useFirestore } from "@/firebase";
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
import { PlusCircle, MapPin, User } from "lucide-react";
import { JobActions } from "./components/job-actions";
import { Skeleton } from "@/components/ui/skeleton";

const JobsTable = ({ jobs, clients, isLoading }: { jobs: Job[] | null, clients: Client[] | null, isLoading: boolean }) => {
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
              const client = clients?.find((c) => c.id === job.clientId);
              const clientLastName = client?.name.split(" ").pop() || "N/A";
              const jobTitle = `${clientLastName} #${job.workOrderNumber}`;
              return (
                <TableRow key={job.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Link href={`/dashboard/jobs/${job.id}`}>
                      {client ? (
                        <Image
                          alt={client.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={client.avatarUrl}
                          width="64"
                          data-ai-hint="person portrait"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <User className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/dashboard/jobs/${job.id}`} className="font-bold hover:underline">
                      {jobTitle}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      {job.title}
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
                    ${job.budget.toLocaleString()}
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

export default function JobsPage() {
  const jobStatuses: Job["status"][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];
  const firestore = useFirestore();

  const clientsQuery = useMemoFirebase(() => {
    return collection(firestore, 'clients');
  }, [firestore]);
  const { data: clients, isLoading: isLoadingClients } = useCollection<Client>(clientsQuery);

  const jobsQueries = useMemoFirebase(() => {
    return jobStatuses.reduce((acc, status) => {
        acc[status] = query(collection(firestore, 'jobs'), where('status', '==', status));
        return acc;
    }, {} as Record<Job['status'], ReturnType<typeof query>>);
  }, [firestore]);

  const jobsData = {
    "Not Started": useCollection<Job>(jobsQueries["Not Started"]),
    "In Progress": useCollection<Job>(jobsQueries["In Progress"]),
    "Complete": useCollection<Job>(jobsQueries["Complete"]),
    "Open Payment": useCollection<Job>(jobsQueries["Open Payment"]),
    "Finalized": useCollection<Job>(jobsQueries["Finalized"]),
  };

  return (
    <div>
      <PageHeader title="My Jobs">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </PageHeader>
      <Tabs defaultValue="Not Started">
        <TabsList className="grid w-full grid-cols-5 mb-4">
            {jobStatuses.map(status => (
                 <TabsTrigger key={status} value={status}>{status}</TabsTrigger>
            ))}
        </TabsList>
        {jobStatuses.map(status => {
            const { data: filteredJobs, isLoading: isLoadingJobs } = jobsData[status];
            return(
                <TabsContent key={status} value={status}>
                    <JobsTable jobs={filteredJobs} clients={clients} isLoading={isLoadingJobs || isLoadingClients} />
                </TabsContent>
            )
        })}
      </Tabs>
    </div>
  );
}
