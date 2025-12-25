"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface NanoHeaderProps {
    title: string;
    subtitle?: string;
}

export function NanoHeader({ title, subtitle }: NanoHeaderProps) {
    const { user } = useUser();
    const firestore = useFirestore();

    const profileRef = React.useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid, "profile", "main");
    }, [firestore, user]);

    const { data: profile, isLoading } = useDoc<UserProfile>(profileRef);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
                <button className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-90">
                    <Menu className="w-7 h-7 text-zinc-950" strokeWidth={2.5} />
                </button>

                <Link href="/dashboard/mobile/profile">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm active:scale-95 transition-transform bg-zinc-200">
                        {isLoading ? (
                            <Skeleton className="w-full h-full" />
                        ) : profile?.avatarUrl || user?.photoURL ? (
                            <img
                                src={profile?.avatarUrl || user?.photoURL || ""}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-white font-bold text-xs">
                                {user?.email?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </Link>
            </div>

            <div>
                {subtitle && <h3 className="text-zinc-500 font-semibold text-xl mb-1">{subtitle}</h3>}
                <h1 className="text-4xl font-extrabold text-black leading-[1.1] tracking-tight whitespace-pre-wrap">
                    {title}
                </h1>
            </div>
        </div>
    );
}
