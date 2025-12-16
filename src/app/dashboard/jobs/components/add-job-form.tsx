"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, User, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { addDoc, collection } from "firebase/firestore";

// Schema
const jobSchema = z.object({
    title: z.string().optional(),
    clientName: z.string().min(1, "Client is required"),
    quoteNumber: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    startDate: z.date({ required_error: "Start date is required" }),
    amount: z.number().min(0, "Amount must be positive"),
});

type JobFormValues = z.infer<typeof jobSchema>;

interface AddJobFormProps {
    onSuccess: () => void;
    onFormStateChange?: (isValid: boolean, isDirty: boolean) => void;
    submitTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function AddJobForm({ onSuccess, onFormStateChange, submitTriggerRef }: AddJobFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();
    const [amountDigits, setAmountDigits] = React.useState('0');
    const [isTitleManual, setIsTitleManual] = React.useState(false);

    const form = useForm<JobFormValues>({
        resolver: zodResolver(jobSchema),
        mode: "onChange",
        defaultValues: {
            title: "",
            clientName: "",
            quoteNumber: "",
            address: "",
            startDate: new Date(),
            amount: 0,
        },
    });

    const { formState, watch, setValue } = form;
    const { isValid, isDirty } = formState;

    const clientName = watch("clientName");
    const quoteNumber = watch("quoteNumber");

    // Auto-generate title logic
    React.useEffect(() => {
        if (isTitleManual) return;

        if (clientName) {
            const lastName = clientName.trim().split(' ').pop() || "";
            const quote = quoteNumber ? `#${quoteNumber}` : "";
            // Only add space if both exist
            const autoTitle = quote ? `${lastName} ${quote}` : lastName;

            setValue("title", autoTitle, { shouldValidate: true, shouldDirty: true });
        }
    }, [clientName, quoteNumber, isTitleManual, setValue]);

    // Notify parent of form state changes
    React.useEffect(() => {
        if (onFormStateChange) {
            onFormStateChange(isValid, isDirty);
        }
    }, [isValid, isDirty, onFormStateChange]);

    const onSubmit = async (data: JobFormValues) => {
        if (!firestore || !user) return;

        try {
            const jobsCollection = collection(firestore, 'users', user.uid, 'jobs');

            // Ensure title is set (fallback to auto-gen if empty, though useEffect handles it)
            let finalTitle = data.title;
            if (!finalTitle && data.clientName) {
                const lastName = data.clientName.trim().split(' ').pop() || "";
                finalTitle = data.quoteNumber ? `${lastName} #${data.quoteNumber}` : lastName;
            }

            await addDoc(jobsCollection, {
                title: finalTitle,
                clientName: data.clientName,
                quoteNumber: data.quoteNumber || '',
                address: data.address,
                startDate: data.startDate.toISOString(),
                amount: data.amount,
                createdAt: new Date().toISOString(),
                status: 'scheduled',
            });

            onSuccess();
            form.reset();
            setAmountDigits('0');
            setIsTitleManual(false);
        } catch (error) {
            console.error("Error adding job:", error);
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
                                        onChange={(e) => {
                                            field.onChange(e);
                                            setIsTitleManual(true);
                                        }}
                                        className="border-0 p-0 h-auto text-[22px] font-bold text-zinc-900 placeholder:text-zinc-300 focus-visible:ring-0 shadow-none bg-transparent rounded-none"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Client & Quote Group */}
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
                {/* Address Group (Google Maps) */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem className="px-4 py-3">
                                <FormLabel className="text-xs font-semibold uppercase text-gray-400 mb-1 block">Job Address</FormLabel>
                                <FormControl>
                                    <div className="relative -ml-2"> {/* Offset padding internal to Autocomplete? */}
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

                {/* Date & Amount Group */}
                {/* Date & Amount Group */}
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
