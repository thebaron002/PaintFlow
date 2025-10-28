
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} as const;

interface CashFlowChartProps {
    income: { date: string, amount: number }[];
    expenses: { date: string, amount: number }[];
    isLoading: boolean;
}

export function CashFlowChart({ income, expenses, isLoading }: CashFlowChartProps) {

  const chartData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for(let i = 5; i >= 0; i--) {
        const date = subMonths(now, i);
        const monthStart = startOfMonth(date);
        const monthEnd = endOfMonth(date);
        
        const monthIncome = income
            .filter(item => isWithinInterval(parseISO(item.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, item) => sum + item.amount, 0);

        const monthExpenses = expenses
            .filter(item => isWithinInterval(parseISO(item.date), { start: monthStart, end: monthEnd }))
            .reduce((sum, item) => sum + item.amount, 0);

        data.push({
            month: format(monthStart, 'MMM'),
            income: monthIncome,
            expenses: monthExpenses,
        });
    }
    return data;
  }, [income, expenses]);

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full" />
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          tickFormatter={(value) => `$${Number(value)/1000}k`}
        />
        <Tooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Legend />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
        <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
