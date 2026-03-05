
"use client";

import { useState } from "react";
import type { Ticket } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlusCircle, ArrowUp, ArrowRight, ArrowDown } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { TicketForm } from "./components/ticket-form";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const priorityIcons = {
  Low: <ArrowDown className="h-4 w-4 text-green-500" />,
  Medium: <ArrowRight className="h-4 w-4 text-yellow-500" />,
  High: <ArrowUp className="h-4 w-4 text-red-500" />,
};

const statusColors = {
    Open: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700',
    'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700',
    Done: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
}

type ModalState = {
  isOpen: boolean;
  ticket: Ticket | null;
};

export default function TicketsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, ticket: null });

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, "users", user.uid, "tickets"), orderBy("createdAt", "desc"));
  }, [firestore, user]);

  const { data: tickets, isLoading } = useCollection<Ticket>(ticketsQuery);

  const handleFormSuccess = () => {
    toast({
      title: `Ticket ${modalState.ticket ? 'Updated' : 'Created'}`,
      description: `The ticket has been saved successfully.`,
    });
    setModalState({ isOpen: false, ticket: null });
  };

  const openNewTicketModal = () => {
    setModalState({ isOpen: true, ticket: null });
  };

  const openEditTicketModal = (ticket: Ticket) => {
    setModalState({ isOpen: true, ticket });
  };

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="My Tickets">
        <Button onClick={openNewTicketModal}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </PageHeader>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))
            ) : tickets && tickets.length > 0 ? (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} onClick={() => openEditTicketModal(ticket)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-2">
                        {priorityIcons[ticket.priority]}
                        <span>{ticket.priority}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("capitalize", statusColors[ticket.status])}>{ticket.status}</Badge>
                  </TableCell>
                  <TableCell>{formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No tickets found. Create your first one!
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => setModalState({ isOpen, ticket: isOpen ? modalState.ticket : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalState.ticket ? "Edit Ticket" : "Create New Ticket"}</DialogTitle>
          </DialogHeader>
          <TicketForm
            onSuccess={handleFormSuccess}
            existingTicket={modalState.ticket}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

    