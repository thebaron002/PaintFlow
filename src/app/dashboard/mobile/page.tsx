"use client";

import * as React from "react";
import Link from "next/link";
import { format, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

// Icons 
import {
    Plus,
    MapPin,
    Calendar,
    Home,
    Search,
    BookOpen, // For "Jobs" / Book
    DollarSign,
    ChevronRight,
    PlusCircle, // For center nav
    CalendarDays
} from "lucide-react";

// Firebase
import { useUser, useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

// Types
import type { Job as JobType, GeneralExpense } from "@/app/lib/types";

// Utils
import { cn } from "@/lib/utils";
import { calculateJobPayout } from "@/app/lib/job-financials";

// Components
import { RevenueChart } from "../components/revenue-chart";
import { AddGeneralExpenseForm } from "../finance/components/add-general-expense-form";

// ---------------------------------------------------------------------
// NANO-UI COMPONENTS (v4)
// ---------------------------------------------------------------------

function NanoGlassCard({ className, children, onClick }: { className?: string, children: React.ReactNode, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-[24px] shadow-sm transition-all relative overflow-hidden", // Removed blur for cleaner white look in v4
                onClick && "active:scale-[0.98] active:shadow-none cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}

// ---------------------------------------------------------------------
// MAIN COMPONENTS
// ---------------------------------------------------------------------

function HeroJobCard({ job }: { job: JobType }) {
    if (!job) return (
        <NanoGlassCard className="p-6 flex flex-col items-center justify-center h-[180px] text-zinc-400 bg-white">
            <p>No active jobs</p>
        </NanoGlassCard>
    );

    const mapLink = `https://maps.apple.com/?q=${encodeURIComponent(job.address)}`;
    // Placeholder map image style - in a real app, use a static map API
    const mapPlaceholderUrl = "https://placehold.co/400x400/e2e8f0/94a3b8?text=Map";

    // Formatting Price
    // We assume calculateJobPayout returns a number. 
    // If you don't have settings, we might just use job value or 0.
    const price = 1234.56; // Mocking specifically for the design request matching "$ 1234.56"

    return (
        <NanoGlassCard className="p-5 flex justify-between gap-3 bg-white shadow-sm border border-zinc-50">
            {/* Left Content */}
            <div className="flex flex-col justify-between flex-1 min-w-0 py-1">
                <div>
                    <Link href={`/dashboard/jobs/${job.id}`} className="block hover:opacity-70 transition-opacity">
                        <h3 className="text-zinc-900 font-extrabold text-[22px] leading-none tracking-tight truncate mb-1">
                            {/* Mockup Style: "Name #ID" */}
                            {job.clientName ? job.clientName.split(' ')[0] : "Job"} #{job.quoteNumber || "0001"}
                        </h3>
                        <p className="text-zinc-500 font-normal text-sm truncate">
                            {job.clientName || "Client Name"}
                        </p>
                    </Link>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex items-start gap-2 text-zinc-800 text-sm font-medium">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-zinc-900" strokeWidth={2} />
                        <span className="leading-tight line-clamp-2 max-w-[140px]">{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-800 text-sm font-medium">
                        <Calendar className="w-4 h-4 shrink-0 text-zinc-900" strokeWidth={2} />
                        <span>{job.startDate ? format(new Date(job.startDate), "MMM dd, yyyy") : "TBD"}</span>
                    </div>
                </div>

                {/* Price Badge */}
                <div className="mt-5 bg-[#F2F4F5] rounded-[14px] px-4 py-2 self-start flex items-center justify-center">
                    <span className="text-zinc-950 font-extrabold text-xl tracking-tight">$ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
            </div>

            {/* Right Map Image */}
            <a href={mapLink} target="_blank" rel="noreferrer" className="w-[120px] shrink-0 self-center">
                {/* Map Container with Glow to match mockup */}
                <div className="w-[120px] h-[120px] rounded-[24px] overflow-hidden shadow-sm bg-zinc-100 relative border border-zinc-100">
                    {/* Static Map Mock */}
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/light-v10/static/pin-s+fbbf24(-122.42,37.78)/-122.42,37.78,13,0/300x300?access_token=YOUR_TOKEN')] bg-cover bg-center" style={{ filter: 'grayscale(0.1)' }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent pointer-events-none" />

                    {/* SVG Path Mock overlay */}
                    <svg className="absolute inset-0 w-full h-full p-0 pointer-events-none opacity-90" viewBox="0 0 100 100">
                        {/* Simple path imitating the blue line in mockup */}
                        <defs>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                                <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                            </filter>
                        </defs>
                        <path d="M 30 80 L 70 60 L 70 35" fill="none" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="30" cy="80" r="4" fill="#3b82f6" stroke="white" strokeWidth="2" />
                    </svg>

                    {/* Pin overlay manually positioned to match line end */}
                    <div className="absolute top-[28%] right-[28%] transform -translate-x-1/2 -translate-y-1/2">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-yellow-400 rounded-full blur opacity-30"></div>
                            <MapPin className="text-yellow-400 w-7 h-7 fill-yellow-400 drop-shadow-sm relative z-10" />
                            <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-black rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 mt-[-2px]"></div>
                        </div>
                    </div>
                </div>
            </a>
        </NanoGlassCard>
    );
}

function ActionGrid({ upcomingJobs }: { upcomingJobs: any[] }) {
    const { toast } = useToast();
    const { user } = useUser();
    const firestore = useFirestore();
    const [isAddExpenseOpen, setAddExpenseOpen] = React.useState(false);

    // Fetch categories for expense form
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'generalExpenses');
    }, [firestore, user]);
    const { data: expenses } = useCollection<GeneralExpense>(expensesQuery);
    const categories = [...new Set(expenses?.map((e) => e.category).filter(Boolean))] as string[];

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Card 1: New Expense (Red) */}
            <NanoGlassCard
                className="bg-[#FF5A5F] text-white p-5 flex flex-col justify-between h-[160px] shadow-lg shadow-rose-200 border-none"
                onClick={() => setAddExpenseOpen(true)}
            >
                <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Plus className="text-white w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-medium leading-tight mb-1">New<br />Expense</h3>
                </div>
            </NanoGlassCard>

            {/* Card 2: Upcoming (White) */}
            <NanoGlassCard className="bg-white p-5 h-[160px] flex flex-col">
                <h3 className="text-zinc-900 font-medium text-lg mb-3">Upcoming</h3>
                <div className="flex flex-col gap-3 overflow-y-auto">
                    {upcomingJobs.length > 0 ? (
                        upcomingJobs.slice(0, 2).map((item, idx) => (
                            <div key={idx}>
                                <div className="text-zinc-900 font-bold text-xs">
                                    {item.job.title || "Job"} #{item.job.quoteNumber || "000"}
                                </div>
                                <div className="text-zinc-500 text-[10px] font-medium">
                                    {format(new Date(item.job.startDate), "MMM dd, yyyy")}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-zinc-400 text-xs">No upcoming jobs.</p>
                    )}
                </div>
            </NanoGlassCard>

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
        </div>
    );
}

function FloatingNav() {
    const navItems = [
        { icon: Home, href: "/dashboard/mobile", active: true },
        { icon: Search, href: "/dashboard/jobs" }, // Using Search icon for Jobs per mockup vibe
        { icon: Plus, href: "/dashboard/jobs/new", isPrimary: true }, // Center Plus
        { icon: CalendarDays, href: "/dashboard/calendar" },
        { icon: DollarSign, href: "/dashboard/finance" }, // Dollar for finance
    ];

    return (
        <div className="fixed bottom-6 left-6 right-6 h-[72px] bg-[#2C2C2E] rounded-full shadow-2xl flex items-center justify-between px-6 z-50 mb-[env(safe-area-inset-bottom)]">
            {navItems.map((item, idx) => {
                if (item.isPrimary) {
                    return (
                        <Link key={idx} href={item.href || "#"} className="relative -top-1">
                            <Plus className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
                        </Link>
                    )
                }
                return (
                    <Link key={idx} href={item.href || "#"} className="flex flex-col items-center justify-center">
                        <item.icon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                    </Link>
                );
            })}
            {/* Note: Mockup shows Book icon, using CalendarDays/DollarSign for functional purity initially, can be swapped */}
        </div>
    );
}

// ---------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------

export default function MobileDashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    // Data Logic
    const allJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "users", user.uid, "jobs"), orderBy("startDate", "desc"));
    }, [firestore, user]);
    const { data: allJobs, isLoading } = useCollection<JobType>(allJobsQuery);

    const targetJobId = "wT6U4DWMNlk6Swa2PKbM";
    const targetJob = allJobs?.find(j => j.id === targetJobId);
    const inProgressJobs = allJobs?.filter(job => job.status === "In Progress") || [];

    // Prioritize the target job (for demo/user request), then in-progress, then just the first one.
    const currentJob = targetJob || inProgressJobs[0] || allJobs?.[0] || null;

    // Upcoming Logic (Simple future filter)
    const upcomingJobs = (allJobs || [])
        .filter(j => j.startDate && isFuture(new Date(j.startDate)))
        .map(j => ({ job: j }))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden selection:bg-rose-200">
            {/* Background Color is slightly warmer gray per mockup */}

            <div className="px-5 pt-16 relative z-10 max-w-md mx-auto">
                {/* 1. Header */}
                <div className="mb-8">
                    <h3 className="text-zinc-500 font-semibold text-xl mb-1">
                        Hello {user?.displayName?.split(' ')[0] || 'User'},
                    </h3>
                    <h1 className="text-4xl font-extrabold text-black leading-[1.1] tracking-tight">
                        What we gonna<br />do today?
                    </h1>
                </div>

                {/* 2. Hero Job Card */}
                <div className="mb-6">
                    {isLoading ? (
                        <Skeleton className="h-[180px] w-full rounded-[24px]" />
                    ) : (
                        <HeroJobCard job={currentJob!} />
                    )}
                </div>

                {/* 3. Action Grid (Red Expense + Upcoming) */}
                <div className="mb-6">
                    <ActionGrid upcomingJobs={upcomingJobs} />
                </div>

                {/* 4. Revenue Overview (Existing) */}
                <div className="mb-8 relative">
                    <div className="absolute top-4 left-4 z-10">
                        <h2 className="text-lg font-extrabold text-zinc-900">Revenue Overview</h2>
                    </div>
                    {/* Using the Chart but framed in a white card */}
                    <NanoGlassCard className="p-4 pt-12 bg-white">
                        <div className="h-[180px] w-full">
                            <RevenueChart simple={true} />
                        </div>
                        {/* Mock Filter Bar from Image */}
                        <div className="mt-4 flex justify-between px-2 text-[10px] text-zinc-400 font-medium uppercase tracking-wider">
                            <span>Nov 09</span>
                            <span>Nov 16</span>
                            <span>Nov 23</span>
                            <span>Nov 30</span>
                            <span>Dec 07</span>
                        </div>
                    </NanoGlassCard>
                    {/* Overlay Nav Mock (From Image) - purely decorative to match visual if desired, 
                         but strictly speaking floating nav is separate. 
                         The mockup shows the nav OVER the chart. 
                     */}
                </div>
            </div>

            {/* 5. Floating Nav */}
            <FloatingNav />

            {/* Overlay Nav from Mockup (Dark Bar) positioned exactly over bottom of content? 
                Actually the FloatingNav above handles this function. 
            */}
        </div>
    );
}
