"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleMobileCalendarProps {
    selected?: Date;
    onSelect: (date: Date) => void;
    className?: string;
}

export function SimpleMobileCalendar({
    selected,
    onSelect,
    className,
}: SimpleMobileCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(
        selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
    ).getDay(); // 0 = Sunday

    const monthName = currentMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    const handlePrevMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        );
    };

    const handleNextMonth = () => {
        setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        );
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
        );
        onSelect(newDate);
    };

    const isSelected = (day: number) => {
        if (!selected) return false;
        return (
            selected.getDate() === day &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getFullYear() === currentMonth.getFullYear()
        );
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear()
        );
    };

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-10" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        days.push(
            <button
                key={day}
                type="button"
                onClick={() => handleDayClick(day)}
                className={cn(
                    "h-10 w-full rounded-md text-sm font-medium transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    isSelected(day) &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isToday(day) && !isSelected(day) && "bg-accent text-accent-foreground font-bold"
                )}
            >
                {day}
            </button>
        );
    }

    return (
        <div className={cn("p-4 w-full", className)}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePrevMonth}
                    className="h-8 w-8"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-sm font-semibold">{monthName}</h2>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleNextMonth}
                    className="h-8 w-8"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div
                        key={day}
                        className="h-8 flex items-center justify-center text-xs font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
    );
}
