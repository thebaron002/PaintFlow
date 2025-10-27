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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal } from "lucide-react";
import { useFirestore, updateDocumentNonBlocking, deleteDocumentNonBlocking, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { format } from "date-fns";

const statusSequence: Job['status'][] = ["Not Started", "In Progress", "Complete", "Open Payment", "Finalized"];

export function JobActions({ job }: { job: Job }) {
  const firestore = useFirestore();
  const { user } = useUser();

  const handleStatusChange = (newStatus: Job["status"]) => {
    if (!firestore || !user) return;

    let updatedData: Partial<Job> = { status: newStatus };

    // If marking as Complete, update deadline to today if it wasn't already completed/finalized
    if (newStatus === 'Complete' && !['Complete', 'Open Payment', 'Finalized'].includes(job.status)) {
        updatedData.deadline = new Date().toISOString();
    }

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, updatedData);
  }

  const handleDelete = () => {
    if(!firestore || !user) return;
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    deleteDocumentNonBlocking(jobRef);
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
    <AlertDialog>
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
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive focus:text-destructive-foreground focus:bg-destructive">
              Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this job
            and all of its associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
