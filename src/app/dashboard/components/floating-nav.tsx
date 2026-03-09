"use client";

import * as React from "react";
import Link from "next/link";
import { LayoutDashboard, Paintbrush, CirclePlus, WalletMinimal, Mails } from "lucide-react";

export function FloatingNav({ onPrimaryClick }: { onPrimaryClick?: () => void }) {
    const navItems = [
        { icon: LayoutDashboard, href: "/dashboard", active: true },
        { icon: Paintbrush, href: "/dashboard/jobs" },
        { icon: CirclePlus, href: "/dashboard/jobs/new", isPrimary: true }, // Center Plus
        { icon: WalletMinimal, href: "/dashboard/finance" },
        { icon: Mails, href: "/dashboard/payroll" },
    ];

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-[450px] h-[72px] bg-[#2C2C2E] rounded-[36px] shadow-2xl flex items-center justify-between px-6 md:px-10 z-40 mb-[env(safe-area-inset-bottom)]">
            {navItems.map((item, idx) => {
                if (item.isPrimary) {
                    return (
                        <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                onPrimaryClick?.();
                            }}
                            className="relative -top-1 w-12 h-12 flex items-center justify-center transition-transform active:scale-95"
                        >
                            <CirclePlus className="w-8 h-8 text-white" strokeWidth={2} />
                        </button>
                    );
                }
                return (
                    <Link key={idx} href={item.href || "#"} className="flex flex-col items-center justify-center hover:opacity-70 transition-opacity">
                        <item.icon className="w-6 h-6 text-zinc-400" strokeWidth={1.5} />
                    </Link>
                );
            })}
        </div>
    );
}
