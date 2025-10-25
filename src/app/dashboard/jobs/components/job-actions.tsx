
"use client";

import Link from "next/link";
import type { Job } from "@/app/lib/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

const statusSequence: Job['status'][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];

export function JobActions({ job }: { job: Job }) {
  const firestore = useFirestore();

  const handleStatusChange = (newStatus: Job["status"]) => {
    if (!firestore) return;

    let updatedData: Partial<Job> = { status: newStatus };

    // If marking as Complete, update deadline to today if it wasn't already completed/finalized
    if (newStatus === 'Complete' && !['Complete', 'Open Payment', 'Finalized'].includes(job.status)) {
        updatedData.deadline = new Date().toISOString();
    }

    const jobRef = doc(firestore, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, updatedData);
  }

  const getNextStatus = (): Job["status"] | null => {
    const currentIndex = statusSequence.indexOf(job.status);
    if (currentIndex === -1 || currentIndex >= statusSequence.length - 1) {
      return null; // No next status
    }
    return statusSequence[currentIndex + 1];
  }

  const nextStatus = getNextStatus();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-haspopup="true" size="icon" variant="ghost">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/dashboard/jobs/${job.id}`}>View Details</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
           <Link href={`/dashboard/jobs/${job.id}/edit`}>Edit</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {nextStatus && (
           <DropdownMenuItem onSelect={() => handleStatusChange(nextStatus)}>
            Mark as {nextStatus}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem>Send Invoice</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
