
"use client";

import { useState, useMemo } from "react";
import type { Job, GeneralSettings } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { calculateJobPayout } from "@/app/lib/job-financials";

interface FinalizePaymentsModalProps {
  jobs: Job[];
  settings: GeneralSettings | null;
  onSuccess: (count: number) => void;
}

export function FinalizePaymentsModal({ jobs, settings, onSuccess }: FinalizePaymentsModalProps) {
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [finalizationDate, setFinalizationDate] = useState<Date>(new Date());
  const firestore = useFirestore();
  const { user } = useUser();

  const handleToggleJob = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const selectedJobs = useMemo(
    () => jobs.filter((job) => selectedJobIds.includes(job.id)),
    [jobs, selectedJobIds]
  );

  const totalSelectedPayout = useMemo(
    () =>
      selectedJobs.reduce((sum, job) => sum + calculateJobPayout(job, settings), 0),
    [selectedJobs, settings]
  );

  const handleFinalize = async () => {
    if (!firestore || !user || selectedJobIds.length === 0) return;

    const batch = writeBatch(firestore);
    const finalizationDateISO = finalizationDate.toISOString();

    selectedJobIds.forEach((jobId) => {
      const jobRef = doc(firestore, "users", user.uid, "jobs", jobId);
      batch.update(jobRef, { 
          status: "Finalized",
          finalizationDate: finalizationDateISO
      });
    });

    try {
      await batch.commit();
      onSuccess(selectedJobIds.length);
    } catch (error) {
      console.error("Failed to finalize payments:", error);
      // You might want to show a toast error here
    }
  };
  
  const handleSelectAll = () => {
    if (selectedJobIds.length === jobs.length) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map(j => j.id));
    }
  }

  return (
    <div className="grid gap-6 py-4">
      <div className="grid gap-4">
        <h4 className="font-medium text-lg">Jobs with Open Payment</h4>
        <div className="flex items-center space-x-2">
            <Checkbox
              id="select-all"
              checked={selectedJobIds.length > 0 && selectedJobIds.length === jobs.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-medium">
              Select All ({jobs.length})
            </Label>
          </div>
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <div className="space-y-4">
            {jobs.map((job) => {
              const payout = calculateJobPayout(job, settings);
              return (
                <div
                  key={job.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id={job.id}
                      checked={selectedJobIds.includes(job.id)}
                      onCheckedChange={() => handleToggleJob(job.id)}
                    />
                    <Label
                      htmlFor={job.id}
                      className="cursor-pointer"
                    >
                      <div className="font-medium">{job.title || `${job.clientName} #${job.quoteNumber}`}</div>
                      <div className="text-sm text-muted-foreground">{job.clientName}</div>
                    </Label>
                  </div>
                  <div className="font-semibold">${payout.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <div className="flex flex-col gap-2">
          <Label>Finalization Date</Label>
          <ResponsiveDatePicker
            value={finalizationDate}
            onChange={(date) => date && setFinalizationDate(date)}
          />
        </div>
        <div className="rounded-lg border bg-secondary/50 p-4 text-right">
          <Label className="text-muted-foreground">Total Payout</Label>
          <div className="text-2xl font-bold">
            ${totalSelectedPayout.toLocaleString()}
          </div>
        </div>
      </div>

      <Button
        onClick={handleFinalize}
        disabled={selectedJobIds.length === 0}
        className="w-full"
      >
        Finalize {selectedJobIds.length} Job(s)
      </Button>
    </div>
  );
}

