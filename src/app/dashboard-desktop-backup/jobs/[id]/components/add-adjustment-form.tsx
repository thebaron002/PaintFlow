
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
import { useFirestore, updateDocumentNonBlocking, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { Job, AdjustmentType, GeneralSettings } from "@/app/lib/types";
import { Clock, Paintbrush, ChevronsUpDown, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const adjustmentSchema = z.object({
  type: z.enum(["Time", "Material", "General"]),
  description: z.string().min(1, "Description is required."),
  value: z.coerce.number(),
  hourlyRate: z.coerce.number().optional(),
  isPayoutAddition: z.boolean().default(true),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

interface AddAdjustmentFormProps {
  jobId: string;
  settings: GeneralSettings | null;
  existingAdjustments: Job['adjustments'];
  onSuccess: () => void;
  adjustmentToEdit?: Job['adjustments'][0];
}

const adjustmentTypes: { value: AdjustmentType, label: string, icon: React.ElementType, unit: string }[] = [
  { value: 'Time', label: 'Time', icon: Clock, unit: 'hrs' },
  { value: 'Material', label: 'Material', icon: Paintbrush, unit: '$' },
  { value: 'General', label: 'General', icon: ChevronsUpDown, unit: '$' },
];

export function AddAdjustmentForm({ jobId, settings, existingAdjustments, onSuccess, adjustmentToEdit }: AddAdjustmentFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const isEditing = !!adjustmentToEdit;

  const form = useForm<AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: isEditing ? adjustmentToEdit : {
      type: "General",
      description: "",
      value: 0,
      isPayoutAddition: true,
    },
  });

  const onSubmit = (data: AdjustmentFormValues) => {
    if (!firestore || !user) return;

    let updatedAdjustments: Job['adjustments'];

    if (isEditing) {
      updatedAdjustments = existingAdjustments.map(adj =>
        adj.id === adjustmentToEdit.id ? { ...adj, ...data } : adj
      );
    } else {
      const newAdjustment = {
        id: uuidv4(),
        ...data,
      };
      if (newAdjustment.type === 'Time') {
        newAdjustment.hourlyRate = settings?.hourlyRate ?? 0;
      } else {
        delete newAdjustment.hourlyRate;
      }
      updatedAdjustments = [...(existingAdjustments || []), newAdjustment];
    }

    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    updateDocumentNonBlocking(jobRef, { adjustments: updatedAdjustments });

    onSuccess();
  };

  const handleDelete = () => {
    if (!firestore || !user || !isEditing) return;

    const updatedAdjustments = existingAdjustments.filter(adj => adj.id !== adjustmentToEdit.id);
    const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
    updateDocumentNonBlocking(jobRef, { adjustments: updatedAdjustments });

    onSuccess();
  }

  const isTime = selectedType === 'Time';

  // Rate Logic based on managementType
  const isSelf = !!(existingAdjustments as any)?._managementType === 'Self'; // This is a bit hacky, need proper prop
  const currentHourlyRate = isTime
    ? (isEditing ? (adjustmentToEdit?.hourlyRate || settings?.fixedHourlyRate || 40) : (isSelf ? settings?.clientHourlyRate || 80 : settings?.fixedHourlyRate || 40))
    : 0;

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
                    return (
                      <FormItem key={type.value}>
                        <FormControl>
                          <RadioGroupItem value={type.value} className="sr-only" disabled={isEditing && adjustmentToEdit.type !== type.value} />
                        </FormControl>
                        <FormLabel className={cn(
                          "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground",
                          isEditing && adjustmentToEdit.type !== type.value && "cursor-not-allowed opacity-50",
                          "[&:has([data-state=checked])]:border-primary"
                        )}>
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
              <FormLabel>{isTime ? 'Hours' : 'Value'}</FormLabel>
              <div className="flex flex-col gap-2">
                <FormControl>
                  <div className="relative">
                    {!isTime && <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>}
                    <Input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      {...field}
                      className={cn(!isTime && "pl-7")}
                    />
                    {isTime && <span className="absolute right-3 top-2.5 text-muted-foreground">hrs</span>}
                  </div>
                </FormControl>
                {isTime && field.value !== 0 && (
                  <p className="text-sm text-muted-foreground">
                    Total: ${(field.value * currentHourlyRate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPayoutAddition"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Include in Payout?
                </FormLabel>
                <p className="text-sm text-muted-foreground">
                  Whether this adjustment affects the final payout.
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-4 mt-4">
          <Button type="submit" className="flex-1">
            {isEditing ? "Update Adjustment" : "Add Adjustment"}
          </Button>
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this adjustment.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Form>
  );
}
