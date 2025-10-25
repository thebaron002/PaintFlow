
"use client";

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "./components/profile-form";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = isUserLoading || isProfileLoading;

  const handleSuccess = () => {
    toast({
      title: "Profile Saved",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const defaultProfile: UserProfile = {
      id: user?.uid || '',
      name: user?.displayName || '',
      email: user?.email || '',
  }

  return (
    <div>
      <PageHeader title="My Profile" />
      
      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <ProfileForm
          profile={userProfile || defaultProfile}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
