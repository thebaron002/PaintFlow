"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
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
import type { Job, GeneralSettings } from "@/app/lib/types";

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
    managementType: z.enum(["Fixed", "Self", "Company"]).default("Fixed"),
});

type EditJobFormValues = z.infer<typeof editJobSchema>;

interface EditJobFormProps {
    job: Job;
    settings: GeneralSettings | null;
    onSuccess: () => void;
    onFormStateChange?: (isValid: boolean, isDirty: boolean) => void;
    submitTriggerRef?: React.MutableRefObject<(() => void) | null>;
}

export function EditJobForm({ job, settings, onSuccess, onFormStateChange, submitTriggerRef }: EditJobFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();

    // Initialize amount digits logic
    const startVal = job.managementType === 'Self' ? (job.contractTotal || 0) : (job.initialValue || 0);
    const initialAmount = startVal.toFixed(2).replace('.', '');
    const [amountDigits, setAmountDigits] = React.useState(startVal ? initialAmount : '0');

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
            amount: job.managementType === 'Self' ? (job.contractTotal || 0) : (job.initialValue || 0),
            managementType: job.managementType || "Fixed",
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

            const selfShare = (settings?.selfShare ?? 52) / 100;
            // Company share not needed for calculation if input is direct payout

            let calculatedInitialValue = data.amount;
            let finalContractTotal = 0;

            if (data.managementType === 'Self') {
                finalContractTotal = data.amount;
                calculatedInitialValue = data.amount * selfShare;
            } else {
                finalContractTotal = 0;
                calculatedInitialValue = data.amount;
            }

            await updateDoc(jobRef, {
                title: data.title,
                clientName: data.clientName,
                quoteNumber: data.quoteNumber || '',
                address: data.address,
                startDate: data.startDate.toISOString(),
                deadline: data.deadline ? data.deadline.toISOString() : null,
                finalizationDate: data.finalizationDate ? data.finalizationDate.toISOString() : null,
                initialValue: calculatedInitialValue,
                budget: calculatedInitialValue,
                contractTotal: finalContractTotal,
                managementType: data.managementType,
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

    const managementType = form.watch("managementType");
    const prevManagementType = React.useRef(managementType);

    // Auto-convert amount when switching between types
    React.useEffect(() => {
        const currentType = managementType;
        const previousType = prevManagementType.current;
        // Don't convert on initial mount (when previous is same as current)
        if (currentType === previousType) return;

        const currentAmount = form.getValues("amount");

        if (currentAmount > 0) {
            // Case 1: Switching TO Self Managed (Payout -> Contract)
            if (currentType === 'Self' && (previousType === 'Company' || previousType === 'Fixed')) {
                const estimatedContract = currentAmount / 0.35;
                const digits = (estimatedContract * 100).toFixed(0);
                setAmountDigits(digits);
                setValue("amount", estimatedContract);
            }
            // Case 2: Switching FROM Self Managed (Contract -> Payout)
            else if ((currentType === 'Company' || currentType === 'Fixed') && previousType === 'Self') {
                const estimatedPayout = currentAmount * 0.35;
                const digits = (estimatedPayout * 100).toFixed(0);
                setAmountDigits(digits);
                setValue("amount", estimatedPayout);
            }
        }

        prevManagementType.current = currentType;
    }, [managementType, setValue, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 pb-8">

                {/* Management Type Selection */}
                <div className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
                    <FormField
                        control={form.control}
                        name="managementType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-xs font-semibold uppercase text-gray-400">Management Type</FormLabel>
                                <FormControl>
                                    <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
                                        {['Fixed', 'Company', 'Self'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => field.onChange(type)}
                                                className={cn(
                                                    "py-1.5 px-3 rounded-md text-xs font-bold transition-all",
                                                    field.value === type
                                                        ? "bg-white text-zinc-900 shadow-sm"
                                                        : "text-zinc-400 hover:text-zinc-600"
                                                )}
                                            >
                                                {type === 'Company' ? 'Co. Managed' : type === 'Self' ? 'Self Managed' : 'Fixed'}
                                            </button>
                                        ))}
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>

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
                            <FormItem className="px-4 py-3 space-y-2">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-[17px] font-normal text-gray-900 pt-1">
                                        {managementType === 'Self' ? 'Contract Total' : 'Initial Payout'}
                                    </FormLabel>
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
                                </div>
                                {managementType === 'Self' && (
                                    <div className="flex flex-col items-end gap-1 pt-1">
                                        <p className="text-[11px] text-zinc-400 font-medium">
                                            New Payout (52%): $ {(field.value * ((settings?.selfShare || 52) / 100)).toFixed(2)}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const currentVal = form.getValues("amount");
                                                // Assume currentVal is the 35% payout, calculate 100% contract
                                                const estimatedContract = currentVal / 0.35;
                                                const digits = (estimatedContract * 100).toFixed(0);
                                                setAmountDigits(digits);
                                                form.setValue("amount", estimatedContract, { shouldDirty: true, shouldValidate: true });
                                            }}
                                            className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md"
                                        >
                                            Calc Contract from 35% Payout
                                        </button>
                                    </div>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

            </form>
        </Form>
    );
}
