"use client";

import * as React from "react";
import Link from "next/link";
import { format, startOfToday, addDays, isWithinInterval, parseISO, isSameDay, formatDistanceToNow, isFuture } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Icons 
// Using Stroke Width 1.5 for "Lightness"
import {
    Plus,
    CreditCard,
    Navigation,
    Store,
    Briefcase,
    CalendarDays,
    Home,
    TrendingUp,
    MapPin
} from "lucide-react";

// Firebase
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";

// Types
import type { Job as JobType, GeneralSettings, GeneralExpense } from "@/app/lib/types";

// Utils
import { cn } from "@/lib/utils";
import { calculateJobPayout, calculateMaterialCost } from "@/app/lib/job-financials";

// Components
import { RevenueChart } from "../components/revenue-chart";
import { AddGeneralExpenseForm } from "../finance/components/add-general-expense-form";

// ---------------------------------------------------------------------
// NANO-UI COMPONENTS (v3)
// ---------------------------------------------------------------------

function NanoGlassCard({ className, children, onClick }: { className?: string, children: React.ReactNode, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white/80 backdrop-blur-xl rounded-[24px] border border-white/50 shadow-sm transition-all",
                onClick && "active:scale-[0.98] active:shadow-none cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}

function NanoActionButton({ icon: Icon, label, onClick, variant = "light" }: { icon: any, label: string, onClick?: () => void, variant?: "light" | "dark" }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center p-4 rounded-[20px] w-full aspect-square transition-all active:scale-95",
                variant === "light"
                    ? "bg-white border border-zinc-100 shadow-sm"
                    : "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20"
            )}
        >
            <Icon strokeWidth={1.5} className={cn("w-7 h-7 mb-2", variant === "light" ? "text-zinc-700" : "text-white")} />
            <span className={cn("text-xs font-medium", variant === "light" ? "text-zinc-600" : "text-zinc-300")}>{label}</span>
        </button>
    );
}

// ---------------------------------------------------------------------
// MAIN COMPONENTS
// ---------------------------------------------------------------------

function QuickActions() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isAddExpenseOpen, setAddExpenseOpen] = React.useState(false);

    // Fetch categories for expense form
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'generalExpenses');
    }, [firestore, user]);
    const { data: expenses } = useCollection<GeneralExpense>(expensesQuery);
    const categories = [...new Set(expenses?.map((e) => e.category).filter(Boolean))] as string[];

    return (
        <>
            <div className="grid grid-cols-2 gap-4 w-full">
                <Link href="/dashboard/jobs/new" className="w-full">
                    <NanoActionButton
                        icon={Plus}
                        label="New Job"
                        variant="light" // Kept light per v3 request "Lightness"
                    />
                </Link>
                <NanoActionButton
                    icon={CreditCard}
                    label="Add Expense"
                    onClick={() => setAddExpenseOpen(true)}
                    variant="light"
                />
            </div>

            <Dialog open={isAddExpenseOpen} onOpenChange={setAddExpenseOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Expense</DialogTitle>
                    </DialogHeader>
                    <AddGeneralExpenseForm
                        categories={categories || []}
                        onSuccess={() => {
                            setAddExpenseOpen(false);
                            toast({ title: "Expense Added", description: "Expense logged successfully." });
                        }}
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

function HeroJobCard({ job }: { job: JobType }) {
    if (!job) return (
        <NanoGlassCard className="p-6 flex flex-col items-center justify-center h-[180px] text-zinc-400">
            <Briefcase className="w-8 h-8 mb-2 opacity-50" />
            <p>No active jobs</p>
        </NanoGlassCard>
    );

    const mapLink = `https://maps.apple.com/?q=${encodeURIComponent(job.address)}`;

    return (
        <NanoGlassCard className="p-6 relative overflow-hidden">
            {/* Header: Context */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-zinc-500 font-medium text-xs tracking-wider uppercase mb-1">
                        {job.title || "Project"}
                    </h3>
                    <p className="text-zinc-900 font-semibold text-lg leading-none">
                        {job.clientName || "Client"}
                    </p>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100">
                    In Progress
                </Badge>
            </div>

            {/* Main Action: Map Pill (The "Apple Maps" style button) */}
            <a href={mapLink} target="_blank" rel="noreferrer" className="block">
                <div className="bg-blue-600 active:bg-blue-700 text-white rounded-full px-5 py-3.5 flex items-center justify-between shadow-lg shadow-blue-900/20 transition-transform active:scale-95">
                    <span className="font-bold text-lg truncate pr-4">{job.address}</span>
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <Navigation className="w-4 h-4 text-white" />
                    </div>
                </div>
            </a>
        </NanoGlassCard>
    );
}

function FloatingNav() {
    const navItems = [
        { icon: Home, label: "Home", active: true },
        { icon: Briefcase, label: "Jobs", href: "/dashboard/jobs" },
        { icon: CalendarDays, label: "Cal", href: "/dashboard/calendar" },
        { icon: TrendingUp, label: "Finance", href: "/dashboard/finance" },
    ];

    return (
        <div className="fixed bottom-6 left-4 right-4 h-16 bg-zinc-900/90 backdrop-blur-md rounded-full shadow-2xl flex items-center justify-around px-2 z-50">
            {navItems.map((item) => (
                item.href ? (
                    <Link key={item.label} href={item.href} className="flex flex-col items-center justify-center w-16 h-full">
                        <item.icon className="w-6 h-6 text-zinc-500" strokeWidth={1.5} />
                    </Link>
                ) : (
                    <div key={item.label} className="flex flex-col items-center justify-center w-16 h-full relative">
                        <item.icon className="w-6 h-6 text-white" strokeWidth={2} />
                        <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"></div>
                    </div>
                )
            ))}
        </div>
    );
}

// ---------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------

export default function MobileDashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Fetch Jobs Logic (Reused)
    const allJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "users", user.uid, "jobs"), orderBy("startDate", "desc"));
    }, [firestore, user]);
    const { data: allJobs, isLoading } = useCollection<JobType>(allJobsQuery);

    const inProgressJobs = allJobs?.filter(job => job.status === "In Progress") || [];
    const currentJob = inProgressJobs[0] || null; // Just take the latest

    return (
        <div className="min-h-screen bg-zinc-50 pb-32 font-sans relative overflow-x-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed top-[-10%] left-[-20%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="fixed bottom-[10%] right-[-20%] w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="px-6 pt-12 relative z-10 max-w-md mx-auto">
                {/* 1. Header: Off-tone + Bold */}
                <div className="mb-8">
                    <h1 className="text-4xl tracking-tight leading-[0.9]">
                        <span className="block text-zinc-400 font-medium">Hello,</span>
                        <span className="block text-zinc-900 font-extrabold">{user?.displayName?.split(' ')[0] || 'User'}</span>
                    </h1>
                </div>

                {/* 2. Hero Job Card */}
                <div className="mb-8">
                    {isLoading ? (
                        <Skeleton className="h-[200px] w-full rounded-[24px]" />
                    ) : (
                        <HeroJobCard job={currentJob!} />
                    )}
                </div>

                {/* 3. Action Row */}
                <div className="mb-8">
                    <QuickActions />
                </div>

                {/* 4. Revenue Overview */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-zinc-900">Revenue Overview</h2>
                        <Link href="/dashboard/finance" className="text-sm text-blue-600 font-medium">View All</Link>
                    </div>
                    <NanoGlassCard className="p-4">
                        <div className="h-[200px] w-full">
                            <RevenueChart />
                        </div>
                    </NanoGlassCard>
                </div>
            </div>

            {/* 5. Floating Nav */}
            <FloatingNav />
        </div>
    );
}
