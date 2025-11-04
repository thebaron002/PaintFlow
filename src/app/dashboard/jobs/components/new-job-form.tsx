
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
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";
import { AddressAutocomplete } from "@/components/address-autocomplete";

const jobSchema = z.object({
  title: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  quoteNumber: z.string().min(1, "Quote number is required"),
  address: z.string().min(1, "Address is required"),
  startDate: z.string().min(1, 'Start date is required').refine((val) => {
       return !Number.isNaN(Date.parse(val));
     }, {
       message: 'Invalid date',
     }),
  initialValue: z.coerce.number().min(0, "Initial value must be a positive number"),
  isFixedPay: z.boolean().default(false),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface NewJobFormProps {
  onSuccess: () => void;
}

export function NewJobForm({ onSuccess }: NewJobFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      clientName: "",
      quoteNumber: "",
      address: "",
      initialValue: 0,
      isFixedPay: false,
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
    // Calculation based on a single worker (the user)
    const idealNumberOfDays = profitTarget > 0 && dailyPayTarget > 0 ? parseFloat((profitTarget / dailyPayTarget).toFixed(2)) : 0;
    
    const newJob: Omit<Job, 'id'> = {
      title: finalTitle,
      quoteNumber: data.quoteNumber,
      address: data.address,
      clientName: data.clientName,
      startDate: new Date(data.startDate + 'T12:00:00').toISOString(),
      deadline: new Date().toISOString(),
      specialRequirements: "",
      status: "Not Started",
      budget: data.initialValue, // budget is payout
      initialValue: data.initialValue,
      idealMaterialCost: idealMaterialCost,
      idealNumberOfDays: idealNumberOfDays,
      productionDays: [],
      isFixedPay: data.isFixedPay,
      invoices: [],
      adjustments: [],
      crew: [],
    };

    const jobsCollection = collection(firestore, 'users', user.uid, 'jobs');
    addDocumentNonBlocking(jobsCollection, newJob);
    
    form.reset();
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
                <AddressAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                />
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
        </div>
        
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
        
        <Button type="submit" className="w-full">Create Job</Button>
      </form>
    </Form>
  );
}
