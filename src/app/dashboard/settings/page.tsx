
"use client";

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc, writeBatch } from "firebase/firestore";
import type { GeneralSettings } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "./components/settings-form";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Data moved from seed.ts
const jobsData = [
    {
    id: "job1",
    title: "Modern Kitchen Repaint",
    workOrderNumber: "WO-001",
    address: "123 Main St, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-08-12T00:00:00.000Z",
    deadline: "2024-08-15T00:00:00.000Z",
    specialRequirements: "Low-VOC paint required. Protect granite countertops.",
    status: "In Progress",
    budget: 2500,
    initialValue: 2200,
    idealMaterialCost: 400,
    idealNumberOfDays: 4,
    productionDays: ["2024-08-12T00:00:00.000Z", "2024-08-13T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [],
    adjustments: [{ id: "adj1", type: "General", description: "Extra coat on ceiling", value: 300 }]
  },
  {
    id: "job2",
    title: "Exterior Fence Staining",
    workOrderNumber: "WO-002",
    address: "456 Oak Ave, Anytown, USA",
    clientName: "Bob Williams",
    startDate: "2024-08-18T00:00:00.000Z",
    deadline: "2024-08-20T00:00:00.000Z",
    specialRequirements: "Use weather-resistant stain. Two coats needed.",
    status: "Not Started",
    budget: 1200,
    initialValue: 1200,
    idealMaterialCost: 250,
    idealNumberOfDays: 3,
    productionDays: [],
    isFixedPay: true,
    invoices: [],
    adjustments: []
  },
  {
    id: "job3",
    title: "Living Room Accent Wall",
    workOrderNumber: "WO-003",
    address: "789 Pine Ln, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-07-27T00:00:00.000Z",
    deadline: "2024-07-28T00:00:00.000Z",
    specialRequirements: "Client wants a very specific shade of blue (Benjamin Moore Hale Navy).",
    status: "Complete",
    budget: 800,
    initialValue: 800,
    idealMaterialCost: 100,
    idealNumberOfDays: 2,
    productionDays: ["2024-07-27T00:00:00.000Z", "2024-07-28T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv1', origin: 'Final Payment', amount: 800, date: "2024-07-30T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job4",
    title: "Full Interior - New Construction",
    workOrderNumber: "WO-004",
    address: "101 Builder's Way, Anytown, USA",
    clientName: "Pro Homes LLC",
    startDate: "2024-09-15T00:00:00.000Z",
    deadline: "2024-09-30T00:00:00.000Z",
    specialRequirements: "Standard builder-grade white for all walls and ceilings.",
    status: "Not Started",
    budget: 15000,
    initialValue: 14000,
    idealMaterialCost: 3500,
    idealNumberOfDays: 10,
    productionDays: [],
    isFixedPay: false,
    invoices: [],
    adjustments: [{ id: "adj2", type: 'General', description: "Additional closets", value: 1000 }]
  },
  {
    id: "job5",
    title: "Deck Refinishing",
    workOrderNumber: "WO-005",
    address: "212 Lakeview Dr, Anytown, USA",
    clientName: "Urban Renovators",
    startDate: "2024-08-22T00:00:00.000Z",
    deadline: "2024-08-25T00:00:00.000Z",
    specialRequirements: "Power wash before sanding and staining.",
    status: "In Progress",
    budget: 1800,
    initialValue: 1800,
    idealMaterialCost: 300,
    idealNumberOfDays: 4,
    productionDays: ["2024-08-22T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [],
    adjustments: []
  },
  {
    id: "job6",
    title: "Nursery Painting",
    workOrderNumber: "WO-006",
    address: "333 Cradle Rock, Anytown, USA",
    clientName: "Alice Johnson",
    startDate: "2024-08-08T00:00:00.000Z",
    deadline: "2024-08-10T00:00:00.000Z",
    specialRequirements: "Zero-VOC paint only. Two-tone wall with stencil.",
    status: "Open Payment",
    budget: 950,
    initialValue: 950,
    idealMaterialCost: 150,
    idealNumberOfDays: 3,
    productionDays: ["2024-08-08T00:00:00.000Z", "2024-08-09T00:00:00.000Z", "2024-08-10T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv2', origin: 'Deposit', amount: 475, date: "2024-08-01T00:00:00.000Z"}],
    adjustments: []
  },
  {
    id: "job7",
    title: "Garage Floor Epoxy",
    workOrderNumber: "WO-007",
    address: "101 Builder's Way, Anytown, USA",
    clientName: "Pro Homes LLC",
    startDate: "2024-07-18T00:00:00.000Z",
    deadline: "2024-07-20T00:00:00.000Z",
    specialRequirements: "Requires 3-day curing time.",
    status: "Finalized",
    budget: 3200,
    initialValue: 3200,
    idealMaterialCost: 800,
    idealNumberOfDays: 3,
    productionDays: ["2024-07-18T00:00:00.000Z", "2024-07-19T00:00:00.000Z", "2024-07-20T00:00:00.000Z"],
    isFixedPay: true,
    invoices: [{id: 'inv3', origin: 'Final Payment', amount: 3200, date: "2024-07-25T00:00:00.000Z"}],
    adjustments: []
  }
];
const incomeData = [
    { id: "inc1", jobId: "job3", description: "Payment for Living Room Accent Wall", amount: 800, date: "2024-07-30T00:00:00.000Z" },
    { id: "inc2", jobId: "job6", description: "50% Deposit for Nursery Painting", amount: 475, date: "2024-08-01T00:00:00.000Z" },
    { id: "inc3", jobId: "job7", description: "Final Payment for Garage Epoxy", amount: 3200, date: "2024-07-25T00:00:00.000Z" },
];
const expensesData = [
    { id: "exp1", jobId: "job1", category: "Materials", description: "Sherwin-Williams Emerald (5 gal)", amount: 250, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp2", jobId: "job3", category: "Materials", description: "Benjamin Moore Hale Navy (1 gal)", amount: 75, date: "2024-07-27T00:00:00.000Z" },
    { id: "exp3", jobId: "job1", category: "Labor", description: "Helper daily rate", amount: 150, date: "2024-08-02T00:00:00.000Z" },
    { id: "exp4", jobId: "job2", category: "Transportation", description: "Gas for work truck", amount: 55, date: "2024-08-01T00:00:00.000Z" },
];
const crewData = [
  {
    id: "crew1",
    name: "Jake's Painting Co.",
    type: "Partner",
    profitPercentage: 50,
    email: "jake@example.com",
    phone: "123-456-7890",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHwzfHxtYW4lMjBwb3J0cmFpdHxlbnwwfHx8fDE3NjExNDUzMDB8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: "crew2",
    name: "Maria's Painting Services",
    type: "Helper",
    dailyRate: 200,
    email: "maria@example.com",
    phone: "098-765-4321",
    avatarUrl: "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw4fHx3b21hbiUyMHBvcnRyYWl0fGVufDB8fHx8MTc2MTE0NzUzOXww&ixlib=rb-4.1.0&q=80&w=1080"
  },
];


export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "settings", "global");
  }, [firestore]);

  const { data: settings, isLoading } = useDoc<GeneralSettings>(settingsRef);

  const handleSuccess = () => {
    toast({
      title: "Settings Saved",
      description: "Your new settings have been saved successfully.",
    });
  };

  const handleSeed = async () => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to seed data."});
        return;
    }

    toast({ title: "Seeding...", description: "Populating your account with sample data." });

    try {
        const batch = writeBatch(firestore);
        const userId = user.uid;

        // Add jobs, income, and expenses under the current user
        jobsData.forEach(job => {
            // Remove the 'id' property from the object to let Firestore generate it, or use it as the document ID
            const { id, ...jobData } = job;
            const docRef = doc(firestore, 'users', userId, 'jobs', id);
            batch.set(docRef, jobData);
        });

        incomeData.forEach(incomeItem => {
            const { id, ...incomeData } = incomeItem;
            const docRef = doc(firestore, 'users', userId, 'income', id);
            batch.set(docRef, incomeData);
        });

        expensesData.forEach(expenseItem => {
            const { id, ...expenseData } = expenseItem;
            const docRef = doc(firestore, 'users', userId, 'expenses', id);
            batch.set(docRef, expenseData);
        });
        
        // Add crew data to the top-level collection
        crewData.forEach(crewMember => {
             const { id, ...crewMemberData } = crewMember;
            const docRef = doc(firestore, 'crew', id);
            batch.set(docRef, crewMemberData);
        });

        await batch.commit();

        toast({ title: "Seeding Complete!", description: "Your account has been populated with sample data." });

    } catch (error) {
        console.error("Error seeding database:", error);
        toast({ variant: "destructive", title: "Seeding Failed", description: (error as Error).message });
    }
  };

  const defaultSettings: GeneralSettings = {
    id: "global",
    dailyPayTarget: 300,
    idealMaterialCostPercentage: 20,
    hourlyRate: 50,
  };

  return (
    <div>
      <PageHeader title="General Settings" />
      
      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <SettingsForm
          settings={settings || defaultSettings}
          onSuccess={handleSuccess}
        />
      )}
      <div className="max-w-2xl mx-auto mt-8 p-4 border border-dashed rounded-lg">
        <h3 className="text-lg font-semibold">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mt-1">
            This action will populate your account with sample jobs, expenses, and other data. It's useful for demonstrating the app's features.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
                Seed My Account with Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will add a number of sample documents to your Firestore database. 
                If data with the same IDs already exists, it will be overwritten. This action is not easily reversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleSeed}>Yes, Seed Data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
