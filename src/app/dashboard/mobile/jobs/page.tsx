"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import type { Job } from "@/app/lib/types";
import { cn } from "@/lib/utils";
import { Search, Menu, ArrowLeft, X, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MobileJobCard } from "./components/mobile-job-card";
import { FloatingNav } from "../components/floating-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { AddJobForm } from "@/app/dashboard/jobs/components/add-job-form";
import React from "react";

type JobStatus = Job['status'];

const statusOrder: JobStatus[] = ["In Progress", "Not Started", "Open Payment", "Complete", "Finalized"];

const filters: { label: string; value: JobStatus | "all" }[] = [
    { label: "Not Started", value: "Not Started" },
    { label: "In Progress", value: "In Progress" },
    { label: "Complete", value: "Complete" },
    { label: "Open Payment", value: "Open Payment" },
    { label: "Finalized", value: "Finalized" },
];

export default function MobileJobsListPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const [activeFilter, setActiveFilter] = useState<JobStatus | "all">("all");
    const [searchTerm, setSearchTerm] = useState("");

    // -- Job Modal Logic --
    const [isAddJobOpen, setAddJobOpen] = useState(false);
    const [isJobFormValid, setIsJobFormValid] = useState(false);
    const { toast } = useToast();
    const jobSubmitTriggerRef = React.useRef<(() => void) | null>(null);
    const handleJobSubmit = () => { jobSubmitTriggerRef.current?.(); };

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'users', user.uid, 'jobs'), orderBy("startDate", "desc"));
    }, [firestore, user]);

    const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

    const filteredAndSortedJobs = useMemo(() => {
        if (!jobs) return [];

        const filtered = jobs
            .filter(job => {
                // Filter by status
                const statusMatch = activeFilter === 'all' || job.status === activeFilter;
                if (!statusMatch) return false;

                // Filter by search term
                if (searchTerm) {
                    const lowerCaseSearch = searchTerm.toLowerCase();
                    const clientNameMatch = job.clientName.toLowerCase().includes(lowerCaseSearch);
                    const addressMatch = job.address.toLowerCase().includes(lowerCaseSearch);
                    const titleMatch = job.title?.toLowerCase().includes(lowerCaseSearch);
                    const quoteMatch = job.quoteNumber?.toLowerCase().includes(lowerCaseSearch);

                    return clientNameMatch || addressMatch || titleMatch || quoteMatch;
                }

                return true;
            });

        // Sort
        return filtered.sort((a, b) => {
            const statusIndexA = statusOrder.indexOf(a.status);
            const statusIndexB = statusOrder.indexOf(b.status);
            if (statusIndexA !== statusIndexB) {
                return statusIndexA - statusIndexB;
            }
            return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });

    }, [jobs, activeFilter, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-8 pb-32 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <Menu className="w-6 h-6 text-zinc-800" />
                <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden">
                    {/* Abstract Avatar if needed, or user image */}
                    {user?.photoURL && <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />}
                </div>
            </div>

            <h1 className="text-[34px] font-extrabold text-black leading-none tracking-tight mb-6">
                My Jobs
            </h1>

            {/* Search Bar */}
            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-12 rounded-[16px] border-none bg-white pl-5 pr-12 text-[17px] text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:ring-0"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            </div>

            {/* Filter Tabs (Scrollable) */}
            <div className="flex gap-2 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar mb-4">
                {/* 'All' isn't in mockup but usually helpful. Mockup starts with "Not Started" */}
                <button
                    onClick={() => setActiveFilter("all")}
                    className={cn(
                        "whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors",
                        activeFilter === "all"
                            ? "bg-white text-zinc-900 shadow-sm"
                            : "bg-transparent text-zinc-500 hover:text-zinc-700"
                    )}
                >
                    All
                </button>
                {filters.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setActiveFilter(filter.value)}
                        className={cn(
                            "whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors relative",
                            // Mockup style: Selected looks like a white pill? Or simple text? 
                            // Image shows: Not Started | In Progress | ...
                            // They behave like text links separated by bars? No, looks like a segmented control or pills.
                            // Let's stick to Pill style for touch targets.
                            activeFilter === filter.value
                                ? "bg-white text-zinc-900 shadow-sm"
                                : "bg-transparent text-zinc-500 hover:text-zinc-700"
                        )}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Job List */}
            <div className="flex flex-col gap-4">
                {isLoading ? (
                    <>
                        <Skeleton className="h-[200px] w-full rounded-[24px]" />
                        <Skeleton className="h-[200px] w-full rounded-[24px]" />
                    </>
                ) : filteredAndSortedJobs.length > 0 ? (
                    filteredAndSortedJobs.map(job => (
                        <MobileJobCard key={job.id} job={job} />
                    ))
                ) : (
                    <div className="text-center py-10 text-zinc-400">
                        <p>No jobs found.</p>
                    </div>
                )}
            </div>

            <FloatingNav onPrimaryClick={() => setAddJobOpen(true)} />

            {/* New Job Sheet */}
            <Sheet open={isAddJobOpen} onOpenChange={setAddJobOpen}>
                <SheetContent side="bottom" className="bg-[#F2F2F7]">
                    <SheetHeader className="flex flex-row items-center justify-between py-2.5 px-1">
                        <SheetClose className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center transition-opacity active:opacity-70">
                            <X className="w-3.5 h-3.5 text-[#8E8E93] stroke-[3]" />
                        </SheetClose>

                        <SheetTitle className="text-[17px] font-semibold text-center !m-0 flex-1">New Job</SheetTitle>

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
        </div>
    );
}
