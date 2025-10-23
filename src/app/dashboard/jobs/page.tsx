import Image from "next/image";
import { format } from "date-fns";
import { jobs, subcontractors } from "@/app/lib/data";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, MapPin, Briefcase } from "lucide-react";
import { JobActions } from "./components/job-actions";

export default function JobsPage() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return "default";
      case "In Progress":
        return "secondary";
      case "Completed":
        return "outline";
      case "Invoiced":
        return "destructive"; // Let's reuse for a different look
      default:
        return "default";
    }
  };

  return (
    <div>
      <PageHeader title="Job Assignments">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Job
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Jobs</CardTitle>
          <CardDescription>
            Manage job assignments for your subcontractors.
          </CardDescription>
        </CardHeader>
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
                const subcontractor = subcontractors.find(
                  (s) => s.id === job.subcontractorId
                );
                return (
                  <TableRow key={job.id}>
                    <TableCell className="hidden sm:table-cell">
                      {subcontractor ? (
                        <Image
                          alt={subcontractor.name}
                          className="aspect-square rounded-md object-cover"
                          height="64"
                          src={subcontractor.avatarUrl}
                          width="64"
                          data-ai-hint="person portrait"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
                          <Briefcase className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="font-bold">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {subcontractor?.name || "Unassigned"}
                      </div>
                       <div className="text-xs text-muted-foreground flex items-center pt-1">
                        <MapPin className="w-3 h-3 mr-1"/> {job.address}
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
    </div>
  );
}
