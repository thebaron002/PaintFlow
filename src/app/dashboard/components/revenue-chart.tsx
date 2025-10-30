
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Job, GeneralExpense } from "@/app/lib/types";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, format, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc, Timestamp } from "firebase/firestore";
import * as React from "react";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--destructive))",
  },
}

export function RevenueChart() {
  const firestore = useFirestore();
  const { user } = useUser();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);
  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);

  const generalExpensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'generalExpenses');
  }, [firestore, user]);
  const { data: generalExpenses, isLoading: isLoadingGeneralExpenses } = useCollection<GeneralExpense>(generalExpensesQuery);
  
  const isLoading = isLoadingJobs || isLoadingGeneralExpenses;
  
  const chartData = React.useMemo(() => {
    if (!jobs || !generalExpenses) return [];

    const data = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);

        const getDate = (d: string | Date | Timestamp) => {
          if (d instanceof Timestamp) return d.toDate();
          if (typeof d === 'string') return parseISO(d);
          return d as Date;
        }

        const monthlyPayout = jobs
            .filter(job => {
                const jobDate = getDate(job.deadline);
                const status = job.status as string;
                return ['Complete', 'Open Payment', 'Finalized'].includes(status) && isWithinInterval(jobDate, { start: monthStart, end: monthEnd });
            })
            .reduce((sum, job) => sum + (job.budget || 0), 0);
        
        const monthlyJobExpenses = jobs
            .flatMap(job => job.invoices || [])
            .filter(invoice => isWithinInterval(getDate(invoice.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, invoice) => sum + invoice.amount, 0);

        const monthlyGeneralExpenses = generalExpenses
            .filter(exp => isWithinInterval(getDate(exp.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, exp) => sum + exp.amount, 0);
        
        const totalMonthlyExpenses = monthlyJobExpenses + monthlyGeneralExpenses;

        data.push({
            month: format(monthStart, 'MMM'),
            income: monthlyPayout,
            expenses: totalMonthlyExpenses,
        });
    }
    return data;

  }, [jobs, generalExpenses]);


  if (isLoading) {
    return <Skeleton className="h-[350px] w-full" />
  }

  return (
    <Card className="bg-white/70 backdrop-blur-md border-white/50 shadow-xl dark:bg-zinc-900/60 dark:border-white/10">
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <CardDescription>Income vs. Expenses over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-full w-full min-h-[200px]">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -20,
              right: 12,
              top: 10,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${Number(value) / 1000}k`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                indicator="dot"
                formatter={(value, name) => {
                  const currencyValue = value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
                  return (
                    <div className="flex min-w-[120px] items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className={
                            "h-2 w-2 shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]"
                         } style={{
                            "--color-bg": `var(--color-${name})`,
                            "--color-border": `var(--color-${name})`,
                         } as React.CSSProperties} />
                         <p className="capitalize text-muted-foreground">{name}</p>
                      </div>
                      <p className="font-medium">{currencyValue}</p>
                    </div>
                  )
                }}
              />}
            />
            <defs>
              <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-income)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillExpenses)"
              fillOpacity={0.4}
              stroke="var(--color-expenses)"
            />
            <Area
              dataKey="income"
              type="natural"
              fill="url(#fillIncome)"
              fillOpacity={0.4}
              stroke="var(--color-income)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
