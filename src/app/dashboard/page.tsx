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
import { format } from 'date-fns';

export default function DashboardPage() {
  const activeJobs = jobs.filter(job => job.status === 'In Progress' || job.status === 'Pending').length;
  const totalRevenue = jobs.filter(job => job.status === 'Completed' || job.status === 'Invoiced').reduce((sum, job) => sum + job.budget, 0);
  const recentJobs = [...jobs].sort((a, b) => new Date(b.deadline).getTime() - new Date(a.deadline).getTime()).slice(0, 5);

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
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Updates on job assignments and completions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Job Assigned</p>
                <p className="text-sm text-muted-foreground">"Modern Kitchen Repaint" assigned to Jake's Painting Co.</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">5m ago</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Job Completed</p>
                <p className="text-sm text-muted-foreground">"Exterior Fence Staining" marked as complete.</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">1h ago</div>
            </div>
            <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Expense Logged</p>
                <p className="text-sm text-muted-foreground">$250 for "Sherwin-Williams Emerald" paint.</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">2h ago</div>
            </div>
             <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">Job Invoiced</p>
                <p className="text-sm text-muted-foreground">Invoice sent for "Living Room Accent Wall".</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">1d ago</div>
            </div>
             <div className="flex items-center gap-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium leading-none">New Subcontractor</p>
                <p className="text-sm text-muted-foreground">"Anna's Fine Finishes" added to the team.</p>
              </div>
              <div className="ml-auto text-sm text-muted-foreground">2d ago</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
