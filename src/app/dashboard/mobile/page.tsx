"use client";

import * as React from "react";
import Link from "next/link";
import { format, isFuture } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
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
    CalendarDays,
    Navigation,
    X
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
import { AddJobForm } from "../jobs/components/add-job-form";
import { FloatingNav } from "./components/floating-nav";
import { NanoHeader } from "./components/nano-header";
import { JobMap } from "@/components/job-map";
import { useETA } from "@/hooks/use-eta";

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
    const { duration, distance, loading, error } = useETA(job?.address);

    if (!job) return (
        <NanoGlassCard className="p-6 flex flex-col items-center justify-center h-[180px] text-zinc-400 bg-white">
            <p>No active jobs</p>
        </NanoGlassCard>
    );

    const mapLink = `https://maps.apple.com/?q=${encodeURIComponent(job.address)}`;
    // Placeholder map image style - in a real app, use a static map API
    const mapPlaceholderUrl = "https://placehold.co/400x400/e2e8f0/94a3b8?text=Map";

    // Formatting Price - use actual job budget (payout)
    const price = job.budget || job.initialValue || 0;

    return (
        <NanoGlassCard className="p-5 flex flex-col gap-4 bg-white shadow-sm border border-zinc-50">
            {/* Top Row: Title & Chevron */}
            <Link href={`/dashboard/mobile/jobs/${job.id}`} className="flex justify-between items-start group">
                <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-zinc-900 font-extrabold text-[22px] leading-none tracking-tight truncate mb-1">
                        {job.clientName ? job.clientName.split(' ')[0] : "Job"} #{job.quoteNumber || "0001"}
                    </h3>
                    <p className="text-zinc-500 font-normal text-sm truncate">
                        {job.clientName || "Client Name"}
                    </p>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-400 mt-1 shrink-0 group-active:text-zinc-600 transition-colors" />
            </Link>

            {/* Bottom Row: Content + Map */}
            <div className="flex gap-3 items-stretch">
                {/* Left Content (Address, Date, Price) */}
                <div className="flex flex-col justify-between flex-1 min-w-0">
                    <div className="flex flex-col gap-2">
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
                    <div className="mt-4 bg-[#F2F4F5] rounded-[14px] px-4 py-2 self-start flex items-center justify-center">
                        <span className="text-zinc-950 font-extrabold text-xl tracking-tight">$ {price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>

                {/* Right: Map Thumbnail / Navigation */}
                <a href={mapLink} target="_blank" rel="noreferrer" className="w-[124px] shrink-0 relative group">
                    <div className="w-full h-full rounded-[24px] overflow-hidden shadow-sm bg-zinc-100 relative active:scale-95 transition-transform border border-zinc-50">
                        {/* Interactive Map (Small) */}
                        <div className="absolute inset-0 pointer-events-none scale-[1.35] origin-center translate-y-[-10%] opacity-80">
                            <JobMap address={job.address} />
                        </div>
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

                        {/* Center Icon Overlay / Navigation Trigger */}
                        <div className={cn(
                            "absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-white backdrop-blur-[1px] transition-colors",
                            (error || !duration || duration === '-- min') ? "bg-zinc-900/60 active:bg-zinc-800" : "bg-blue-600/90 active:bg-blue-700"
                        )}>
                            {loading ? (
                                <div className="flex flex-col items-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mb-1" />
                                    <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Updating...</span>
                                </div>
                            ) : (error || !duration || duration === '-- min') ? (
                                <div className="flex flex-col items-center px-1 text-center">
                                    <div className="p-2 bg-white/20 rounded-full mb-1 backdrop-blur-sm shadow-sm ring-1 ring-white/30">
                                        <Navigation className="w-5 h-5 text-white fill-current" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-sm">Navigate</span>
                                    {error === 'HTTPS required for GPS' ? (
                                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-300 mt-1">
                                            Enable GPS
                                        </span>
                                    ) : (
                                        <span className="text-[7px] font-black uppercase tracking-widest opacity-60 mt-1">
                                            ETA N/A
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <span className="text-3xl font-black leading-none tracking-tighter">
                                        {duration.split(' ')[0]}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 opacity-90">
                                        {duration.split(' ')[1] || 'min'}
                                    </span>
                                    <div className="h-[1px] w-8 bg-white/30 mb-1" />
                                    <span className="text-[10px] font-bold leading-none opacity-80">
                                        {distance}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </a>
            </div>
        </NanoGlassCard>
    );
}

function ActionGrid({ upcomingJobs }: { upcomingJobs: { job: JobType }[] }) {
    const { toast } = useToast();
    const [isAddExpenseOpen, setAddExpenseOpen] = React.useState(false);
    const [isFormValid, setIsFormValid] = React.useState(false);
    const [isFormDirty, setIsFormDirty] = React.useState(false);
    const submitTriggerRef = React.useRef<(() => void) | null>(null);

    const { user } = useUser();
    const firestore = useFirestore();
    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'generalExpenses');
    }, [firestore, user]);
    const { data: expenses } = useCollection<GeneralExpense>(expensesQuery);
    const categories = [...new Set(expenses?.map((e) => e.category).filter(Boolean))] as string[];

    const handleFormStateChange = (isValid: boolean, isDirty: boolean) => {
        setIsFormValid(isValid);
        setIsFormDirty(isDirty);
    };

    const handleSubmit = () => {
        if (submitTriggerRef.current) {
            submitTriggerRef.current();
        }
    };

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

            <Sheet open={isAddExpenseOpen} onOpenChange={setAddExpenseOpen}>
                <SheetContent side="bottom" className="bg-[#F2F2F7]">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-1">
                        {/* iOS Close Button (Left) */}
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">New Expense</SheetTitle>

                        {/* iOS Submit Button (Right) */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isFormValid
                                ? 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
                                : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
                                }`}
                        >
                            <ChevronRight className="w-4 h-4 rotate-[-90deg] stroke-[3]" />
                        </button>
                        <SheetDescription className="sr-only">Track your business expenses</SheetDescription>
                    </SheetHeader>
                    <AddGeneralExpenseForm
                        categories={categories || []}
                        onFormStateChange={handleFormStateChange}
                        submitTriggerRef={submitTriggerRef}
                        onSuccess={() => {
                            setAddExpenseOpen(false);
                            toast({ title: "Expense Added", description: "Expense logged successfully." });
                        }}
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}



// ---------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------

export default function MobileDashboardPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    // -- Job Modal Logic --
    const [isAddJobOpen, setAddJobOpen] = React.useState(false);
    const [isJobFormValid, setIsJobFormValid] = React.useState(false);
    const jobSubmitTriggerRef = React.useRef<(() => void) | null>(null);
    const handleJobSubmit = () => { jobSubmitTriggerRef.current?.(); };

    // Data Logic
    const allJobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, "users", user.uid, "jobs"), orderBy("startDate", "desc"));
    }, [firestore, user]);
    const { data: allJobs, isLoading } = useCollection<JobType>(allJobsQuery);

    const targetJobId = "wT6U4DWMNlk6Swa2PKbM";
    const targetJob = allJobs?.find(j => j.id === targetJobId);
    const inProgressJobs = allJobs?.filter(job => job.status === "In Progress") || [];

    // Hero Card Logic: Prioritize In Progress jobs, then most recent
    const currentJob = inProgressJobs[0] || allJobs?.[0] || null;

    // Upcoming Logic: Only show "Not Started" jobs
    const upcomingJobs = (allJobs || [])
        .filter(j => j.status === "Not Started")
        .map(j => ({ job: j }))
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden selection:bg-rose-200">
            {/* Background Color is slightly warmer gray per mockup */}

            <div className="px-5 pt-16 relative z-10 max-w-md mx-auto">
                {/* 1. Header */}
                <NanoHeader
                    subtitle={`Hello ${user?.displayName?.split(' ')[0] || 'User'},`}
                    title={"What we gonna\ndo today?"}
                />

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
            {/* 5. Floating Nav */}
            <FloatingNav onPrimaryClick={() => setAddJobOpen(true)} />

            {/* 6. New Job Sheet */}
            <Sheet open={isAddJobOpen} onOpenChange={setAddJobOpen}>
                <SheetContent side="bottom" className="bg-[#F2F2F7]">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-1">
                        {/* iOS Close Button (Left) */}
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">New Job</SheetTitle>

                        {/* iOS Submit Button (Right) */}
                        <button
                            type="button"
                            onClick={handleJobSubmit}
                            disabled={!isJobFormValid}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isJobFormValid
                                ? 'bg-[#007AFF] text-white hover:bg-[#0051D5]'
                                : 'bg-[#E5E5EA] text-[#8E8E93] cursor-not-allowed'
                                }`}
                        >
                            <ChevronRight className="w-4 h-4 rotate-[-90deg] stroke-[3]" />
                        </button>
                    </SheetHeader>
                    <AddJobForm
                        onSuccess={() => {
                            setAddJobOpen(false);
                            toast({ title: "Job Created", description: "New job added successfully." });
                        }}
                        onFormStateChange={(isValid) => setIsJobFormValid(isValid)}
                        submitTriggerRef={jobSubmitTriggerRef}
                    />
                </SheetContent>
            </Sheet>

            {/* Overlay Nav from Mockup (Dark Bar) positioned exactly over bottom of content? 
                Actually the FloatingNav above handles this function. 
            */}
        </div>
    );
}
