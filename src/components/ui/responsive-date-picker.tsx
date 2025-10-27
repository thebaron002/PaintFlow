
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      setIsMobile(false);
      return;
    }

    const mqWidth = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const update = () => {
      setIsMobile(mqWidth.matches);
    };
    update();

    mqWidth.addEventListener?.("change", update);
    return () => {
      mqWidth.removeEventListener?.("change", update);
    };
  }, [breakpointPx]);

  return isMobile;
}

type ResponsiveDatePickerProps = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  className?: string;
};

export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (d?: Date) => {
    onChange(d);
    setOpen(false);
  };

  const TriggerBtn = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "justify-start pl-3 text-left font-normal w-full",
        !value && "text-muted-foreground",
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP") : <span>{placeholder}</span>}
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{TriggerBtn}</PopoverTrigger>
            <DialogContent className="w-auto p-0">
                <Calendar
                mode="single"
                selected={value}
                onSelect={handleSelect}
                initialFocus
                />
            </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerBtn}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
      >
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
