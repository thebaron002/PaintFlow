
"use client";

import { useState } from "react";
import type { Job } from "@/app/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { AddInvoiceForm } from "@/app/dashboard/jobs/[id]/components/add-invoice-form";
import { useToast } from "@/hooks/use-toast";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";

interface JobSelectionModalProps {
  jobs: Job[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function JobSelectionModal({ jobs, isOpen, onOpenChange }: JobSelectionModalProps) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  // This is needed to get all possible invoice origins for the combobox inside AddInvoiceForm
  const allJobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);

  const { data: allJobsData } = useCollection(allJobsQuery);
  const invoiceOrigins = [...new Set(allJobsData?.flatMap(j => j.invoices?.map(i => i.origin)).filter(Boolean) ?? [])];


  const handleSelectJob = (job: Job) => {
    setSelectedJob(job);
  };

  const handleInvoiceFormSuccess = () => {
    toast({
      title: "Invoice Added",
      description: `The invoice has been successfully added to job "${selectedJob?.title}".`,
    });
    setSelectedJob(null);
    onOpenChange(false);
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedJob(null);
      onOpenChange(false);
    }
  }

  const title = selectedJob ? selectedJob.title : "Select a Job";

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        {selectedJob ? (
          <AddInvoiceForm
            jobId={selectedJob.id}
            existingInvoices={selectedJob.invoices || []}
            origins={invoiceOrigins}
            onSuccess={handleInvoiceFormSuccess}
          />
        ) : (
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Search for a job..." />
            <CommandList>
              <CommandEmpty>No jobs found.</CommandEmpty>
              <CommandGroup>
                {jobs.map((job) => (
                  <CommandItem
                    key={job.id}
                    onSelect={() => handleSelectJob(job)}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span>{job.title}</span>
                      <span className="text-xs text-muted-foreground">{job.clientName} - {job.address}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  );
}
