
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job } from "@/app/lib/types";
import { Combobox } from "@/components/ui/combobox";
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
import { Switch } from "@/components/ui/switch";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";

const invoiceSchema = z.object({
  origin: z.string().min(1, "Origin is required."),
  date: z.date({ required_error: "Invoice date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  notes: z.string().optional(),
  isPayoutDiscount: z.boolean().default(false),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface AddInvoiceFormProps {
  jobId: string;
  existingInvoices: Job['invoices'];
  origins: string[];
  onSuccess: () => void;
  invoiceToEdit?: Job['invoices'][0];
}

export function AddInvoiceForm({ jobId, existingInvoices, origins, onSuccess, invoiceToEdit }: AddInvoiceFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const isEditing = !!invoiceToEdit;

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: isEditing ? {
        ...invoiceToEdit,
        date: new Date(invoiceToEdit.date),
        isPayoutDiscount: invoiceToEdit.isPayoutDiscount || false,
    } : {
      origin: "",
      amount: 0,
      notes: "",
      isPayoutDiscount: false,
    },
  });

  const originValue = form.watch("origin");

  useEffect(() => {
    if (originValue === 'Sherwin-Williams') {
        form.setValue('isPayoutDiscount', true);
    }
  }, [originValue, form.setValue])

  const onSubmit = (data: InvoiceFormValues) => {
    if (!firestore || !user) return;

    let updatedInvoices: Job['invoices'];

    if(isEditing) {
        updatedInvoices = existingInvoices.map(inv => 
            inv.id === invoiceToEdit.id ? { ...inv, ...data, date: format(data.date, "yyyy-MM-dd") } : inv
        );
    } else {
        const newInvoice = {
            id: uuidv4(),
            ...data,
            date: format(data.date, "yyyy-MM-dd"),
        };
        updatedInvoices = [...existingInvoices, newInvoice];
    }

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    updateDocumentNonBlocking(jobRef, { invoices: updatedInvoices });
    
    onSuccess();
  };

  const handleDelete = () => {
    if (!firestore || !user || !isEditing) return;

    const updatedInvoices = existingInvoices.filter(inv => inv.id !== invoiceToEdit.id);
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    updateDocumentNonBlocking(jobRef, { invoices: updatedInvoices });

    onSuccess();
  }

  const originOptions = origins.map(o => ({ value: o, label: o }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="origin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Origin</FormLabel>
              <FormControl>
                <Combobox
                    options={originOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or create origin..."
                    emptyMessage="No origins found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                   <FormControl>
                        <ResponsiveDatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Pick a date"
                        />
                   </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input type="number" placeholder="0.00" className="pl-7" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Initial 50% deposit" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPayoutDiscount"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Needs to be discounted on the payout?</FormLabel>
                <FormDescription>
                    Enable if this amount should be subtracted from the final payout.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between">
            {isEditing ? (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete this invoice.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            ) : <div></div>}
            <Button type="submit">{isEditing ? "Save Changes" : "Add Invoice"}</Button>
        </div>
      </form>
    </Form>
  );
}
