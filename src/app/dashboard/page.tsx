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
import { jobs, subcontractors } from "@/app/lib/data";
import { Briefcase, DollarSign, CalendarCheck } from "lucide-react";
import { format, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

export default function DashboardPage() {
  const now = new Date();
  const activeJobs = jobs.filter(job => job.status === 'In Progress' || job.status === 'Pending').length;
  const totalRevenue = jobs.filter(job => job.status === 'Completed' || job.status === 'Invoiced').reduce((sum, job) => sum + job.budget, 0);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 5);

  const lastWeekStart = startOfWeek(subWeeks(now, 1));
  const lastWeekEnd = endOfWeek(subWeeks(now, 1));
  const lastWeekRevenue = jobs
    .filter(job => {
      const jobDate = new Date(job.deadline);
      return (job.status === 'Completed' || job.status === 'Invoiced') && isWithinInterval(jobDate, { start: lastWeekStart, end: lastWeekEnd });
    })
    .reduce((sum, job) => sum + job.budget, 0);

  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const currentMonthForecast = jobs
    .filter(job => {
        const jobDate = new Date(job.deadline);
        return isWithinInterval(jobDate, { start: currentMonthStart, end: currentMonthEnd });
    })
    .reduce((sum, job) => sum + job.budget, 0);
    
  const futureScheduledValue = jobs
    .filter(job => new Date(job.deadline) > currentMonthEnd)
    .reduce((sum, job) => sum + job.budget, 0);

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
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">
              +15.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden sm:table-cell">Subcontractor</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="text-right">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentJobs.map(job => {
                    const subcontractor = subcontractors.find(s => s.id === job.subcontractorId);
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <div className="font-medium">{job.clientName}</div>
                          <div className="hidden text-sm text-muted-foreground md:inline">
                            {job.title}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{subcontractor?.name || 'Unassigned'}</TableCell>
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
            <CardTitle>Financial Summary</CardTitle>
            <CardDescription>
              A quick overview of your financial status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Last Week's Revenue</p>
                <p className="text-sm text-muted-foreground">Income from completed jobs.</p>
              </div>
              <div className="text-lg font-bold text-green-600">${lastWeekRevenue.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">This Month's Forecast</p>
                <p className="text-sm text-muted-foreground">Potential income from all jobs this month.</p>
              </div>
              <div className="text-lg font-bold">${currentMonthForecast.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Future Scheduled</p>
                <p className="text-sm text-muted-foreground">Value of jobs beyond this month.</p>
              </div>
              <div className="text-lg font-bold">${futureScheduledValue.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}