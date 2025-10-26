
"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import type { Job } from "@/app/lib/types";
import { Briefcase, DollarSign, CalendarCheck, MapPin } from "lucide-react";
import { RevenueChart } from "./components/revenue-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { isThisMonth, isAfter, parseISO } from "date-fns";


export default function DashboardPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);


  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
  const isLoading = isLoadingJobs;

  const totalRevenue = jobs
    ?.filter(job => job.status === 'Complete' || job.status === 'Finalized')
    .reduce((sum, job) => sum + job.budget, 0) || 0;

  const activeJobs = jobs?.filter(job => job.status === 'In Progress') || [];

  const jobsCompletedThisMonth = jobs?.filter(job => {
    const jobDate = typeof job.deadline === 'string' ? parseISO(job.deadline) : (job.deadline as unknown as Timestamp).toDate();
    return (job.status === 'Complete' || job.status === 'Finalized') && isThisMonth(jobDate);
  }).length || 0;

  // For now, percent change is a placeholder
  const percentChange = 0; 
  
  const upcomingJobs = jobs
    ?.filter(job => job.status === 'Not Started' || job.status === 'In Progress')
    .sort((a, b) => {
        const dateA = typeof a.deadline === 'string' ? parseISO(a.deadline) : (a.deadline as unknown as Timestamp).toDate();
        const dateB = typeof b.deadline === 'string' ? parseISO(b.deadline) : (b.deadline as unknown as Timestamp).toDate();
        return dateA.getTime() - dateB.getTime();
    })
    .slice(0, 5) || [];


  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-32" /> : <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>}
            <p className="text-xs text-muted-foreground">
              Based on completed jobs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{activeJobs?.length ?? 0}</div>}
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">+{jobsCompletedThisMonth}</div>}
            <p className="text-xs text-muted-foreground">
              {percentChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Your most recent and upcoming jobs.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden sm:table-cell">Address</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Payout</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : upcomingJobs?.length > 0 ? (
                    upcomingJobs.map(job => {
                      const clientLastName = job.clientName.split(" ").pop() || "N/A";
                      const jobTitle = `${clientLastName} #${job.workOrderNumber}`;
                      return (
                        <TableRow key={job.id}>
                          <TableCell>
                            <Link href={`/dashboard/jobs/${job.id}`} className="font-medium hover:underline">
                              {jobTitle}
                            </Link>
                             <div className="text-sm text-muted-foreground">{job.title}</div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <a 
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="flex items-center hover:underline"
                            >
                              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                              {job.address}
                            </a>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="capitalize">
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">${job.budget.toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No upcoming jobs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              A summary of your revenue and forecasts.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
