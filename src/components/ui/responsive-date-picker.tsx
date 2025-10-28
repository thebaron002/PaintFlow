
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

type ResponsiveDatePickerProps = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  className?: string;
  size?: 'full' | 'compact';
};

export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  size = 'full',
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (d?: Date) => {
    onChange(d);
    setOpen(false);
  };
  
  const widthClass = size === "compact" ? "w-[240px] max-w-full" : "w-full";

  const TriggerBtn = (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "justify-start pl-3 text-left font-normal h-10",
        widthClass,
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
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{TriggerBtn}</DialogTrigger>
        <DialogContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            initialFocus
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{TriggerBtn}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0"
        onInteractOutside={() => setOpen(false)}
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
