"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { jobs } from "@/app/lib/data"
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
}

export function RevenueChart() {
  const now = new Date();
  const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

  const chartData = last6Months.map(date => {
    const monthName = format(date, "MMM");
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const monthlyRevenue = jobs
      .filter(job => {
        const jobDate = new Date(job.deadline);
        return (job.status === 'Completed' || job.status === 'Invoiced') && isWithinInterval(jobDate, { start: monthStart, end: monthEnd });
      })
      .reduce((sum, job) => sum + job.budget, 0);

    return { month: monthName, revenue: monthlyRevenue };
  });


  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
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
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
