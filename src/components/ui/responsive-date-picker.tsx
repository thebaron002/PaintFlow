"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ---------- DETECÇÃO MOBILE (reforçada) ----------
function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mqWidth = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in document);

    const update = () => setIsMobile(mqWidth.matches || mqCoarse.matches || isIOS);
    update();
    mqWidth.addEventListener?.("change", update);
    mqCoarse.addEventListener?.("change", update);
    return () => {
      mqWidth.removeEventListener?.("change", update);
      mqCoarse.removeEventListener?.("change", update);
    };
  }, [breakpointPx]);

  return isMobile;
}

type Mode = "auto" | "inline" | "popover";

type ResponsiveDatePickerProps = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  mode?: Mode;         // NEW: force mode
  label?: string;
};

export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  mode = "auto",
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();
  const useInline = mode === "inline" || (mode === "auto" && isMobile);
  const [open, setOpen] = React.useState(false);

  const handleSelect = (d?: Date) => {
    onChange(d);
    setOpen(false);
  };

  const triggerClasses = cn(
    "justify-start pl-3 text-left font-normal w-full",
    !value && "text-muted-foreground"
  );

  const TriggerBtn = (
    <Button
      type="button"
      variant="outline"
      className={triggerClasses}
      onClick={() => setOpen((v) => !v)}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
    </Button>
  );

  // --------- MOBILE (INLINE, sem portal/overlay) ----------
  if (useInline) {
    return (
      <div className="flex flex-col gap-2">
        {TriggerBtn}

        {open && (
          <div
            className="mt-2 rounded-md border bg-background p-2 shadow-sm"
            // garante cliques mesmo se houver wrappers com transform/overflow
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className="flex justify-end">
              <button
                type="button"
                className="p-1 -m-1 opacity-70"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleSelect}
              // no inline, não usamos initialFocus para evitar rolagem forçada no iOS
            />
          </div>
        )}
      </div>
    );
  }

  // --------- DESKTOP (Popover) ----------
  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <div onClick={() => setOpen(true)} className="w-full">
            <Button type="button" variant="outline" className={triggerClasses}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="w-auto p-0 z-50"
          onInteractOutside={() => setOpen(false)}
        >
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              handleSelect(d);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
