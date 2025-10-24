
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFirestore, updateDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job, AdjustmentType } from "@/app/lib/types";
import { Clock, Paintbrush, ChevronsUpDown } from "lucide-react";

const adjustmentSchema = z.object({
  type: z.enum(["Time", "Material", "General"]),
  description: z.string().min(1, "Description is required."),
  value: z.coerce.number(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface AddAdjustmentFormProps {
  jobId: string;
  existingAdjustments: Job['adjustments'];
  onSuccess: () => void;
}

const adjustmentTypes: { value: AdjustmentType, label: string, icon: React.ElementType, unit: string }[] = [
    { value: 'Time', label: 'Time', icon: Clock, unit: 'hrs' },
    { value: 'Material', label: 'Material', icon: Paintbrush, unit: '$' },
    { value: 'General', label: 'General', icon: ChevronsUpDown, unit: '$' },
];

export function AddAdjustmentForm({ jobId, existingAdjustments, onSuccess }: AddAdjustmentFormProps) {
  const firestore = useFirestore();

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: "General",
      description: "",
      value: 0,
    },
  });

  const onSubmit = (data: AdjustmentFormValues) => {
    if (!firestore) return;

    const newAdjustment = {
      id: uuidv4(),
      ...data,
    };

    const updatedAdjustments = [...(existingAdjustments || []), newAdjustment];

    const jobRef = doc(firestore, 'jobs', jobId);
    updateDocumentNonBlocking(jobRef, { adjustments: updatedAdjustments });
    
    onSuccess();
  };

  const selectedType = form.watch('type');
  const unit = adjustmentTypes.find(t => t.value === selectedType)?.unit || '$';
  const isTime = selectedType === 'Time';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Adjustment Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-3 gap-4"
                >
                  {adjustmentTypes.map(type => {
                    const Icon = type.icon;
                    return(
                         <FormItem key={type.value}>
                            <FormControl>
                                <RadioGroupItem value={type.value} className="sr-only" />
                            </FormControl>
                            <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground [&:has([data-state=checked])]:border-primary">
                               <Icon className="mb-3 h-6 w-6" />
                                {type.label}
                            </FormLabel>
                        </FormItem>
                    )
                  })}
                </RadioGroup>
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Extra hours for touch-ups" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
       
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isTime ? 'Hours' : 'Amount'}</FormLabel>
              <FormControl>
                  <div className="relative">
                      {unit === '$' && <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">$</span>}
                      <Input type="number" step="0.01" placeholder="0.00" className={unit === '$' ? "pl-7" : "pr-10"} {...field} />
                      {unit !== '$' && <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">{unit}</span>}
                  </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full">Add Adjustment</Button>
      </form>
    </Form>
  );
}
