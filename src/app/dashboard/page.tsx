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
import { jobs } from "@/app/lib/data";
import { Briefcase, DollarSign, CalendarCheck, Users } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { RevenueChart } from "./components/revenue-chart";

export default function DashboardPage() {
  const now = new Date();
  const activeJobs = jobs.filter(job => job.status === 'In Progress' || job.status === 'Pending').length;
  const totalRevenue = jobs.filter(job => job.status === 'Completed' || job.status === 'Invoiced').reduce((sum, job) => sum + job.budget, 0);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 5);

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
              Pending or in progress
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
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden sm:table-cell">Job</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map(job => {
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.clientName}</div>
                          
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                         <div className="font-medium">{job.title}</div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant={job.status === 'Completed' ? 'secondary' : 'default'} className="capitalize">
                            {job.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{format(new Date(job.deadline), 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    );
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
