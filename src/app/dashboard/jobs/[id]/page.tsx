import { jobs, clients } from "@/app/lib/data";
import type { Job } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { DollarSign, Calendar, User, MapPin, ListChecks, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function JobDetailsPage({ params }: { params: { id: string } }) {
  const job = jobs.find((j) => j.id === params.id);

  if (!job) {
    notFound();
  }

  const client = clients.find((c) => c.id === job.clientId);

  return (
    <div>
      <PageHeader title={job.title}>
        <Button variant="outline" asChild>
          <Link href="/dashboard/jobs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-6">
           <Card>
            <CardHeader>
              <CardTitle>Job Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                    <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-lg font-semibold">{client?.name || "N/A"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="bg-muted p-2 rounded-md">
                    <MapPin className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-lg font-semibold">{job.address}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                 <div className="bg-muted p-2 rounded-md">
                    <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-lg font-semibold">
                    {format(new Date(job.deadline), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-muted p-2 rounded-md">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Budget</p>
                  <p className="text-lg font-semibold">${job.budget.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Special Requirements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {job.specialRequirements || "None specified."}
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card>
             <CardHeader>
                <CardTitle>Job Status</CardTitle>
             </CardHeader>
             <CardContent className="flex flex-col items-center justify-center gap-4">
                <Badge className="capitalize text-lg px-4 py-2" variant="secondary">{job.status}</Badge>
                <p className="text-sm text-muted-foreground">Status of the current job</p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
