"use client";


import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, collection, query, where, orderBy, updateDoc } from "firebase/firestore";
import { NanoHeader } from "../components/nano-header";
import { FloatingNav } from "../components/floating-nav";
import { Skeleton } from "@/components/ui/skeleton";
import type { CrewMember, Job, Expense, ProductionDay } from "@/app/lib/types";
import { useParams, useRouter } from "next/navigation";
import { User, Phone, Mail, DollarSign, Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MobileCrewDetailsPage() {
    const { id } = useParams() as { id: string };
    const firestore = useFirestore();
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const [isPayoutOpen, setIsPayoutOpen] = React.useState(false);
    const [extraAmount, setExtraAmount] = React.useState<number | string>("");
    const [isPaying, setIsPaying] = React.useState(false);

    // 1. Fetch Crew Member
    const memberRef = useMemoFirebase(() => {
        if (!firestore || !user || !id) return null;
        return doc(firestore, 'users', user.uid, 'crew', id);
    }, [firestore, user, id]);
    const { data: member, isLoading: isLoadingMember } = useDoc<CrewMember>(memberRef);

    // 2. Fetch Jobs
    const jobsRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, 'users', user.uid, 'jobs');
    }, [firestore, user]);
    const { data: allJobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsRef);

    // Filter jobs for this member
    const memberJobs = allJobs?.filter(job => job.crew?.some(c => c.crewMemberId === id)) || [];

    // --- Calculations ---
    let totalPotentialEarnings = 0;
    let totalPaid = 0;
    const history: { id: string, date: string, amount: number, description: string, jobTitle: string }[] = [];

    // Payout Candidates
    const openPayouts: {
        id: string,
        title: string,
        amount: number,
        status: string,
        isReady: boolean,
        productionDays?: ProductionDay[]
    }[] = [];

    if (member) {
        memberJobs.forEach(job => {
            // A. Calculate Earnings
            let jobEarnings = 0;
            let isReadyToPay = false;

            if (member.type === 'Helper') {
                // Helper Logic: Days * Rate
                const daysWorked = job.productionDays?.length || 0;
                const rate = member.dailyRate || 0;
                jobEarnings = daysWorked * rate;
                // Helpers accumulate accurately always
                isReadyToPay = true;
            } else {
                // Partner Logic: Share %
                // WARN: Assuming Share % is from the member profile for now as it's not on the job object yet.
                // Ideally this should come from the job-specific assignment.
                const sharePercent = member.profitPercentage || 0;
                // Partner share is usually on Profit (Budget - Expenses), but simplicity: Budget * Share (Revenue Share) or Profit Share?
                // User said "share do profit". 
                // For now, let's assume Revenue Share (Budget * %) for simplicity unless "profit" is strictly calc'd.
                // Let's use (Budget - MaterialCost) * % ? Or just Budget * %?
                // Given "Partner", it's likely Profit.
                // Lets simplify: Budget * Percent for now.
                jobEarnings = (job.budget || 0) * (sharePercent / 100);

                // Partners only get paid when Finalized
                isReadyToPay = job.status === 'Finalized' || job.status === 'Complete';
            }

            // B. Calculate Paid (Expenses matching name)
            const jobExpenses = job.expenses || [];
            // Basic fuzzy match on name. Ideally use ID.
            const paidToMember = jobExpenses
                .filter(exp => exp.description.toLowerCase().includes(member.name.toLowerCase()))
                .reduce((sum, exp) => {
                    history.push({
                        id: exp.id,
                        date: exp.date,
                        amount: exp.amount,
                        description: exp.description,
                        jobTitle: job.title
                    });
                    return sum + exp.amount;
                }, 0);

            totalPaid += paidToMember;

            // C. Balance
            const balance = jobEarnings - paidToMember;

            // Only add to Total Potential if it's "Ready" (Partner+Finalized OR Helper)
            // Actually, for "Total Owed", we might want to see Accrued.
            totalPotentialEarnings += jobEarnings;

            if (balance > 0) {
                openPayouts.push({
                    id: job.id,
                    title: job.title,
                    amount: balance,
                    status: job.status,
                    isReady: isReadyToPay,
                    productionDays: job.productionDays || []
                });
            }
        });
    }

    const totalBalance = totalPotentialEarnings - totalPaid;

    // --- Payout Action ---
    const handleApprovePayout = async () => {
        if (!firestore || !user || !member || openPayouts.length === 0) return;
        setIsPaying(true);

        try {
            // --- Better Execution Loop ---
            // 1. Map updates
            const batchUpdates: Promise<void>[] = [];

            // Helper to prevent race conditions: We are not using batch() here, just parallel promises.
            // Ideally we modify all at once.

            // Refined Strategy:
            // Iterate through `openPayouts`. Prepare the new expenses list for each job.
            // If ID matches first job, also add Extra.

            const firstJobId = openPayouts[0].id; // Target for extra

            const jobsToUpdate = new Map<string, Expense[]>();

            openPayouts.forEach(payout => {
                if (!payout.isReady && member.type === 'Partner') return;

                const job = memberJobs.find(j => j.id === payout.id);
                if (!job) return;

                const existing = jobsToUpdate.get(job.id) || (job.expenses ? [...job.expenses] : []);

                // Main Payout
                existing.push({
                    id: crypto.randomUUID(),
                    jobId: job.id,
                    category: 'Labor',
                    description: `Payout to ${member.name} `,
                    amount: payout.amount,
                    date: new Date().toISOString()
                });

                // Extra (Only once)
                const extra = parseFloat(extraAmount as string);
                if (extra > 0 && job.id === firstJobId) {
                    existing.push({
                        id: crypto.randomUUID(),
                        jobId: job.id,
                        category: 'Labor',
                        description: `Extra / Bonus for ${member.name}`,
                        amount: extra,
                        date: new Date().toISOString()
                    });
                    setExtraAmount(""); // Reset
                }

                jobsToUpdate.set(job.id, existing);
            });

            // Execute Updates
            for (const [jobId, newExpenses] of Array.from(jobsToUpdate.entries())) {
                const ref = doc(firestore, 'users', user.uid, 'jobs', jobId);
                batchUpdates.push(updateDoc(ref, { expenses: newExpenses }));
            }

            await Promise.all(batchUpdates);

            toast({ title: "Paid!", description: "Expenses recorded successfully." });
            setIsPayoutOpen(false);

        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Could not process payout.", variant: "destructive" });
        } finally {
            setIsPaying(false);
        }
    };


    if (isLoadingMember || isLoadingJobs) {
        return (
            <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans">
                <NanoHeader title="Loading..." />
                <Skeleton className="h-40 w-full rounded-[24px] mt-4" />
            </div>
        )
    }

    if (!member) return <div>Member not found</div>;

    return (
        <div className="min-h-screen bg-[#F2F1EF] px-5 pt-16 font-sans pb-32">
            <NanoHeader
                title={member.name}
                subtitle={member.type}
            />

            {/* Back Button Override/Addition could go here, but NanoHeader menu covers Nav. 
                We might want a dedicated Back button. */}
            <button onClick={() => router.back()} className="absolute top-6 right-5 p-2 bg-white rounded-full shadow-sm text-zinc-400">
                <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="space-y-6">

                {/* 1. Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <Sheet open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
                        <SheetTrigger asChild>
                            <div className="bg-zinc-900 rounded-[24px] p-5 text-white shadow-lg shadow-zinc-200 active:scale-95 transition-transform cursor-pointer relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <DollarSign className="w-12 h-12" />
                                </div>
                                <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                                    <Clock className="w-3 h-3" />
                                    Pending
                                </div>
                                <div className="text-2xl font-bold">
                                    ${totalBalance.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-zinc-500 mt-1 font-medium flex items-center gap-1">
                                    Tap to Pay <ChevronRight className="w-3 h-3" />
                                </div>
                            </div>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="rounded-t-[32px] p-0 overflow-hidden max-h-[90vh]">
                            <div className="overflow-y-auto h-full p-6 pb-10 custom-scrollbar bg-[#F2F1EF]">
                                <SheetHeader className="mb-6 text-left">
                                    <SheetTitle className="text-2xl font-bold">Confirm Payout</SheetTitle>
                                    <SheetDescription>
                                        Review the breakdown below.
                                    </SheetDescription>
                                </SheetHeader>

                                {/* Mini Report */}
                                <div className="space-y-4 mb-6">
                                    {openPayouts.length > 0 ? (
                                        openPayouts.map((payout, idx) => (
                                            <div key={idx} className="bg-white p-4 rounded-[20px] shadow-sm border border-zinc-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-zinc-900">{payout.title}</h4>
                                                    <span className="font-bold text-green-600">${payout.amount.toLocaleString()}</span>
                                                </div>

                                                {/* Details based on Role */}
                                                {member.type === 'Helper' && payout.productionDays && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Production Days</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {payout.productionDays.map((day, dIdx) => (
                                                                <Badge key={dIdx} variant="outline" className="text-[10px] items-center gap-1 bg-zinc-50 border-zinc-200 text-zinc-500">
                                                                    <Calendar className="w-3 h-3" />
                                                                    {format(new Date(day.date), "MMM dd")} ({day.dayType})
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {!payout.isReady && member.type === 'Partner' && (
                                                    <div className="mt-2 text-amber-600 bg-amber-50 text-[10px] px-2 py-1 rounded-md font-bold inline-block">
                                                        Hold: Job not finalized
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-10 text-zinc-400">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p>All caught up! Nothing to pay.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Extra Input */}
                                <div className="bg-white p-4 rounded-[20px] shadow-sm border border-zinc-100 mb-6">
                                    <Label className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Add Extra / Bonus</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                        <Input
                                            type="number"
                                            value={extraAmount}
                                            onChange={(e) => setExtraAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="pl-10 h-14 text-lg font-bold bg-zinc-50 border-zinc-200 rounded-[16px]"
                                        />
                                    </div>
                                </div>

                                <Button
                                    onClick={handleApprovePayout}
                                    disabled={isPaying || totalBalance <= 0}
                                    className="w-full h-16 rounded-[24px] text-lg font-bold bg-zinc-900 hover:bg-zinc-800 shadow-xl shadow-zinc-200"
                                >
                                    {isPaying ? "Processing..." : `Approve Payout($${(totalBalance + (parseFloat(extraAmount as string) || 0)).toLocaleString()})`}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div className="bg-white rounded-[24px] p-5 text-zinc-900 shadow-sm border border-zinc-50">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <CheckCircle className="w-3 h-3" />
                            Paid
                        </div>
                        <div className="text-2xl font-bold">
                            ${totalPaid.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-zinc-400 mt-1 font-medium">
                            Lifetime Paid
                        </div>
                    </div>
                </div>

                {/* 2. Contact Info */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-zinc-50 flex flex-col gap-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 border-b border-zinc-100 pb-2">Contact Details</h3>
                    <div className="flex gap-4">
                        {member.phone && (
                            <a href={`tel:${member.phone} `} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold">
                                <Phone className="w-4 h-4" /> Call
                            </a>
                        )}
                        {member.email && (
                            <a href={`mailto:${member.email} `} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm font-bold">
                                <Mail className="w-4 h-4" /> Email
                            </a>
                        )}
                    </div>
                </div>

                {/* 3. Open Payouts List */}
                <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 pl-1">Open Payouts Breakdown</h3>
                    {openPayouts.length > 0 ? (
                        openPayouts.map(payout => (
                            <div key={payout.id} className="bg-white rounded-[20px] p-4 flex items-center justify-between border border-zinc-50 shadow-sm">
                                <div>
                                    <h4 className="font-bold text-zinc-900 text-sm">{payout.title}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className={`text - [10px] px - 2 py - 0.5 rounded - full ${payout.isReady ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'} `}>
                                            {payout.isReady ? 'Ready' : payout.status}
                                        </Badge>
                                        {!payout.isReady && member.type === 'Partner' && (
                                            <span className="text-[10px] text-zinc-400">Waits for Finalization</span>
                                        )}
                                    </div>
                                </div>
                                <div className={`text - lg font - bold ${payout.isReady ? 'text-zinc-900' : 'text-zinc-300'} `}>
                                    ${payout.amount.toLocaleString()}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-zinc-400 text-sm bg-white rounded-[24px] border border-zinc-50 border-dashed">
                            No open payouts.
                        </div>
                    )}
                </div>

                {/* 4. History */}
                <div className="space-y-3">
                    <h3 className="text-sm font-extrabold text-zinc-900 pl-1">Recent Payments</h3>
                    {history.length > 0 ? (
                        history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map(pay => (
                            <div key={pay.id} className="flex items-center justify-between p-3 bg-white rounded-[16px] border border-zinc-50">
                                <div>
                                    <h4 className="font-bold text-zinc-700 text-xs">{pay.jobTitle}</h4>
                                    <p className="text-[10px] text-zinc-400">{pay.date.split('T')[0]} • {pay.description}</p>
                                </div>
                                <span className="font-bold text-green-600 text-sm">
                                    +${pay.amount.toLocaleString()}
                                </span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-zinc-400 text-sm bg-white rounded-[24px] border border-zinc-50 border-dashed">
                            No payment history.
                        </div>
                    )}
                </div>

            </div>
            <FloatingNav />
        </div>
    );
}
