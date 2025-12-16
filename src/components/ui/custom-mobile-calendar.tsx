"use client";

import React from "react";
import { startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, isToday, format, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DayData {
    date: string;
    dayType: 'full' | 'half';
}

interface CustomMobileCalendarProps {
    productionDays: DayData[];
    onDayClick: (date: Date) => void;
    className?: string; // Kept className for backward compatibility/styling
}

export function CustomMobileCalendar({ productionDays = [], onDayClick, className }: CustomMobileCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const daysInMonth = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    const startDay = startOfMonth(currentMonth).getDay(); // 0 = Sunday
    const blanks = Array(startDay).fill(null);

    return (
        <div className={cn("w-full", className)}>
            <div className="flex items-center justify-between mb-4 px-2">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-full">
                    <ChevronLeft className="w-5 h-5 text-zinc-600" />
                </button>
                <h3 className="font-bold text-lg text-zinc-900">{format(currentMonth, "MMMM yyyy")}</h3>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-zinc-100 rounded-full">
                    <ChevronRight className="w-5 h-5 text-zinc-600" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} className="text-center text-xs font-bold text-zinc-400 uppercase py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {blanks.map((_, i) => <div key={`blank-${i}`} />)}
                {daysInMonth.map(date => {
                    const dayData = productionDays.find(d => isSameDay(parseISO(d.date), date));
                    const isSelected = !!dayData;
                    const isFullDay = dayData?.dayType === 'full';
                    const isCurrentDay = isToday(date);

                    return (
                        <button
                            key={date.toISOString()}
                            onClick={() => onDayClick(date)}
                            className={cn(
                                "aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all relative",
                                isSelected
                                    ? (isFullDay ? "bg-secondary text-secondary-foreground font-bold shadow-sm" : "bg-muted text-muted-foreground font-bold")
                                    : "text-zinc-700 hover:bg-zinc-100",
                                isCurrentDay && !isSelected && "bg-zinc-50 text-black font-bold border border-zinc-200"
                            )}
                        >
                            {format(date, "d")}
                        </button>
                    );
                })}
            </div>
        </div>
    )
}
