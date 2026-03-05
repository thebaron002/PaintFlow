"use client";

import { NanoHeader } from "./components/nano-header";
import { useAuth, useUser, useFirestore, useDoc, setDocumentNonBlocking } from "@/firebase";
import { doc } from "firebase/firestore";
import { LogOut, Save, BadgeDollarSign, Percent, Scale, Clock, DollarSign } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { GeneralSettings } from "@/app/lib/types";
import { useToast } from "@/hooks/use-toast";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

// --- Schema (Mirrors Desktop) ---
const settingsSchema = z.object({
    dailyPayTarget: z.coerce.number().min(0),
    idealMaterialCostPercentage: z.coerce.number().min(0).max(100),
    hourlyRate: z.coerce.number().min(0),
    sharePercentage: z.coerce.number().min(0).max(100),
    taxRate: z.coerce.number().min(0).max(100),
    fixedHourlyRate: z.coerce.number().min(0),
    clientHourlyRate: z.coerce.number().min(0),
    companyShare: z.coerce.number().min(0).max(100),
    selfShare: z.coerce.number().min(0).max(100),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// --- Components ---
const NanoInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label: string, icon?: React.ElementType }>(
    ({ className, label, icon: Icon, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1">{label}</label>
                <div className="relative group">
                    {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />}
                    <input
                        ref={ref}
                        className={`w-full bg-body rounded-[16px] border border-zinc-100 p-3 pl-10 text-sm font-semibold text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all ${className}`}
                        {...props}
                    />
                </div>
            </div>
        )
    }
);
NanoInput.displayName = "NanoInput";

export default function MobileSettingsPage() {
    const { user } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();

    // Fetch Settings
    const settingsRef = React.useMemo(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings, isLoading } = useDoc<GeneralSettings>(settingsRef);

    const form = useForm<SettingsFormValues>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            dailyPayTarget: 300,
            idealMaterialCostPercentage: 20,
            hourlyRate: 50,
            sharePercentage: 70,
            taxRate: 30,
            fixedHourlyRate: 40,
            clientHourlyRate: 80,
            companyShare: 35,
            selfShare: 52,
        },
    });

    // Reset form when data loads
    React.useEffect(() => {
        if (settings) {
            form.reset({
                dailyPayTarget: settings.dailyPayTarget || 300,
                idealMaterialCostPercentage: settings.idealMaterialCostPercentage || 20,
                hourlyRate: settings.hourlyRate || 50,
                sharePercentage: settings.sharePercentage || 70,
                taxRate: settings.taxRate || 30,
                fixedHourlyRate: settings.fixedHourlyRate || 40,
                clientHourlyRate: settings.clientHourlyRate || 80,
                companyShare: settings.companyShare || 35,
                selfShare: settings.selfShare || 52,
            });
        }
    }, [settings, form]);

    const onSubmit = (data: SettingsFormValues) => {
        if (!firestore) return;
        const ref = doc(firestore, 'settings', 'global');
        setDocumentNonBlocking(ref, data, { merge: true });
        toast({ title: "Saved", description: "Settings updated." });
    };

    const handleSignOut = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (isLoading) return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans">
            <NanoHeader title="App\nSettings" subtitle="Preferences" />
            <div className="space-y-4">
                <Skeleton className="h-40 w-full rounded-[24px]" />
                <Skeleton className="h-40 w-full rounded-[24px]" />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans pb-32">
            <NanoHeader title={`App\nSettings`} subtitle="Preferences" />

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* 1. Global Metrics */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-50 space-y-4">
                    <h3 className="text-sm font-extrabold text-zinc-900 border-b border-zinc-100 pb-2 mb-2">Metrics Targets</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <NanoInput label="Pay Target" icon={BadgeDollarSign} {...form.register("dailyPayTarget")} />
                        <NanoInput label="Material %" icon={Percent} {...form.register("idealMaterialCostPercentage")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NanoInput label="Hourly Rate" icon={Clock} {...form.register("hourlyRate")} />
                        <NanoInput label="Tax Rate %" icon={Scale} {...form.register("taxRate")} />
                    </div>
                </div>

                {/* 2. Management Logic */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-50 space-y-4">
                    <h3 className="text-sm font-extrabold text-zinc-900 border-b border-zinc-100 pb-2 mb-2">Management Logic</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <NanoInput label="Self Managed %" icon={Percent} {...form.register("selfShare")} />
                        <NanoInput label="Company Managed %" icon={Percent} {...form.register("companyShare")} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NanoInput label="Fixed Hourly Rate" icon={DollarSign} {...form.register("fixedHourlyRate")} />
                        <NanoInput label="Client Hourly Rate" icon={DollarSign} {...form.register("clientHourlyRate")} />
                    </div>
                </div>

                {/* Save Button */}
                <button
                    type="submit"
                    className="w-full bg-zinc-900 text-white font-bold py-4 rounded-[20px] shadow-lg shadow-zinc-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    Save Changes
                </button>

                {/* Sign Out (Secondary) */}
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-[20px] active:scale-95 transition-transform flex items-center justify-center gap-2 mt-4"
                >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                </button>

                <div className="text-center text-zinc-400 text-xs font-medium pt-4">
                    PaintFlow Nano v2.1.0
                </div>

            </form>
        </div>
    );
}
