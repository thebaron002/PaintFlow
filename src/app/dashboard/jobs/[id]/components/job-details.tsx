
"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
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
  Paintbrush,
  CheckCircle,
  Pencil,
  ChevronDown,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Job } from "@/app/lib/types";
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { AddInvoiceForm } from "./add-invoice-form";
import { useToast } from "@/hooks/use-toast";

export function JobDetails({
  job,
  jobTitle,
}: {
  job: Job;
  jobTitle: string;
}) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [currentStatus, setCurrentStatus] = useState<Job["status"]>(job.status);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const jobStatuses: Job["status"][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'jobs');
  }, [firestore]);
  const { data: allJobs } = useCollection<Job>(jobsQuery);
  const invoiceOrigins = [...new Set(allJobs?.flatMap(j => j.invoices?.map(i => i.origin)).filter(Boolean) ?? [])];


  useEffect(() => {
    setCurrentStatus(job.status);
  }, [job.status]);
  
  const handleStatusChange = (newStatus: Job["status"]) => {
    if (!firestore || newStatus === currentStatus) return;
    
    let updatedData: Partial<Job> = { status: newStatus };

    if (newStatus === 'Complete' && job.status !== 'Complete' && job.status !== 'Open Payment' && job.status !== 'Finalized') {
        updatedData.deadline = new Date().toISOString();
    }
    
    setCurrentStatus(newStatus); 

    const jobRef = doc(firestore, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, updatedData);
  }

  const handleInvoiceAdded = () => {
    setIsInvoiceFormOpen(false);
    toast({
        title: "Invoice Added",
        description: "The new invoice has been added to this job.",
    });
  };

  const getEndDateDisplay = () => {
    switch(job.status) {
      case 'Not Started':
        return 'Not Started';
      case 'In Progress':
        return 'In Progress';
      case 'Complete':
      case 'Open Payment':
      case 'Finalized':
        return format(new Date(job.deadline), "MMMM dd, yyyy");
      default:
        return 'N/A';
    }
  };
  
  const totalInvoiced = job.invoices?.reduce((sum, invoice) => sum + invoice.amount, 0) ?? 0;
  const remainingPayout = job.budget - totalInvoiced;

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
          <Button asChild>
            <Link href={`/dashboard/jobs/${job.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Job
            </Link>
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
                  <p className="text-lg font-semibold">{job.clientName || "N/A"}</p>
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
                    {getEndDateDisplay()}
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
                  <p className="text-sm font-medium text-muted-foreground">Remaining Payout</p>
                  <p className="text-lg font-semibold">${remainingPayout.toLocaleString()}</p>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full capitalize">
                    {currentStatus}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  {jobStatuses.map((s) => (
                    <DropdownMenuItem key={s} onSelect={() => handleStatusChange(s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Invoices</CardTitle>
               <Dialog open={isInvoiceFormOpen} onOpenChange={setIsInvoiceFormOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Invoice</DialogTitle>
                    </DialogHeader>
                    <AddInvoiceForm 
                        jobId={job.id}
                        existingInvoices={job.invoices}
                        origins={invoiceOrigins}
                        onSuccess={handleInvoiceAdded} 
                    />
                </DialogContent>
            </Dialog>
            </CardHeader>
            <CardContent>
              {job.invoices.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Origin</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {job.invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                            <div className="font-medium">{invoice.origin}</div>
                            {invoice.notes && <div className="text-xs text-muted-foreground">{invoice.notes}</div>}
                        </TableCell>
                        <TableCell>{format(new Date(invoice.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">${invoice.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No invoices yet.</p>
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
