
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { Job, GeneralSettings } from "@/app/lib/types";
import { Switch } from "@/components/ui/switch";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";

const jobSchema = z.object({
  title: z.string().optional(),
  clientName: z.string().min(1, "Client name is required"),
  workOrderNumber: z.string().min(1, "Work order number is required"),
  address: z.string().min(1, "Address is required"),
  startDate: z.date({ required_error: "Start date is required." }),
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

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: job.title || "",
      clientName: job.clientName || "",
      workOrderNumber: job.workOrderNumber || "",
      address: job.address || "",
      startDate: new Date(job.startDate),
      initialValue: job.initialValue || 0,
      isFixedPay: job.isFixedPay || false,
    },
  });

  const onSubmit = async (data: JobFormValues) => {
    if (!firestore) return;

    let finalTitle = data.title;
    if (!finalTitle) {
      const clientLastName = data.clientName.split(" ").pop() || "";
      finalTitle = `${clientLastName} #${data.workOrderNumber}`;
    }
    
    // Fetch settings to calculate ideal values
    const settingsRef = doc(firestore, "settings", "global");
    const settingsSnap = await getDoc(settingsRef);
    const settings = settingsSnap.data() as GeneralSettings;

    const dailyPayTarget = settings?.dailyPayTarget > 0 ? settings.dailyPayTarget : 300; // Default fallback
    const idealMaterialCostPercentage = settings?.idealMaterialCostPercentage >= 0 ? settings.idealMaterialCostPercentage : 20;

    const idealMaterialCost = data.initialValue * (idealMaterialCostPercentage / 100);
    const profitTarget = data.initialValue - idealMaterialCost;
    
    // Calculation based on a single worker (the user), as crew is not managed on this form.
    const idealNumberOfDays = profitTarget > 0 && dailyPayTarget > 0 ? Math.ceil(profitTarget / dailyPayTarget) : 0;
    
    const updatedJobData = {
      title: finalTitle,
      workOrderNumber: data.workOrderNumber,
      address: data.address,
      clientName: data.clientName,
      startDate: data.startDate.toISOString(),
      budget: data.initialValue, // budget is payout
      initialValue: data.initialValue,
      isFixedPay: data.isFixedPay,
      idealMaterialCost: idealMaterialCost,
      idealNumberOfDays: idealNumberOfDays,
    };

    const jobRef = doc(firestore, 'jobs', job.id);
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
            name="workOrderNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Work Order #</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., WO-008" {...field} />
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
                    <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50"/>
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent>
                    </Popover>
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
        
        <Button type="submit" className="w-full">Save Changes</Button>
      </form>
    </Form>
  );
}
