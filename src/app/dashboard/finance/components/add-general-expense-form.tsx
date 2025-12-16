"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

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
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useState } from "react";

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required."),
  date: z.date({ required_error: "Date is required." }),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  description: z.string().min(1, "Description is required."),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

interface AddGeneralExpenseFormProps {
  categories: string[];
  onSuccess: () => void;
  onFormStateChange?: (isValid: boolean, isDirty: boolean) => void;
  submitTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function AddGeneralExpenseForm({ categories, onSuccess, onFormStateChange, submitTriggerRef }: AddGeneralExpenseFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Reverse currency input state (stores raw digits for cents)
  const [amountDigits, setAmountDigits] = useState('0');

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: "",
      amount: 0,
      description: "",
      date: new Date(),
    },
  });

  const { formState } = form;
  const { isValid, isDirty } = formState;

  // Notify parent of form state changes
  React.useEffect(() => {
    if (onFormStateChange) {
      onFormStateChange(isValid, isDirty);
    }
  }, [isValid, isDirty, onFormStateChange]);

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
    setIsCustomCategory(false);
    setAmountDigits('0'); // Reset digits
  };

  // Expose submit handler to parent via ref
  React.useEffect(() => {
    if (submitTriggerRef) {
      submitTriggerRef.current = () => {
        form.handleSubmit(onSubmit)();
      };
    }
  }, [form, submitTriggerRef]);

  const categoryOptions = [...new Set([...defaultCategories.map(c => c.value), ...categories])].map(c => ({ value: c, label: c }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 pb-8">
        {/* iOS-style grouped fields */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-3">
                  <FormLabel className="text-sm text-gray-600 mb-2 block">Category</FormLabel>
                  <FormControl>
                    {isCustomCategory ? (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter new category name..."
                          {...field}
                          autoFocus
                          className="bg-white border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setIsCustomCategory(false);
                            field.onChange("");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(val) => {
                          if (val === "create_custom_opt") {
                            setIsCustomCategory(true);
                            field.onChange("");
                          } else {
                            field.onChange(val);
                          }
                        }}
                        value={field.value && categoryOptions.some(o => o.value === field.value) ? field.value : undefined}
                      >
                        <FormControl>
                          <SelectTrigger className="border-0 p-0 h-auto focus:ring-0 focus:ring-offset-0">
                            <SelectValue placeholder="Choose" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="create_custom_opt" className="text-blue-600 font-medium">
                            + Create new category
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="border-b border-gray-100 last:border-b-0">
                <div className="px-4 py-3">
                  <FormLabel className="text-sm text-gray-600 mb-2 block">Date</FormLabel>
                  <FormControl>
                    <input
                      type="date"
                      value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          field.onChange(new Date(e.target.value + "T12:00:00"));
                        }
                      }}
                      className="w-full border-0 p-0 h-auto focus:outline-none focus:ring-0 bg-transparent"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => {
              // Format display value from digits (reverse currency input)
              const formatDisplay = (digits: string) => {
                const cents = parseInt(digits || '0', 10);
                const value = cents / 100;
                return value.toFixed(2).replace('.', ',');
              };

              // Handle reverse currency input (typing from right to left)
              const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                const input = e.target.value;
                // Extract only digits
                const newDigits = input.replace(/\D/g, '');
                // Limit to 10 digits (max $99,999,999.99)
                const limited = newDigits.slice(0, 10);

                setAmountDigits(limited);

                // Update form field with decimal value
                const cents = parseInt(limited || '0', 10);
                const decimalValue = cents / 100;
                field.onChange(decimalValue);
              };

              return (
                <FormItem className="border-b border-gray-100 last:border-b-0">
                  <div className="px-4 py-3">
                    <FormLabel className="text-sm text-gray-600 mb-2 block">Amount</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-500 font-medium">$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={formatDisplay(amountDigits)}
                          onChange={handleAmountChange}
                          placeholder="0,00"
                          className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 font-medium flex-1 shadow-none bg-transparent"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </div>
                </FormItem>
              );
            }}
          />
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <div className="px-4 py-3">
                  <FormLabel className="text-sm text-gray-600 mb-2 block">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Monthly insurance premium"
                      className="border-0 p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
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
