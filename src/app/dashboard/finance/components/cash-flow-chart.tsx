
"use client"
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, subDays, subYears } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
const chartConfig = {
  income: {
    label: "Income",
    color: "#10b981", // emerald-500
  },
  expenses: {
    label: "Expenses",
    color: "#f43f5e", // rose-500
  },
} as const;
interface CashFlowChartProps {
  income: { date: string, amount: number }[];
  expenses: { date: string, amount: number }[];
  isLoading: boolean;
}
export function CashFlowChart({ income, expenses, isLoading }: CashFlowChartProps) {
  const [granularity, setGranularity] = useState<'week' | 'month' | 'all'>('all');
  const [isMounted, setIsMounted] = useState(false);
<<<<<<< HEAD

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartData = React.useMemo(() => {
    const data = [];
    const now = new Date();

    let labels: Date[] = [];
    let formatLabel = (d: Date) => format(d, 'MMM');

=======
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  const chartData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    let labels: Date[] = [];
    let formatLabel = (d: Date) => format(d, 'MMM');
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
    if (granularity === 'all') {
      const start = subYears(now, 1);
      labels = eachMonthOfInterval({ start, end: now });
      formatLabel = (d) => format(d, 'MMM');
    } else if (granularity === 'month') {
      const start = subDays(now, 30);
      labels = eachWeekOfInterval({ start, end: now });
      formatLabel = (d) => `Week ${format(d, 'w')}`;
    } else if (granularity === 'week') {
      const start = subDays(now, 7);
      labels = eachDayOfInterval({ start, end: now });
      formatLabel = (d) => format(d, 'EEE');
    }
<<<<<<< HEAD

    return labels.map(date => {
      let bucketStart, bucketEnd;

=======
    return labels.map(date => {
      let bucketStart, bucketEnd;
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
      if (granularity === 'all') {
        bucketStart = startOfMonth(date);
        bucketEnd = endOfMonth(date);
      } else if (granularity === 'month') {
        bucketStart = startOfWeek(date);
        bucketEnd = endOfWeek(date);
<<<<<<< HEAD
      } else {
        bucketStart = new Date(date.setHours(0, 0, 0, 0));
        bucketEnd = new Date(date.setHours(23, 59, 59, 999));
      }

      const bucketIncome = income
        .filter(item => isWithinInterval(parseISO(item.date), { start: bucketStart, end: bucketEnd }))
        .reduce((sum, item) => sum + item.amount, 0);

      const bucketExpenses = expenses
        .filter(item => isWithinInterval(parseISO(item.date), { start: bucketStart, end: bucketEnd }))
        .reduce((sum, item) => sum + item.amount, 0);

=======
      } else { 
        bucketStart = new Date(date.setHours(0, 0, 0, 0));
        bucketEnd = new Date(date.setHours(23, 59, 59, 999));
      }
      const bucketIncome = income
        .filter(item => isWithinInterval(parseISO(item.date), { start: bucketStart, end: bucketEnd }))
        .reduce((sum, item) => sum + item.amount, 0);
      const bucketExpenses = expenses
        .filter(item => isWithinInterval(parseISO(item.date), { start: bucketStart, end: bucketEnd }))
        .reduce((sum, item) => sum + item.amount, 0);
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
      return {
        label: formatLabel(date),
        income: bucketIncome,
        expenses: bucketExpenses,
      };
    });
  }, [income, expenses, granularity]);
<<<<<<< HEAD

=======
>>>>>>> 9cc9be6f2b91575e02281f201a1f62172f7104d1
  if (isLoading || !isMounted) {
    return <Skeleton className="h-[250px] w-full" />
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-end">
        <Select value={granularity} onValueChange={(v: any) => setGranularity(v)}>
          <SelectTrigger className="w-[100px] h-7 text-xs">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Yearly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="week">Weekly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ChartContainer config={chartConfig} className="min-h-[250px] max-h-[280px] w-full">
        <BarChart accessibilityLayer data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="label"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#888' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => `$${Number(value) / 1000}k`}
            tick={{ fontSize: 11, fill: '#888' }}
          />
          <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} content={<ChartTooltipContent indicator="dot" />} />
          <Legend wrapperStyle={{ fontSize: '12px', marginTop: '-10px' }} />
          <Bar dataKey="income" fill={chartConfig.income.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
          <Bar dataKey="expenses" fill={chartConfig.expenses.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}
