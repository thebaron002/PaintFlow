"use client";
import { useState } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
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
  DialogDescription,
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
import { DollarSign, FileDown, PlusCircle, CheckCircle, Banknote } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Job, GeneralSettings, GeneralExpense } from "@/app/lib/types";
import { CashFlowChart } from "./components/cash-flow-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollection, useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { AddGeneralExpenseForm } from "./components/add-general-expense-form";
import { useToast } from "@/hooks/use-toast";
import { FinalizePaymentsModal } from "./components/finalize-payments-modal";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { useFinanceData } from "@/hooks/use-finance-data";
import { StatCard } from "./components/stat-card";
import { RecentTransactionsList, Transaction } from "./components/recent-transactions-list";
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
  // --- Date Range State ---
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  // --- Data Hook ---
  const {
    income,
    expenses: allExpenses,
    totalIncome,
    totalExpenses,
    netProfit,
    estimatedTax,
    trends,
    allIncome: unfilteredIncome,
    allExpenses: unfilteredExpenses
  } = useFinanceData(jobs || [], generalExpenses || [], settings, date);
  const expenseCategories = [...new Set(allExpenses.map(e => e.category))];
  // --- Prepare Recent Transactions (Last 5 Global) ---
  const recentTransactions: Transaction[] = isLoading ? [] : [
    ...(unfilteredIncome || []).map(i => ({
        id: i.id,
        type: 'income' as const,
        description: i.jobTitle || i.description,
        amount: i.amount,
        date: i.date,
        category: 'Job Payment'
    })),
    ...(unfilteredExpenses || []).map(e => ({
        id: e.id,
        type: 'expense' as const,
        description: e.description,
        amount: e.amount,
        date: e.date,
        category: e.category
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-6">
      <PageHeader title="Financials">
        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
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
        
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Income"
              value={totalIncome}
              trend={trends.income}
              icon={DollarSign}
              isLoading={isLoading}
              valueColorClass="text-emerald-600"
            />
            <StatCard
              title="Total Expenses"
              value={totalExpenses}
              trend={trends.expenses}
              icon={DollarSign}
              isLoading={isLoading}
              valueColorClass="text-rose-600"
            />
            <StatCard
              title="Net Profit"
              value={netProfit}
              icon={DollarSign}
              isLoading={isLoading}
            />
            <StatCard
              title="Tax Reserve (Est.)"
              value={estimatedTax}
              icon={Banknote}
              isLoading={isLoading}
              valueColorClass="text-amber-600"
              subtext={`${settings?.taxRate ?? 22}% rate`}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-7 lg:grid-cols-7">
            <Card className="col-span-1 md:col-span-4 lg:col-span-5 h-[400px]">
                <CardHeader>
                  <CardTitle>Cash Flow</CardTitle>
                  <CardDescription>Income vs. Expenses over time.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2 h-[320px]">
                   <CashFlowChart income={unfilteredIncome} expenses={unfilteredExpenses} isLoading={isLoading} />
                </CardContent>
            </Card>
            
            <div className="col-span-1 md:col-span-3 lg:col-span-2 h-[400px]">
                <RecentTransactionsList transactions={recentTransactions} isLoading={isLoading} />
            </div>
          </div>
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
                      return (
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
      </Tabs >
    </div >
  );
}
