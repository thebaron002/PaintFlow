"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useUser, useFirestore } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { Job } from "@/app/lib/types";

// Schema
const editJobSchema = z.object({
    title: z.string().optional(),
    clientName: z.string().min(1, "Client is required"),
    quoteNumber: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    deadline: z.date().optional(), // End Date
    finalizationDate: z.date().optional(),
    amount: z.number().min(0, "Amount must be positive"),
});

type EditJobFormValues = z.infer<typeof editJobSchema>;

interface EditJobFormProps {
    job: Job;
    onSuccess: () => void;
    onFormStateChange?: (isValid: boolean, isDirty: boolean) => void;
    submitTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function EditJobForm({ job, onSuccess, onFormStateChange, submitTriggerRef }: EditJobFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();

    // Initialize amount digits logic
    const initialAmount = (job.budget || job.initialValue || 0).toFixed(2).replace('.', '');
    const [amountDigits, setAmountDigits] = React.useState(job.budget || job.initialValue ? initialAmount : '0');

    const form = useForm<EditJobFormValues>({
        resolver: zodResolver(editJobSchema),
        mode: "onChange",
        defaultValues: {
            title: job.title || "",
            clientName: job.clientName || "",
            quoteNumber: job.quoteNumber || "",
            address: job.address || "",
            startDate: job.startDate ? new Date(job.startDate) : new Date(),
            deadline: job.deadline ? new Date(job.deadline) : undefined,
            finalizationDate: job.finalizationDate ? new Date(job.finalizationDate) : undefined,
            amount: job.budget || job.initialValue || 0,
        },
    });

    const { formState, setValue } = form;
    const { isValid, isDirty } = formState;

    // Notify parent of form state changes
    React.useEffect(() => {
        if (onFormStateChange) {
            onFormStateChange(isValid, isDirty);
        }
    }, [isValid, isDirty, onFormStateChange]);

    const onSubmit = async (data: EditJobFormValues) => {
        if (!firestore || !user || !job.id) return;

        try {
            const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);

            await updateDoc(jobRef, {
                title: data.title,
                clientName: data.clientName,
                quoteNumber: data.quoteNumber || '',
                address: data.address,
                startDate: data.startDate.toISOString(),
                deadline: data.deadline ? data.deadline.toISOString() : null,
                finalizationDate: data.finalizationDate ? data.finalizationDate.toISOString() : null,
                initialValue: data.amount, // Updating legacy field + budget
                budget: data.amount,
            });

            onSuccess();
        } catch (error) {
            console.error("Error updating job:", error);
        }
    };

    // Expose submit handler
    React.useEffect(() => {
        if (submitTriggerRef) {
            submitTriggerRef.current = () => {
                form.handleSubmit(onSubmit)();
            };
        }
    }, [form, submitTriggerRef]);

    // Reverse currency formatting
    const formatDisplay = (digits: string) => {
        const cents = parseInt(digits || '0', 10);
        const value = cents / 100;
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, onChange: (val: number) => void) => {
        const input = e.target.value;
        const newDigits = input.replace(/\D/g, '');
        const limited = newDigits.slice(0, 10);
        setAmountDigits(limited);
        const cents = parseInt(limited || '0', 10);
        onChange(cents / 100);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 pb-8">

                {/* Job Title Group */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                            <FormItem className="px-4 py-4">
                                <FormLabel className="sr-only">Job Title</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Job Title"
                                        {...field}
                                        className="border-0 p-0 h-auto text-[22px] font-bold text-zinc-900 placeholder:text-zinc-300 focus-visible:ring-0 shadow-none bg-transparent rounded-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Client & Quote Group */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">
                    <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3">
                                <FormLabel className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Client</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Client Name"
                                        {...field}
                                        className="border-0 p-0 h-auto text-[17px] font-normal placeholder:text-gray-300 focus-visible:ring-0 shadow-none bg-transparent rounded-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="quoteNumber"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3">
                                <FormLabel className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Quote #</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="Optional"
                                        {...field}
                                        className="border-0 p-0 h-auto text-[17px] font-normal placeholder:text-gray-300 focus-visible:ring-0 shadow-none bg-transparent rounded-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Address Group (Google Maps) */}
                <div className="bg-white rounded-xl shadow-sm relative z-20">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3">
                                <FormLabel className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Job Address</FormLabel>
                                <FormControl>
                                    <div className="relative -ml-2">
                                        <AddressAutocomplete
                                            value={field.value}
                                            onChange={field.onChange}
                                            className="border-0 shadow-none text-[17px]"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Dates & Amount Group */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm divide-y divide-gray-100">

                    {/* Start Date */}
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3 flex items-center justify-between space-y-0">
                                <FormLabel className="text-[17px] font-normal text-gray-900 w-full pt-1">Start Date</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="bg-gray-100 px-3 py-1.5 rounded-md text-[15px] font-medium text-gray-900 whitespace-nowrap">
                                            {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                                        </div>
                                        <input
                                            type="date"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const date = new Date(e.target.value);
                                                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                                const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                                                field.onChange(adjustedDate);
                                            }}
                                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* End Date */}
                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3 flex items-center justify-between space-y-0">
                                <FormLabel className="text-[17px] font-normal text-gray-900 w-full pt-1">End Date</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="bg-gray-100 px-3 py-1.5 rounded-md text-[15px] font-medium text-gray-900 whitespace-nowrap">
                                            {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                                        </div>
                                        <input
                                            type="date"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const date = new Date(e.target.value);
                                                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                                const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                                                field.onChange(adjustedDate);
                                            }}
                                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Finalization Date */}
                    <FormField
                        control={form.control}
                        name="finalizationDate"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3 flex items-center justify-between space-y-0">
                                <FormLabel className="text-[17px] font-normal text-gray-900 w-full pt-1">Finalized Date</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <div className="bg-gray-100 px-3 py-1.5 rounded-md text-[15px] font-medium text-gray-900 whitespace-nowrap">
                                            {field.value ? format(field.value, "MMM d, yyyy") : "Select date"}
                                        </div>
                                        <input
                                            type="date"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const date = new Date(e.target.value);
                                                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                                const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                                                field.onChange(adjustedDate);
                                            }}
                                            value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {/* Amount */}
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3 flex items-center justify-between space-y-0">
                                <FormLabel className="text-[17px] font-normal text-gray-900 w-full pt-1">Amount</FormLabel>
                                <FormControl>
                                    <div className="flex items-center justify-end text-[17px] font-normal text-gray-500">
                                        <span className="mr-1">$</span>
                                        <Input
                                            type="text"
                                            inputMode="decimal"
                                            value={formatDisplay(amountDigits)}
                                            onChange={(e) => handleAmountChange(e, field.onChange)}
                                            className="border-0 p-0 h-auto w-[100px] text-right text-gray-900 focus-visible:ring-0 shadow-none bg-transparent"
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

            </form>
        </Form>
    );
}
