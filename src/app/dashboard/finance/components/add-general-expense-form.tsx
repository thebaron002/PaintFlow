
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
import { useFirestore, addDocumentNonBlocking, useUser } from "@/firebase";
import { collection } from "firebase/firestore";
import type { GeneralExpense } from "@/app/lib/types";
import { Combobox } from "@/components/ui/combobox";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required."),
  date: z.date({ required_error: "Date is required."}),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  description: z.string().min(1, "Description is required."),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface AddGeneralExpenseFormProps {
  categories: string[];
  onSuccess: () => void;
}

const defaultCategories = [
    { value: 'Gas', label: 'Gas' },
    { value: 'Insurance', label: 'Insurance' },
    { value: 'Tools', label: 'Tools' },
    { value: 'Storage', label: 'Storage' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Office Supplies', label: 'Office Supplies' },
    { value: 'Other', label: 'Other' },
]

export function AddGeneralExpenseForm({ categories, onSuccess }: AddGeneralExpenseFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: 0,
      description: "",
      date: new Date(),
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    if (!firestore || !user) return;

    const newExpense: Omit<GeneralExpense, 'id'> = {
        ...data,
        date: data.date.toISOString(),
    };

    const expensesCollection = collection(firestore, 'users', user.uid, 'generalExpenses');
    addDocumentNonBlocking(expensesCollection, newExpense);
    
    onSuccess();
    form.reset();
  };

  const categoryOptions = [...new Set([...defaultCategories.map(c => c.value), ...categories])].map(c => ({ value: c, label: c }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Combobox
                    options={categoryOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or create category..."
                    emptyMessage="No categories found."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        <Input type="number" step="0.01" placeholder="0.00" className="pl-7" {...field} />
                    </div>
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Monthly insurance premium" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-end">
            <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </Form>
  );
}
