
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Job, GeneralSettings } from "@/app/lib/types";
import { Switch } from "@/components/ui/switch";
import { useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { format, parseISO } from "date-fns";

const jobSchema = z.object({
  title: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  quoteNumber: z.string().min(1, "Quote number is required"),
  address: z.string().min(1, "Address is required"),
  startDate: z.string().min(1, 'Start date is required').refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date',
  }),
  deadline: z.string().optional(),
  initialValue: z.coerce.number().min(0, "Initial value must be a positive number"),
  isFixedPay: z.boolean().default(false),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface EditJobFormProps {
  job: Job;
  onSuccess: () => void;
}

export function EditJobForm({ job, onSuccess }: EditJobFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const isCompleted = ['Complete', 'Open Payment', 'Finalized'].includes(job.status);


  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job.title || "",
      clientName: job.clientName || "",
      quoteNumber: job.quoteNumber || "",
      address: job.address || "",
      startDate: format(parseISO(job.startDate), 'yyyy-MM-dd'),
      deadline: isCompleted ? format(parseISO(job.deadline), 'yyyy-MM-dd') : undefined,
      initialValue: job.initialValue || 0,
      isFixedPay: job.isFixedPay || false,
    },
  });

  const onSubmit = async (data: JobFormValues) => {
    if (!firestore || !user) return;

    let finalTitle = data.title;
    if (!finalTitle) {
      const clientLastName = data.clientName.split(" ").pop() || "";
      finalTitle = `${clientLastName} #${data.quoteNumber}`;
    }
    
    // Fetch settings to calculate ideal values
    const settingsRef = doc(firestore, "settings", "global");
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.data() as GeneralSettings;

    const dailyPayTarget = settings?.dailyPayTarget > 0 ? settings.dailyPayTarget : 300; // Default fallback
    const idealMaterialCostPercentage = settings?.idealMaterialCostPercentage >= 0 ? settings.idealMaterialCostPercentage : 20;

    const idealMaterialCost = data.isFixedPay ? 0 : data.initialValue * (idealMaterialCostPercentage / 100);
    const profitTarget = data.initialValue - idealMaterialCost;
    
    // Calculation based on a single worker (the user), as crew is not managed on this form.
    const idealNumberOfDays = profitTarget > 0 && dailyPayTarget > 0 ? parseFloat((profitTarget / dailyPayTarget).toFixed(2)) : 0;
    
    const updatedJobData = {
      title: finalTitle,
      quoteNumber: data.quoteNumber,
      address: data.address,
      clientName: data.clientName,
      startDate: new Date(data.startDate + 'T12:00:00').toISOString(),
      deadline: data.deadline ? new Date(data.deadline + 'T12:00:00').toISOString() : job.deadline,
      budget: data.initialValue, // budget is payout
      initialValue: data.initialValue,
      isFixedPay: data.isFixedPay,
      idealMaterialCost: idealMaterialCost,
      idealNumberOfDays: idealNumberOfDays,
    };

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
    updateDocumentNonBlocking(jobRef, updatedJobData);
    
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 max-w-2xl mx-auto">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Title (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Interior Painting" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <FormControl>
                  <Input placeholder="Enter client name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="quoteNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quote #</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Q-008" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Address</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 123 Main St, Anytown, USA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                   <input
                        type="date"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                    />
                  <FormMessage />
                </FormItem>
              )}
            />
            {isCompleted && (
                 <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Completion Date</FormLabel>
                        <input
                            type="date"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={field.value ?? ''}
                            onChange={(e) => field.onChange(e.target.value)}
                        />
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
        <FormField
            control={form.control}
            name="initialValue"
            render={({ field }) => (
            <FormItem>
                <FormLabel>Initial Value</FormLabel>
                <FormControl>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                        <Input type="number" placeholder="2500" className="pl-7" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        
        <FormField
          control={form.control}
          name="isFixedPay"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Fixed Pay</FormLabel>
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
        
        <Button type="submit" className="w-full">Save Changes</Button>
      </form>
    </Form>
  );
}
