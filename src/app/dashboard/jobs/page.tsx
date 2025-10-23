import Image from "next/image";
import { format } from "date-fns";
import type { Job } from "@/app/lib/types";
import { jobs, clients } from "@/app/lib/data";
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

const JobsTable = ({ jobs }: { jobs: Job[] }) => (
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
            <TableHead className="hidden md:table-cell">Budget</TableHead>
            <TableHead className="hidden md:table-cell">Deadline</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const client = clients.find((c) => c.id === job.clientId);
            return (
              <TableRow key={job.id}>
                <TableCell className="hidden sm:table-cell">
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
                </TableCell>
                <TableCell className="font-medium">
                  <div className="font-bold">{job.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {client?.name || "N/A"}
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
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default function JobsPage() {
  const jobStatuses: Job["status"][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];

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
            const filteredJobs = jobs.filter(job => job.status === status);
            return(
                <TabsContent key={status} value={status}>
                    <JobsTable jobs={filteredJobs} />
                </TabsContent>
            )
        })}
      </Tabs>
    </div>
  );
}
