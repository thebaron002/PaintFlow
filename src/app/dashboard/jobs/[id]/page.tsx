import { jobs, clients } from "@/app/lib/data";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
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
import { format } from "date-fns";
import {
  DollarSign,
  Calendar,
  User,
  MapPin,
  ListChecks,
  ArrowLeft,
  CalendarDays,
  Hash,
  Ruler,
  Paintbrush,
  CheckCircle,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  const client = clients.find((c) => c.id === job.clientId);
  const jobTitle = `${client?.name || "N/A"} #${job.workOrderNumber}`;

  return (
    <div>
      <PageHeader title={jobTitle}>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/jobs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Jobs
            </Link>
          </Button>
          <Button>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Job
          </Button>
        </div>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Client</p>
                  <p className="text-lg font-semibold">{client?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <p className="text-lg font-semibold">{job.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(job.startDate), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">End Date</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(job.deadline), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Financials</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payout</p>
                  <p className="text-lg font-semibold">${job.budget.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Initial Value</p>
                  <p className="text-lg font-semibold">${job.initialValue.toLocaleString()}</p>
                </div>
              </div>
               <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <Paintbrush className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ideal Material Cost</p>
                  <p className="text-lg font-semibold">${job.idealMaterialCost.toLocaleString()}</p>
                </div>
              </div>
               <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <CheckCircle className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fixed Pay</p>
                  <p className="text-lg font-semibold">{job.isFixedPay ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ideal Number of Days</p>
                  <p className="text-lg font-semibold">{job.idealNumberOfDays}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                  <ListChecks className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Production Days</p>
                   <div className="flex flex-wrap gap-1 mt-1">
                    {job.productionDays.map(day => (
                      <Badge key={day} variant="secondary">{format(new Date(day), "MMM dd")}</Badge>
                    ))}
                    {job.productionDays.length === 0 && <p className="text-sm text-muted-foreground">No days logged</p>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-2">
              <Badge className="capitalize text-lg px-4 py-2" variant="secondary">
                {job.status}
              </Badge>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {job.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>{format(new Date(invoice.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No invoices yet.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Adjustments</CardTitle>
            </CardHeader>
            <CardContent>
              {job.adjustments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>{adj.reason}</TableCell>
                        <TableCell className="text-right">${adj.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center">No adjustments.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
