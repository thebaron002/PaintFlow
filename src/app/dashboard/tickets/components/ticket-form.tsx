
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import type { Ticket } from "@/app/lib/types";
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
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().optional(),
  status: z.enum(["Open", "In Progress", "Done"]),
  priority: z.enum(["Low", "Medium", "High"]),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSuccess: () => void;
  existingTicket?: Ticket | null;
}

export function TicketForm({ onSuccess, existingTicket }: TicketFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const isEditing = !!existingTicket;

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: isEditing ? {
      title: existingTicket.title,
      description: existingTicket.description,
      status: existingTicket.status,
      priority: existingTicket.priority,
    } : {
      title: "",
      description: "",
      status: "Open",
      priority: "Medium",
    },
  });

  const onSubmit = (data: TicketFormValues) => {
    if (!firestore || !user) return;

    if (isEditing) {
      const ticketRef = doc(firestore, 'users', user.uid, 'tickets', existingTicket.id);
      updateDocumentNonBlocking(ticketRef, data);
    } else {
      const newTicket: Omit<Ticket, 'id'> = {
        ...data,
        description: data.description || '',
        createdAt: new Date().toISOString(),
      };
      const ticketsCollection = collection(firestore, 'users', user.uid, 'tickets');
      addDocumentNonBlocking(ticketsCollection, newTicket);
    }
    
    onSuccess();
  };

  const handleDelete = () => {
    if (!firestore || !user || !isEditing) return;

    const ticketRef = doc(firestore, 'users', user.uid, 'tickets', existingTicket.id);
    updateDocumentNonBlocking(ticketRef, { status: "Done" });

    onSuccess();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Fix login button on Safari" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe the bug or feature request..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex items-center justify-between pt-4">
            {isEditing ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the ticket as "Done".
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Mark as Done</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : <div></div>}
            <Button type="submit">{isEditing ? "Save Changes" : "Create Ticket"}</Button>
        </div>
      </form>
    </Form>
  );
}

    