"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Home, Search, CalendarDays, DollarSign } from "lucide-react";

export function FloatingNav({ onPrimaryClick }: { onPrimaryClick?: () => void }) {
    const navItems = [
        { icon: Home, href: "/dashboard/mobile", active: true },
        { icon: Search, href: "/dashboard/mobile/jobs" }, // Using Search icon for Jobs per mockup vibe
        { icon: Plus, href: "/dashboard/jobs/new", isPrimary: true }, // Center Plus
        { icon: CalendarDays, href: "/dashboard/calendar" },
        { icon: DollarSign, href: "/dashboard/finance" }, // Dollar for finance
    ];

    return (
        <div className="fixed bottom-6 left-6 right-6 h-[72px] bg-[#2C2C2E] rounded-full shadow-2xl flex items-center justify-between px-6 z-40 mb-[env(safe-area-inset-bottom)]">
            {navItems.map((item, idx) => {
                if (item.isPrimary) {
                    return (
                        <button
                            key={idx}
                            onClick={(e) => {
                                if (onPrimaryClick) {
                                    e.preventDefault();
                                    onPrimaryClick();
                                }
                            }}
                            className="relative -top-1"
                        >
                            <Link href={item.href || "#"} onClick={(e) => onPrimaryClick && e.preventDefault()}>
                                <Plus className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
                            </Link>
                        </button>
                    )
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
