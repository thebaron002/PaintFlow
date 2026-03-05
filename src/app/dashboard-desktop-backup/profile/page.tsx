
"use client";

import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/app/lib/types";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileForm } from "./components/profile-form";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading, auth } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "users", user.uid);
  }, [firestore, user]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  const isLoading = loading || isProfileLoading;

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
      <PageHeader title="Meu Perfil" />

      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto space-y-8">
          <ProfileForm
            profile={userProfile || defaultProfile}
            onSuccess={handleSuccess}
          />

          <div className="pt-6 border-t border-zinc-100">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full border-rose-100 text-rose-600 hover:bg-rose-50 rounded-xl font-bold h-12 flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </Button>
            <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-4">
              PaintFlow v1.0 • Logado como {user?.email}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
