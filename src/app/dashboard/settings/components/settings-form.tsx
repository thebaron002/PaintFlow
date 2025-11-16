
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
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { GeneralSettings } from "@/app/lib/types";
import { useFirestore, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";

const settingsSchema = z.object({
  dailyPayTarget: z.coerce.number().min(0, "Daily pay target must be a positive number."),
  idealMaterialCostPercentage: z.coerce.number().min(0, "Percentage must be between 0 and 100.").max(100, "Percentage must be between 0 and 100."),
  hourlyRate: z.coerce.number().min(0, "Hourly rate must be a positive number."),
  sharePercentage: z.coerce.number().min(0, "Percentage must be between 0 and 100.").max(100, "Percentage must be between 0 and 100."),
  taxRate: z.coerce.number().min(0, "Tax rate must be between 0 and 100.").max(100, "Tax rate must be between 0 and 100."),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  settings: GeneralSettings;
  onSuccess: () => void;
}

export function SettingsForm({ settings, onSuccess }: SettingsFormProps) {
  const firestore = useFirestore();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dailyPayTarget: settings.dailyPayTarget || 0,
      idealMaterialCostPercentage: settings.idealMaterialCostPercentage || 0,
      hourlyRate: settings.hourlyRate || 0,
      sharePercentage: settings.sharePercentage || 0,
      taxRate: settings.taxRate || 0,
    },
  });

  const onSubmit = (data: SettingsFormValues) => {
    if (!firestore) return;

    const settingsRef = doc(firestore, 'settings', 'global');
    setDocumentNonBlocking(settingsRef, data, { merge: true });
    
    onSuccess();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-6 max-w-2xl mx-auto">
        <FormField
          control={form.control}
          name="dailyPayTarget"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Daily Pay Target</FormLabel>
               <FormControl>
                  <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input type="number" placeholder="300" className="pl-7" {...field} />
                  </div>
              </FormControl>
              <FormDescription>
                Set your target daily pay for profitability calculations on jobs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="idealMaterialCostPercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ideal Material Cost Percentage</FormLabel>
              <FormControl>
                 <div className="relative">
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">%</span>
                      <Input type="number" placeholder="20" className="pr-7" {...field} />
                  </div>
              </FormControl>
              <FormDescription>
                The ideal percentage of a job's budget to be spent on materials.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="hourlyRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hourly Rate</FormLabel>
               <FormControl>
                  <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>
                      <Input type="number" placeholder="50" className="pl-7" {...field} />
                  </div>
              </FormControl>
              <FormDescription>
                The default hourly rate for 'Time' based adjustments.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="sharePercentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Share Percentage</FormLabel>
              <FormControl>
                 <div className="relative">
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">%</span>
                      <Input type="number" placeholder="70" className="pr-7" {...field} />
                  </div>
              </FormControl>
              <FormDescription>
                The percentage you receive from the total job value.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Tax Rate</FormLabel>
              <FormControl>
                 <div className="relative">
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">%</span>
                      <Input type="number" placeholder="30" className="pr-7" {...field} />
                  </div>
              </FormControl>
              <FormDescription>
                Your estimated tax rate for income tax forecasting (e.g., 30 for 30%).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Save Settings</Button>
      </form>
    </Form>
  );
}
