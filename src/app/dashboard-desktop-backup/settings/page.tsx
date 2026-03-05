
"use client";

import { useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import type { GeneralSettings } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "./components/settings-form";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const firestore = useFirestore();
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

  const defaultSettings: GeneralSettings = {
    id: "global",
    dailyPayTarget: 300,
    idealMaterialCostPercentage: 20,
    hourlyRate: 50,
    sharePercentage: 70,
    taxRate: 30,
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
    </div>
  );
}
