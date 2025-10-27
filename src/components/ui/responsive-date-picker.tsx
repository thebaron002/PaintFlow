
"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Mobile/iOS detection
function useEnv() {
  const [env, setEnv] = React.useState({ isIOS: false, isMobile: false });
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
    const mqWidth = window.matchMedia("(max-width: 768px)");
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const update = () => setEnv({ isIOS, isMobile: mqWidth.matches || mqCoarse.matches || isIOS });
    update();
    mqWidth.addEventListener?.("change", update);
    mqCoarse.addEventListener?.("change", update);
    return () => {
      mqWidth.removeEventListener?.("change", update);
      mqCoarse.removeEventListener?.("change", update);
    };
  }, []);
  return env;
}

function toDateInputValue(d?: Date) {
    if (!d) return '';
    // Formata como YYYY-MM-DD para o input
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
}

function fromDateInputValue(v: string): Date | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d, 12);
}

type Props = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  label?: string;
};

export function ResponsiveDatePicker({ value, onChange, placeholder = "Pick a date", label }: Props) {
  const { isIOS, isMobile } = useEnv();
  const [open, setOpen] = React.useState(false);

  if (isIOS) {
    return (
      <div className="flex flex-col gap-2">
        {label && <span className="text-sm font-medium">{label}</span>}
        <input
          type="date"
          value={toDateInputValue(value)}
          onChange={(e) => onChange(fromDateInputValue(e.target.value))}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          style={{ WebkitTapHighlightColor: "transparent" }}
        />
      </div>
    );
  }

  const triggerClasses = cn(
    "justify-start pl-3 text-left font-normal w-full",
    !value && "text-muted-foreground"
  );

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {label && <span className="text-sm font-medium">{label}</span>}
        <Button
          type="button"
          variant="outline"
          className={triggerClasses}
          onClick={() => setOpen((v) => !v)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>
        {open && (
          <div className="mt-2 rounded-md border bg-background p-2 shadow-sm z-[99] relative">
            <div className="flex justify-end">
              <button type="button" className="p-1 -m-1 opacity-70" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => {
                onChange(d);
                setOpen(false);
              }}
            />
          </div>
        )}
      </div>
    );
  }

  // Desktop: Radix Popover com container inline (sem portal)
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium">{label}</span>}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <div onClick={() => setOpen(true)} className="w-full">
            <Button type="button" variant="outline" className={triggerClasses}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
            </Button>
          </div>
        </Popover.Trigger>
        <Popover.Content
          align="start"
          sideOffset={8}
          className="z-50 w-auto rounded-md border bg-popover p-2 shadow-md"
          onPointerDownOutside={(e) => {
            // Previne o foco de ser roubado pelo dialog pai
            const target = e.target as HTMLElement;
            if(target.closest('[data-radix-collection-item]')) {
                e.preventDefault();
            }
          }}
          onInteractOutside={() => setOpen(false)}
          side="bottom"
        >
            <Calendar
              mode="single"
              selected={value}
              onSelect={(d) => {
                onChange(d);
                setOpen(false);
              }}
            />
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
