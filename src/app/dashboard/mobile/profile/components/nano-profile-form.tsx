"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { UserProfile } from "@/app/lib/types";
import { useFirestore, setDocumentNonBlocking, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { User, Mail, Phone, Building, Link2, Camera } from "lucide-react";

const profileSchema = z.object({
    name: z.string().min(1, "Name is required."),
    email: z.string().email("Please enter a valid email address."),
    phone: z.string().optional(),
    businessName: z.string().optional(),
    businessLogoUrl: z.string().url().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface NanoProfileFormProps {
    profile: UserProfile;
    onSuccess: () => void;
    submitTriggerRef: React.MutableRefObject<(() => void) | null>;
    onFormStateChange: (isValid: boolean) => void;
}

function NanoGlassCard({ className, children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={cn("bg-white rounded-[24px] shadow-sm border border-zinc-50 overflow-hidden", className)}>
            {children}
        </div>
    );
}

export function NanoProfileForm({ profile, onSuccess, submitTriggerRef, onFormStateChange }: NanoProfileFormProps) {
    const firestore = useFirestore();
    const { user } = useUser();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        mode: "onChange",
        defaultValues: {
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            businessName: profile.businessName || "",
            businessLogoUrl: profile.businessLogoUrl || "",
        },
    });

    const { formState: { isValid } } = form;

    React.useEffect(() => {
        onFormStateChange(isValid);
    }, [isValid, onFormStateChange]);

    const onSubmit = (data: ProfileFormValues) => {
        if (!firestore || !user) return;
        const profileRef = doc(firestore, 'users', user.uid);
        setDocumentNonBlocking(profileRef, data, { merge: true });
        onSuccess();
    };

    React.useEffect(() => {
        submitTriggerRef.current = form.handleSubmit(onSubmit);
    }, [form, onSubmit, submitTriggerRef]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Section: Personal Info */}
                <div className="space-y-3">
                    <h2 className="text-lg font-extrabold text-zinc-900 px-1">Personal Info</h2>
                    <NanoGlassCard className="divide-y divide-zinc-50">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="flex items-center px-4 py-4 gap-3">
                                        <User className="w-5 h-5 text-zinc-400" />
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder="Full Name"
                                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base font-medium placeholder:text-zinc-300"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                    <FormMessage className="px-4 pb-2 text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="flex items-center px-4 py-4 gap-3 text-zinc-400">
                                        <Mail className="w-5 h-5" />
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="Email Address"
                                                    readOnly
                                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base font-medium opacity-60"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="flex items-center px-4 py-4 gap-3">
                                        <Phone className="w-5 h-5 text-zinc-400" />
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input
                                                    type="tel"
                                                    placeholder="Phone Number"
                                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base font-medium placeholder:text-zinc-300"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                    <FormMessage className="px-4 pb-2 text-[10px]" />
                                </FormItem>
                            )}
                        />
                    </NanoGlassCard>
                </div>

                {/* Section: Business */}
                <div className="space-y-3">
                    <h2 className="text-lg font-extrabold text-zinc-900 px-1">Business Details</h2>
                    <NanoGlassCard className="divide-y divide-zinc-50">
                        <FormField
                            control={form.control}
                            name="businessName"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="flex items-center px-4 py-4 gap-3">
                                        <Building className="w-5 h-5 text-zinc-400" />
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder="Business Name"
                                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base font-medium placeholder:text-zinc-300"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="businessLogoUrl"
                            render={({ field }) => (
                                <FormItem className="space-y-0">
                                    <div className="flex items-center px-4 py-4 gap-3">
                                        <Link2 className="w-5 h-5 text-zinc-400" />
                                        <div className="flex-1">
                                            <FormControl>
                                                <Input
                                                    placeholder="Logo URL"
                                                    className="border-none shadow-none focus-visible:ring-0 p-0 h-auto text-base font-medium placeholder:text-zinc-300"
                                                    {...field}
                                                />
                                            </FormControl>
                                        </div>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </NanoGlassCard>
                </div>
            </form>
        </Form>
    );
}
