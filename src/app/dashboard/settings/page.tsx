
"use client";

import { useDoc, useFirestore, useMemoFirebase, useUser, errorEmitter, FirestorePermissionError } from "@/firebase";
import { doc, writeBatch, collection, getDocs, DocumentData } from "firebase/firestore";
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
import { useState } from "react";


export default function SettingsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isMigrating, setIsMigrating] = useState(false);

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
  
  const handleMigrate = async () => {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to migrate data."});
        return;
    }
    
    setIsMigrating(true);
    toast({ title: "Migrating...", description: "Copying old jobs to your account." });

    try {
        const oldJobsRef = collection(firestore, 'jobs');
        const oldJobsSnap = await getDocs(oldJobsRef);

        if(oldJobsSnap.empty) {
            toast({ variant: "destructive", title: "No Data Found", description: "Could not find any jobs in the old collection to migrate."});
            setIsMigrating(false);
            return;
        }

        const batch = writeBatch(firestore);
        const userId = user.uid;

        oldJobsSnap.forEach(jobDoc => {
            const jobData = jobDoc.data() as DocumentData;
            // Use the original job ID for the new document
            const newJobRef = doc(firestore, 'users', userId, 'jobs', jobDoc.id);
            batch.set(newJobRef, jobData);
        });

        await batch.commit();

        toast({ title: "Migration Complete!", description: `Successfully migrated ${oldJobsSnap.size} jobs to your account.` });

    } catch (error) {
        console.error("Error migrating data:", error);
        toast({ variant: "destructive", title: "Migration Failed", description: "Could not migrate data. Check console for errors."});
        
        // This is a generic path since we don't know which write failed.
        // A more robust solution might break this into multiple batches
        // to provide more specific error context.
        const contextualError = new FirestorePermissionError({
          path: `users/${user.uid}/jobs`,
          operation: 'write', // Batch write can be create or update
        });
        errorEmitter.emit('permission-error', contextualError);
    } finally {
        setIsMigrating(false);
    }
  }

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
        <h3 className="text-lg font-semibold">Data Migration</h3>
        <p className="text-sm text-muted-foreground mt-1">
            If you have existing jobs in an old `jobs` collection, this tool will copy them to your user account. This is a one-time operation.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="mt-4" disabled={isMigrating}>
                {isMigrating ? "Migrating Data..." : "Migrate Old Data"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to migrate data?</AlertDialogTitle>
              <AlertDialogDescription>
                This will read all jobs from the top-level `/jobs` collection and copy them to your personal account. The original jobs will not be deleted.
                This action should only be performed once.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleMigrate}>Yes, Migrate Data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
