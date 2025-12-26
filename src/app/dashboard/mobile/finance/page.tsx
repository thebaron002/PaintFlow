"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Banknote,
    Receipt,
    Plus,
    ChevronRight,
    LoaderCircle,
    ReceiptText,
    Banknote as PayIcon
} from "lucide-react";

// Types
import type { Job, GeneralSettings, GeneralExpense } from "@/app/lib/types";

// UI Components
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet";
import { AddGeneralExpenseForm } from "../../finance/components/add-general-expense-form";

// Firebase
import {
    useUser,
    useFirestore,
    useMemoFirebase,
    useCollection,
    useDoc
} from "@/firebase";
import { collection, doc } from "firebase/firestore";

// Shared Logic
import { useFinanceData } from "@/hooks/use-finance-data";
import { FloatingNav } from "../components/floating-nav";
import { NanoHeader } from "../components/nano-header";

// ---------------------------------------------------------------------
// NANO-UI COMPONENTS
// ---------------------------------------------------------------------

function NanoGlassCard({ className, children, onClick }: { className?: string, children: React.ReactNode, onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "bg-white rounded-[24px] shadow-sm transition-all relative overflow-hidden",
                onClick && "active:scale-[0.98] active:shadow-none cursor-pointer",
                className
            )}
        >
            {children}
        </div>
    );
}

function StatItem({ label, value, trend, icon: Icon, colorClass, isLoading }: {
    label: string,
    value: number,
    trend?: number,
    icon: any,
    colorClass: string,
    isLoading: boolean
}) {
    return (
        <NanoGlassCard className="p-5">
            <div className="flex justify-between items-start mb-2">
                <div className={cn("p-2 rounded-xl bg-opacity-10", colorClass.replace('text-', 'bg-').replace('600', '50'))}>
                    <Icon className={cn("w-5 h-5", colorClass)} />
                </div>
                {trend !== undefined && (
                    <div className={cn(
                        "flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full",
                        trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                    )}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            <div className="flex flex-col">
                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">{label}</span>
                {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                    <span className="text-2xl font-extrabold text-zinc-950 tracking-tight mt-1">
                        $ {value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                )}
            </div>
        </NanoGlassCard>
    );
}

// ---------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------

export default function MobileFinancePage() {
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();

    // -- State --
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date())
    });

    // -- Data Fetching --
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, "settings", "global");
    }, [firestore]);
    const { data: settings, isLoading: isLoadingSettings } = useDoc<GeneralSettings>(settingsRef);

    const jobsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, "users", user.uid, "jobs");
    }, [firestore, user]);
    const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

    const expensesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return collection(firestore, "users", user.uid, "generalExpenses");
    }, [firestore, user]);
    const { data: generalExpenses, isLoading: isLoadingExpenses } = useCollection<GeneralExpense>(expensesQuery);

    const isLoading = isLoadingJobs || isLoadingExpenses || isLoadingSettings;

    // -- Financial Calculations (Shared Hook) --
    const {
        totalIncome,
        totalExpenses,
        netProfit,
        estimatedTax,
        trends,
        expenses: filteredExpenses,
        income: filteredIncome
    } = useFinanceData(jobs || [], generalExpenses || [], settings, date);

    // -- Form State --
    const [isExpenseSheetOpen, setIsExpenseSheetOpen] = React.useState(false);
    const [isFormValid, setIsFormValid] = React.useState(false);
    const submitTriggerRef = React.useRef<(() => void) | null>(null);

    // Merge transactions for recent list
    const allTransactions = React.useMemo(() => {
        const t = [
            ...filteredIncome.map(i => ({ ...i, category: "Job Payment", type: "income" })),
            ...filteredExpenses.map(e => ({ ...e, type: "expense" }))
        ];
        return t.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [filteredIncome, filteredExpenses]);

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden">
            <div className="px-5 pt-16 max-w-md mx-auto">
                <NanoHeader
                    subtitle="Financials,"
                    title={"Cash Flow &\nProfits"}
                />

                <NanoGlassCard className="p-1 border border-zinc-100 shadow-sm overflow-visible z-50 mb-6">
                    <DatePickerWithRange
                        date={date}
                        setDate={setDate}
                        className="w-full border-none shadow-none focus-within:ring-0"
                    />
                </NanoGlassCard>

                {/* Quick Actions */}
                <div className="flex gap-3 mb-8">
                    <Sheet open={isExpenseSheetOpen} onOpenChange={setIsExpenseSheetOpen}>
                        <SheetTrigger asChild>
                            <button className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-zinc-100 flex flex-col items-center gap-2 active:scale-95 transition-all">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
                                    <ReceiptText className="w-5 h-5 text-rose-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">New Expense</span>
                            </button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[92%] rounded-t-[32px] p-0 overflow-hidden border-none">
                            <div className="h-full flex flex-col pt-6">
                                <SheetHeader className="px-6 pb-2">
                                    <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-4" />
                                    <SheetTitle className="text-2xl font-black tracking-tight">Add Expense</SheetTitle>
                                    <SheetDescription className="font-medium">Record a company or tool expense.</SheetDescription>
                                </SheetHeader>

                                <div className="flex-1 overflow-y-auto px-6">
                                    <AddGeneralExpenseForm
                                        categories={[]}
                                        onSuccess={() => setIsExpenseSheetOpen(false)}
                                        onFormStateChange={(valid) => setIsFormValid(valid)}
                                        submitTriggerRef={submitTriggerRef}
                                    />
                                </div>

                                <div className="p-6 bg-white border-t border-zinc-100">
                                    <Button
                                        className="w-full h-14 rounded-2xl bg-zinc-950 font-black text-white hover:bg-zinc-800 disabled:opacity-50"
                                        onClick={() => submitTriggerRef.current?.()}
                                        disabled={!isFormValid}
                                    >
                                        Save Expense
                                    </Button>
                                    <SheetClose asChild>
                                        <Button variant="ghost" className="w-full mt-2 font-bold h-12">Cancel</Button>
                                    </SheetClose>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <button
                        onClick={() => router.push('/dashboard/mobile/payroll')}
                        className="flex-1 bg-white p-4 rounded-[24px] shadow-sm border border-zinc-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
                    >
                        <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <PayIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-900">Pay Crew</span>
                    </button>
                </div>

                {/* 2. Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatItem
                        label="Total Income"
                        value={totalIncome}
                        trend={trends.income}
                        icon={TrendingUp}
                        colorClass="text-emerald-600"
                        isLoading={isLoading}
                    />
                    <StatItem
                        label="Expenses"
                        value={totalExpenses}
                        trend={trends.expenses}
                        icon={TrendingDown}
                        colorClass="text-rose-600"
                        isLoading={isLoading}
                    />
                </div>

                {/* 3. Main Profit Focus Card */}
                <NanoGlassCard className="p-6 mb-8 bg-zinc-950 text-white shadow-xl shadow-zinc-200">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-col">
                            <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Net Profit</span>
                            <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-4xl font-extrabold tracking-tighter">
                                    $ {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                            <Banknote className="w-6 h-6 text-emerald-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Tax Reserve</span>
                            <span className="text-lg font-bold text-amber-400">$ {estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Margin</span>
                            <span className="text-lg font-bold text-zinc-200">
                                {totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </NanoGlassCard>

                {/* 4. Recent Transactions */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <h2 className="text-lg font-extrabold text-zinc-900">Recent Activity</h2>
                        <Receipt className="w-4 h-4 text-zinc-400" />
                    </div>

                    <div className="flex flex-col gap-3">
                        {isLoading ? (
                            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-[24px]" />)
                        ) : allTransactions.length > 0 ? (
                            allTransactions.slice(0, 15).map((t) => (
                                <NanoGlassCard
                                    key={t.id}
                                    className="p-4"
                                    onClick={() => t.jobId ? router.push(`/dashboard/mobile/jobs/${t.jobId}`) : null}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className={cn(
                                                "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                                                t.type === 'income' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                            )}>
                                                {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0 pr-4">
                                                <h4 className="text-zinc-900 font-bold text-sm truncate">
                                                    {t.description || (t as any).jobTitle}
                                                </h4>
                                                <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                                                    {format(parseISO(t.date), "MMM dd")} • {t.category}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={cn(
                                                "font-extrabold text-sm tracking-tight",
                                                t.type === 'income' ? "text-emerald-600" : "text-zinc-950"
                                            )}>
                                                {t.type === 'income' ? '+' : '-'} $ {t.amount.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </NanoGlassCard>
                            ))
                        ) : (
                            <div className="py-12 text-center text-zinc-400 bg-white/50 rounded-[24px] border border-dashed border-zinc-200">
                                <Plus className="w-8 h-8 mx-auto mb-2 opacity-10" />
                                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">No transactions found <br />in this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Nav */}
                <FloatingNav />
            </div>
        </div>
    );
}
