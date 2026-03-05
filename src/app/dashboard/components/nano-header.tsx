import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Home, Users, Ticket, Settings, LogOut, ChevronRight, Menu } from "lucide-react";
import { useAuth, useUser, useFirestore, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import type { UserProfile } from "@/app/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import * as React from "react";

interface NanoHeaderProps {
    title: string;
    subtitle?: string;
}

export function NanoHeader({ title, subtitle }: NanoHeaderProps) {
    const { user } = useUser();
    const firestore = useFirestore();
    const auth = useAuth();
    const [isOpen, setIsOpen] = React.useState(false);

    const profileRef = React.useMemo(() => {
        if (!firestore || !user) return null;
        return doc(firestore, "users", user.uid, "profile", "main");
    }, [firestore, user]);

    const { data: profile, isLoading } = useDoc<UserProfile>(profileRef);

    const menuItems = [
        { icon: Home, label: "Home", href: "/dashboard" },
        { icon: Users, label: "Crew", href: "/dashboard/crew" },
        { icon: Ticket, label: "Tickets", href: "/dashboard/tickets" },
        { icon: Settings, label: "Settings", href: "/dashboard/settings" },
    ];

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild>
                        <button className="p-2 -ml-2 hover:bg-zinc-100 rounded-full transition-colors active:scale-90">
                            <Menu className="w-7 h-7 text-zinc-950" strokeWidth={2.5} />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0 border-r-0 bg-[#F2F1EF]">
                        <SheetHeader className="p-6 text-left border-b border-zinc-200/50 bg-white">
                            <SheetTitle className="text-xl font-bold text-zinc-900">Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col h-full bg-[#F2F1EF]">
                            <div className="flex-1 p-4 space-y-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-4 p-4 bg-white rounded-[20px] shadow-sm border border-zinc-100 active:scale-[0.98] transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center group-active:bg-blue-50 transition-colors">
                                            <item.icon className="w-5 h-5 text-zinc-700 group-active:text-blue-600" />
                                        </div>
                                        <span className="flex-1 text-zinc-900 font-bold text-base">{item.label}</span>
                                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                                    </Link>
                                ))}
                            </div>

                            <div className="p-4 pb-8">
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-4 p-4 w-full bg-white rounded-[20px] shadow-sm border border-zinc-100 active:scale-[0.98] transition-all text-red-600"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                                        <LogOut className="w-5 h-5 text-red-600" />
                                    </div>
                                    <span className="flex-1 text-left font-bold text-base">Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <Link href="/dashboard/profile">
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
