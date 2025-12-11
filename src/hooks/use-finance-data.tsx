
import { useMemo } from "react";
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import type { Job, GeneralExpense } from "@/app/lib/types";
import { calculateJobPayout } from "@/app/lib/job-financials";
// Helper Types
export type IncomeItem = {
    id: string;
    jobId: string;
    jobTitle: string;
    description: string;
    date: string; // ISO
    amount: number;
}
export type ExpenseItem = {
    id: string;
    jobId?: string; // Optional for general expenses
    jobTitle?: string;
    clientName?: string;
    category: string;
    description: string;
    date: string; // ISO
    amount: number;
}
export function useFinanceData(
    jobs: Job[] = [],
    generalExpenses: GeneralExpense[] = [],
    settings: any,
    dateRange: DateRange | undefined
) {
    // 1. Process Raw Data into Lists
    const allIncome: IncomeItem[] = useMemo(() => {
        return jobs
            .filter(job => job.status === 'Finalized')
            .map(job => ({
                id: job.id,
                jobId: job.id,
                jobTitle: job.title || `${job.clientName} #${job.quoteNumber}`,
                description: "Job payment finalized",
                date: job.finalizationDate || job.deadline,
                amount: calculateJobPayout(job, settings),
            }));
    }, [jobs, settings]);
    const allExpenses: ExpenseItem[] = useMemo(() => {
        const jobExpenses = jobs.flatMap(job =>
            (job.invoices || [])
                .filter(invoice => !invoice.paidByContractor)
                .map(invoice => ({
                    id: invoice.id,
                    jobId: job.id,
                    jobTitle: job.title || `${job.clientName} #${job.quoteNumber}`,
                    clientName: job.clientName,
                    category: invoice.origin,
                    description: invoice.notes || `Invoice from ${invoice.origin}`,
                    date: invoice.date,
                    amount: invoice.amount,
                }))
        );
        const genExpenses = generalExpenses.map(exp => ({
            id: exp.id,
            category: exp.category,
            description: exp.description,
            date: exp.date,
            amount: exp.amount
        }));
        return [...jobExpenses, ...genExpenses].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [jobs, generalExpenses]);
    // 2. Filter by Date Range
    const filteredIncome = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return allIncome;
        return allIncome.filter(item => isWithinInterval(parseISO(item.date), { start: dateRange.from!, end: dateRange.to! }));
    }, [allIncome, dateRange]);
    const filteredExpenses = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return allExpenses;
        return allExpenses.filter(item => isWithinInterval(parseISO(item.date), { start: dateRange.from!, end: dateRange.to! }));
    }, [allExpenses, dateRange]);
    // 3. Calculate Totals
    const totalIncome = filteredIncome.reduce((acc, item) => acc + item.amount, 0);
    const totalExpenses = filteredExpenses.reduce((acc, item) => acc + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const rawTaxRate = settings?.taxRate ?? 22; // Store as whole number (e.g. 22)
    const taxRate = rawTaxRate ? rawTaxRate / 100 : 0.22;
    const estimatedTax = netProfit > 0 ? netProfit * taxRate : 0;
    // 4. Trend Calculation (Previous Period Comparison)
    const trends = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { income: 0, expenses: 0 };
        const duration = dateRange.to.getTime() - dateRange.from.getTime();
        const prevStart = new Date(dateRange.from.getTime() - duration);
        const prevEnd = new Date(dateRange.to.getTime() - duration);
        const prevIncome = allIncome.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);
        const prevExpenses = allExpenses.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };
        return {
            income: calculateGrowth(totalIncome, prevIncome),
            expenses: calculateGrowth(totalExpenses, prevExpenses)
        };
    }, [dateRange, allIncome, allExpenses, totalIncome, totalExpenses]);
    return {
        income: filteredIncome,
        expenses: filteredExpenses,
        allIncome, // Unfiltered for historical charts
        allExpenses, // Unfiltered for historical charts
        totalIncome,
        totalExpenses,
        netProfit,
        estimatedTax,
        trends
    };
}
