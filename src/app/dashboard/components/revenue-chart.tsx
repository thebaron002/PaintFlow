"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Job } from "@/app/lib/types";
import { subWeeks, startOfWeek, endOfWeek, isWithinInterval, startOfMonth, endOfMonth, isFuture, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, Timestamp } from "firebase/firestore";

const chartConfig = {
  amount: {
    label: "Amount",
    color: "hsl(var(--chart-1))",
  },
}

export function RevenueChart() {
  const firestore = useFirestore();
  const { user } = useUser();
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);

  const { data: jobs, isLoading } = useCollection<Job>(jobsQuery);

  if (isLoading) {
    return (
      <div className="min-h-[200px] w-full flex items-end gap-4 px-4">
        <Skeleton className="h-3/4 w-1/3" />
        <Skeleton className="h-full w-1/3" />
        <Skeleton className="h-1/2 w-1/3" />
      </div>
    )
  }

  const now = new Date();

  const getDate = (date: string | Date | Timestamp) => {
    if (date instanceof Timestamp) return date.toDate();
    if (typeof date === 'string') return parseISO(date);
    return date as Date;
  }

  // 1. Last Week's Revenue
  const lastWeekStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
  const lastWeekRevenue = jobs
    ?.filter(job => {
      const jobDate = getDate(job.deadline);
      const status = job.status as string; // Cast status to string
      return (status === 'Complete' || status === 'Finalized') && isWithinInterval(jobDate, { start: lastWeekStart, end: lastWeekEnd });
    })
    .reduce((sum, job) => sum + job.budget, 0) || 0;

  // 2. This Month's Forecast
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const thisMonthForecast = jobs
    ?.filter(job => {
      const jobDate = getDate(job.deadline);
      return isWithinInterval(jobDate, { start: monthStart, end: monthEnd });
    })
    .reduce((sum, job) => sum + job.budget, 0) || 0;

  // 3. Future Scheduled Jobs
  const futureJobsValue = jobs
    ?.filter(job => {
        const jobDate = getDate(job.deadline);
        return isFuture(jobDate) && !isWithinInterval(jobDate, { start: monthStart, end: monthEnd })
    })
    .reduce((sum, job) => sum + job.budget, 0) || 0;
  
  const chartData = [
    { category: "Last Week", amount: lastWeekRevenue },
    { category: "This Month", amount: thisMonthForecast },
    { category: "Future", amount: futureJobsValue },
  ];

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} layout="vertical">
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="category"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          className="capitalize"
        />
        <XAxis 
          type="number"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => `$${Number(value)/1000}k`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
