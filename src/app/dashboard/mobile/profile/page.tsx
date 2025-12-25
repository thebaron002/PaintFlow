"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDoc, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { LogOut, ArrowLeft, Check, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { NanoProfileForm } from "./components/nano-profile-form";

export default function MobileProfilePage() {
    const { user, loading, auth } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    const [isSaving, setIsSaving] = React.useState(false);
    const [isFormValid, setIsFormValid] = React.useState(false);
    const submitTriggerRef = React.useRef<(() => void) | null>(null);

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

    const handleSave = () => {
        if (submitTriggerRef.current) {
            setIsSaving(true);
            submitTriggerRef.current();
        }
    };

    const handleSuccess = () => {
        setIsSaving(false);
        toast({
            title: "Profile Updated! ✨",
            description: "Your information has been saved.",
        });
    };

    const isLoading = loading || isProfileLoading;

    const defaultProfile: UserProfile = {
        id: user?.uid || '',
        name: user?.displayName || '',
        email: user?.email || '',
    };

    return (
        <div className="min-h-screen bg-[#F2F1EF] pb-32 font-sans relative overflow-x-hidden">
            <div className="px-5 pt-8 max-w-md mx-auto">

                {/* Header Row */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-90 transition-transform"
                    >
                        <ArrowLeft className="w-6 h-6 text-zinc-900" strokeWidth={2.5} />
                    </button>

                    <h1 className="text-lg font-extrabold text-zinc-900 tracking-tight">Edit Profile</h1>

                    <button
                        onClick={handleSave}
                        disabled={!isFormValid || isSaving}
                        className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90",
                            isFormValid ? "bg-zinc-950 text-white shadow-lg" : "bg-zinc-200 text-zinc-400 grayscale"
                        )}
                    >
                        <Check className="w-6 h-6" strokeWidth={3} />
                    </button>
                </div>

                {/* Avatar Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-zinc-200">
                            {isLoading ? (
                                <Skeleton className="w-full h-full" />
                            ) : userProfile?.avatarUrl || user?.photoURL ? (
                                <img
                                    src={userProfile?.avatarUrl || user?.photoURL || ""}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-bold text-4xl">
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-900 active:scale-90 transition-transform">
                            <Camera className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form Section */}
                <div className="mb-12">
                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-[120px] w-full rounded-[24px]" />
                            <Skeleton className="h-[120px] w-full rounded-[24px]" />
                        </div>
                    ) : (
                        <NanoProfileForm
                            profile={userProfile || defaultProfile}
                            onSuccess={handleSuccess}
                            onFormStateChange={setIsFormValid}
                            submitTriggerRef={submitTriggerRef}
                        />
                    )}
                </div>

                {/* Utils Section */}
                <div className="space-y-4">
                    <button
                        onClick={handleLogout}
                        className="w-full h-14 rounded-[24px] bg-white text-rose-500 font-extrabold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </button>

                    <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-6">
                        PaintFlow v4.0 • {user?.email}
                    </p>
                </div>

            </div>
        </div>
    );
}
