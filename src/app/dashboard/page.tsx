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
import { jobs, clients } from "@/app/lib/data";
import { Briefcase, DollarSign, CalendarCheck, MapPin } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { RevenueChart } from "./components/revenue-chart";
import type { Job } from "@/app/lib/types";

export default function DashboardPage() {
  const now = new Date();
  const activeJobs = jobs.filter(job => job.status === 'In Progress').length;
  const totalRevenue = jobs.filter(job => job.status === 'Completed' || job.status === 'Invoiced').reduce((sum, job) => sum + job.budget, 0);
  
  const statusOrder: Job['status'][] = ['In Progress', 'Not Started'];
  const upcomingJobs = jobs
    .filter(job => job.status === 'In Progress' || job.status === 'Not Started')
    .sort((a, b) => {
      const statusA = statusOrder.indexOf(a.status);
      const statusB = statusOrder.indexOf(b.status);
      if (statusA !== statusB) {
        return statusA - statusB;
      }
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });


  const currentMonthStart = startOfMonth(now);
  const jobsCompletedThisMonth = jobs.filter(job => {
    const jobDate = new Date(job.deadline);
    return (job.status === 'Completed' || job.status === 'Invoiced') && isWithinInterval(jobDate, { start: currentMonthStart, end: now });
  }).length;
  
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));
  const jobsCompletedLastMonth = jobs.filter(job => {
    const jobDate = new Date(job.deadline);
    return (job.status === 'Completed' || job.status === 'Invoiced') && isWithinInterval(jobDate, { start: lastMonthStart, end: lastMonthEnd });
  }).length;

  const percentChange = jobsCompletedLastMonth > 0 ? ((jobsCompletedThisMonth - jobsCompletedLastMonth) / jobsCompletedLastMonth) * 100 : jobsCompletedThisMonth > 0 ? 100 : 0;


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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">+{activeJobs}</div>
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
            <div className="text-2xl font-bold">+{jobsCompletedThisMonth}</div>
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
                  {upcomingJobs.map(job => {
                      const client = clients.find(c => c.id === job.clientId);
                      const clientLastName = client?.name.split(" ").pop() || "N/A";
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
                    })}
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
