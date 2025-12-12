<<<<<<< HEAD
=======

>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
import { useMemo } from "react";
import { isWithinInterval, parseISO, startOfMonth, endOfMonth, subMonths, isSameMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import type { Job, GeneralExpense } from "@/app/lib/types";
import { calculateJobPayout } from "@/app/lib/job-financials";
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
// Helper Types
export type IncomeItem = {
    id: string;
    jobId: string;
    jobTitle: string;
    description: string;
    date: string; // ISO
    amount: number;
}
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
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
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
export function useFinanceData(
    jobs: Job[] = [],
    generalExpenses: GeneralExpense[] = [],
    settings: any,
    dateRange: DateRange | undefined
) {
    // 1. Process Raw Data into Lists
    const allIncome: IncomeItem[] = useMemo(() => {
        return jobs
<<<<<<< HEAD
            .filter(job => job.status === 'Finalized')
=======
            .filter(job => job.status === 'Finalized' && job.finalizationDate)
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
            .map(job => ({
                id: job.id,
                jobId: job.id,
                jobTitle: job.title || `${job.clientName} #${job.quoteNumber}`,
                description: "Job payment finalized",
<<<<<<< HEAD
                date: job.finalizationDate || job.deadline,
                amount: calculateJobPayout(job, settings),
            }));
    }, [jobs, settings]);

=======
                date: job.finalizationDate!,
                amount: calculateJobPayout(job, settings),
            }));
    }, [jobs, settings]);
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
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
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
        const genExpenses = generalExpenses.map(exp => ({
            id: exp.id,
            category: exp.category,
            description: exp.description,
            date: exp.date,
            amount: exp.amount
        }));
<<<<<<< HEAD

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


=======
        return [...jobExpenses, ...genExpenses].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    }, [jobs, generalExpenses]);
    // 2. Filter by Date Range
    const filteredIncome = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        return allIncome.filter(item => isWithinInterval(parseISO(item.date), { start: dateRange.from!, end: dateRange.to! }));
    }, [allIncome, dateRange]);
    const filteredExpenses = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return [];
        return allExpenses.filter(item => isWithinInterval(parseISO(item.date), { start: dateRange.from!, end: dateRange.to! }));
    }, [allExpenses, dateRange]);
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
    // 3. Calculate Totals
    const totalIncome = filteredIncome.reduce((acc, item) => acc + item.amount, 0);
    const totalExpenses = filteredExpenses.reduce((acc, item) => acc + item.amount, 0);
    const netProfit = totalIncome - totalExpenses;
<<<<<<< HEAD

    const rawTaxRate = settings?.taxRate ?? 22; // Store as whole number (e.g. 22)
    const taxRate = rawTaxRate ? rawTaxRate / 100 : 0.22;
    const estimatedTax = netProfit > 0 ? netProfit * taxRate : 0;


    // 4. Trend Calculation (Previous Period Comparison)
    // Simplified logic: If "This Month", compare with "Last Month". 
    // If range matches a standard month, find the previous month.
    // Otherwise, just fall back to 0% or N/A.
    const trends = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { income: 0, expenses: 0 };

        const isMonthRange = isSameMonth(dateRange.from, dateRange.to) === false && // It's a range, so start/end shouldn't be same unless 1 day. 
            // Logic: Check if it covers a full month. 
            // Simplified: Just use the start date to determine "previous month" equivalent interval.
            true;

        // For now, let's implement a robust "Previous Period" calculator by taking the duration (in days)
        // and shifting back by that duration.
        const duration = dateRange.to.getTime() - dateRange.from.getTime();
        const prevStart = new Date(dateRange.from.getTime() - duration);
        const prevEnd = new Date(dateRange.to.getTime() - duration);

        const prevIncome = allIncome.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);

        const prevExpenses = allExpenses.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);

=======
    const rawTaxRate = settings?.taxRate ?? 22; // Store as whole number (e.g. 22)
    const taxRate = rawTaxRate ? rawTaxRate / 100 : 0.22;
    const estimatedTax = netProfit > 0 ? netProfit * taxRate : 0;
    // 4. Trend Calculation
    const trends = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to) return { income: 0, expenses: 0 };
        
        const duration = dateRange.to.getTime() - dateRange.from.getTime();
        const prevStart = new Date(dateRange.from.getTime() - duration);
        const prevEnd = new Date(dateRange.to.getTime() - duration);
        const prevIncome = allIncome.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);
        const prevExpenses = allExpenses.filter(item => isWithinInterval(parseISO(item.date), { start: prevStart, end: prevEnd }))
            .reduce((acc, i) => acc + i.amount, 0);
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
        const calculateGrowth = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
        return {
            income: calculateGrowth(totalIncome, prevIncome),
            expenses: calculateGrowth(totalExpenses, prevExpenses)
        };
<<<<<<< HEAD

    }, [dateRange, allIncome, allExpenses, totalIncome, totalExpenses]);


    return {
        income: filteredIncome,
        expenses: filteredExpenses,
        allIncome, // Unfiltered for historical charts
        allExpenses, // Unfiltered for historical charts
=======
    }, [dateRange, allIncome, allExpenses, totalIncome, totalExpenses]);
    return {
        income: filteredIncome,
        expenses: filteredExpenses,
        allIncome,
        allExpenses,
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
        totalIncome,
        totalExpenses,
        netProfit,
        estimatedTax,
        trends
    };
}
