"use client"
import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format, startOfMonth, endOfMonth, startOfYear, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
export interface DatePickerWithRangeProps extends React.HTMLAttributes<HTMLDivElement> {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
}
export function DatePickerWithRange({
    className,
    date,
    setDate,
}: DatePickerWithRangeProps) {
    // Preset handlers
    const applyPreset = (daysToCheck: number | 'thisMonth' | 'lastMonth' | 'thisYear') => {
        const today = new Date();
        if (daysToCheck === 'thisMonth') {
            setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        } else if (daysToCheck === 'lastMonth') {
            const lastMonth = subMonths(today, 1);
            setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        } else if (daysToCheck === 'thisYear') {
            setDate({ from: startOfYear(today), to: today });
        } else if (typeof daysToCheck === 'number') {
            setDate({ from: addDays(today, -daysToCheck), to: today });
        }
    }
    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[260px] justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "LLL dd, y")} -{" "}
                                    {format(date.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(date.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <div className="flex">
                        <div className="border-r p-2 flex flex-col gap-1 w-[140px]">
                             <div className="text-xs font-medium text-muted-foreground mb-1 px-2 py-1">Presets</div>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset('thisMonth')}>This Month</Button>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset('lastMonth')}>Last Month</Button>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset('thisYear')}>This Year</Button>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset(30)}>Last 30 Days</Button>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset(90)}>Last 90 Days</Button>
                             <Button variant="ghost" size="sm" className="justify-start h-8 text-xs font-normal" onClick={() => applyPreset(7)}>Last 7 Days</Button>
                        </div>
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={setDate}
                            numberOfMonths={2}
                        />
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
