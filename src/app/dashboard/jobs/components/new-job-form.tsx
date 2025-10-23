
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
import type { Client } from "@/app/lib/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const jobSchema = z.object({
  title: z.string().optional(),
  workOrderNumber: z.string().min(1, "Work order number is required"),
  address: z.string().min(1, "Address is required"),
  clientName: z.string().min(1, "Client name is required"),
  startDate: z.date({ required_error: "Start date is required." }),
  initialValue: z.coerce.number().min(0, "Initial value must be a positive number"),
  isFixedPay: z.boolean().default(false),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface NewJobFormProps {
  clients: Client[] | null;
  onSuccess: () => void;
}

export function NewJobForm({ clients, onSuccess }: NewJobFormProps) {
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: "",
      workOrderNumber: "",
      address: "",
      clientName: "",
      initialValue: 0,
      isFixedPay: false,
    },
  });

  const onSubmit = (data: JobFormValues) => {
    let finalTitle = data.title;
    if (!finalTitle) {
      const clientLastName = data.clientName.split(" ").pop() || "";
      finalTitle = `${clientLastName} #${data.workOrderNumber}`;
    }

    const submissionData = {
      ...data,
      title: finalTitle,
    };

    // Here you would typically call a function to save the data to your backend
    console.log("New Job Data:", submissionData);
    
    // For now, we just simulate success
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
        
        <Button type="submit" className="w-full">Create Job</Button>
      </form>
    </Form>
  );
}
