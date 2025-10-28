
"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, FileDown, PlusCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Job, GeneralSettings } from "@/app/lib/types";
import { CashFlowChart } from "./components/cash-flow-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";

type IncomeItem = {
    id: string;
    jobId: string;
    jobTitle: string;
    description: string;
    date: string; // ISO
    amount: number;
}

type ExpenseItem = {
    id: string;
    jobId: string;
    jobTitle: string;
    clientName: string;
    category: string;
    description: string;
    date: string; // ISO
    amount: number;
}


export default function FinancePage() {
  const firestore = useFirestore();
  const { user } = useUser();
  
  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'jobs');
  }, [firestore, user]);
  const { data: jobs, isLoading: isLoadingJobs } = useCollection<Job>(jobsQuery);
  
  const settingsRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, "settings", "global");
  }, [firestore]);
  const { data: settings } = useDoc<GeneralSettings>(settingsRef);

  const isLoading = isLoadingJobs;

  const income: IncomeItem[] = jobs
    ?.filter(job => job.status === 'Finalized')
    .map(job => {
        const totalAdjustments = job.adjustments?.reduce((sum, adj) => {
            if (adj.type === 'Time') {
                const rate = adj.hourlyRate ?? settings?.hourlyRate ?? 0;
                return sum + (adj.value * rate);
            }
            return sum + adj.value;
        }, 0) ?? 0;

        return {
            id: job.id,
            jobId: job.id,
            jobTitle: job.title || `${job.clientName} #${job.workOrderNumber}`,
            description: "Job payment finalized",
            date: job.deadline,
            amount: job.initialValue + totalAdjustments,
        }
    }) ?? [];

  const expenses: ExpenseItem[] = jobs
    ?.flatMap(job => 
        (job.invoices || []).map(invoice => ({
            id: invoice.id,
            jobId: job.id,
            jobTitle: job.title || `${job.clientName} #${job.workOrderNumber}`,
            clientName: job.clientName,
            category: invoice.origin,
            description: invoice.notes || `Invoice from ${invoice.origin}`,
            date: invoice.date,
            amount: invoice.amount,
        }))
    ) ?? [];


  const totalIncome = income?.reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const totalExpenses = expenses?.reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const netProfit = totalIncome - totalExpenses;

  const renderStatCard = (title: string, value: number, colorClass: string = '', isLoading: boolean) => (
     <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-8 w-24" /> : <div className={`text-2xl font-bold ${colorClass}`}>${value.toLocaleString()}</div>}
        </CardContent>
      </Card>
  );

  return (
    <div>
      <PageHeader title="Financials">
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </PageHeader>
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3">
            {renderStatCard("Total Income", totalIncome, "text-green-600", isLoading)}
            {renderStatCard("Total Expenses", totalExpenses, "text-red-600", isLoading)}
            {renderStatCard("Net Profit", netProfit, "", isLoading)}
          </div>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Cash Flow</CardTitle>
              <CardDescription>Income vs. Expenses over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent>
              <CashFlowChart income={income} expenses={expenses} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="income" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Income</CardTitle>
              <CardDescription>List of all payments received from finalized jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(3)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : income?.length > 0 ? (
                    income.map((item) => {
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item?.jobTitle}</div>
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        </TableCell>
                        <TableCell>{format(parseISO(item.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">${item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No income recorded from finalized jobs.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>List of all logged expenses from job invoices.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                     [...Array(4)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32 mb-1" /><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : expenses?.length > 0 ? (
                    expenses.map((item) => {
                    return(
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.description}</div>
                           <div className="text-sm text-muted-foreground">{item?.jobTitle} ({item?.clientName})</div>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{format(parseISO(item.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right text-red-600 font-semibold">${item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })
                  ) : (
                     <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No expenses recorded.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
