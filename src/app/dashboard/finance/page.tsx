
"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DollarSign, FileDown, PlusCircle, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Job, GeneralSettings, GeneralExpense } from "@/app/lib/types";
import { CashFlowChart } from "./components/cash-flow-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { AddGeneralExpenseForm } from "./components/add-general-expense-form";
import { useToast } from "@/hooks/use-toast";
import { calculateJobPayout } from "@/app/lib/job-financials";
import { FinalizePaymentsModal } from "./components/finalize-payments-modal";

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
    jobId?: string; // Optional for general expenses
    jobTitle?: string;
    clientName?: string;
    category: string;
    description: string;
    date: string; // ISO
    amount: number;
}


export default function FinancePage() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const { toast } = useToast();
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
  
  const settingsRef = useMemoFirebase(() => {
      if (!firestore) return null;
      return doc(firestore, "settings", "global");
  }, [firestore]);
  const { data: settings, isLoading: isLoadingSettings } = useDoc<GeneralSettings>(settingsRef);

  const isLoading = isLoadingJobs || isLoadingGeneralExpenses || isLoadingSettings;
  
  const openPaymentJobs = jobs?.filter(job => job.status === 'Open Payment') ?? [];

  const income: IncomeItem[] = jobs
    ?.filter(job => job.status === 'Finalized')
    .map(job => ({
        id: job.id,
        jobId: job.id,
        jobTitle: job.title || `${job.clientName} #${job.quoteNumber}`,
        description: "Job payment finalized",
        date: job.deadline,
        amount: calculateJobPayout(job, settings),
    })) ?? [];

  const allExpenses: ExpenseItem[] = [
    ...(jobs?.flatMap(job => 
        (job.invoices || []).map(invoice => ({
            id: invoice.id,
            jobId: job.id,
            jobTitle: job.title || `${job.clientName} #${job.quoteNumber}`,
            clientName: job.clientName,
            category: invoice.origin,
            description: invoice.notes || `Invoice from ${invoice.origin}`,
            date: invoice.date,
            amount: invoice.amount,
        }))
    ) ?? []),
    ...(generalExpenses?.map(exp => ({
        id: exp.id,
        category: exp.category,
        description: exp.description,
        date: exp.date,
        amount: exp.amount
    })) ?? [])
  ].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());


  const totalIncome = income?.reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const totalExpenses = allExpenses?.reduce((acc, item) => acc + item.amount, 0) ?? 0;
  const netProfit = totalIncome - totalExpenses;

  const expenseCategories = [...new Set(allExpenses.map(e => e.category))];

  const handleExpenseFormSuccess = () => {
    setIsExpenseModalOpen(false);
    toast({
      title: "Expense Added",
      description: "The new expense has been recorded successfully.",
    });
  };
  
  const handleFinalizeSuccess = (count: number) => {
    setIsFinalizeModalOpen(false);
    toast({
        title: "Payments Finalized",
        description: `${count} job(s) have been marked as Finalized.`,
    });
  }

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
           <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={openPaymentJobs.length === 0}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalize Payments
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Finalize Job Payments</DialogTitle>
                    <DialogDescription>
                        Select the jobs you have received payment for to mark them as 'Finalized'.
                    </DialogDescription>
                </DialogHeader>
                <FinalizePaymentsModal 
                    jobs={openPaymentJobs} 
                    settings={settings}
                    onSuccess={handleFinalizeSuccess} 
                />
            </DialogContent>
          </Dialog>

          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Transaction
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add General Expense</DialogTitle>
                </DialogHeader>
                <AddGeneralExpenseForm categories={expenseCategories} onSuccess={handleExpenseFormSuccess} />
            </DialogContent>
          </Dialog>
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
              <CashFlowChart income={income} expenses={allExpenses} isLoading={isLoading} />
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
              <CardDescription>List of all logged expenses from job invoices and general business costs.</CardDescription>
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
                  ) : allExpenses?.length > 0 ? (
                    allExpenses.map((item) => {
                    return(
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.description}</div>
                           {item.jobTitle && <div className="text-sm text-muted-foreground">{item.jobTitle} ({item?.clientName})</div>}
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
