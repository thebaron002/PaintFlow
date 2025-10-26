
"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ---------- DETECÇÃO MOBILE REFORÇADA ----------
function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mqWidth = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const mqCoarse = window.matchMedia("(pointer: coarse)");
    const ua = navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (ua.includes("Mac") && "ontouchend" in document); // iPadOS

    const update = () => {
      setIsMobile(mqWidth.matches || mqCoarse.matches || isIOS);
    };
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

type Mode = "auto" | "dialog" | "popover";

type ResponsiveDatePickerProps = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
  mode?: Mode; // NEW: força o modo se quiser
};

export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  mode = "auto",
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const useDialog = mode === "dialog" || (mode === "auto" && isMobile);

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
        !value && "text-muted-foreground"
      )}
      onClick={() => setOpen(true)}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
    </Button>
  );

  // --------- MOBILE (Dialog) ----------
  if (useDialog) {
    return (
      <>
        {TriggerBtn}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            // quase full-screen no mobile; compacto no desktop
            className="p-0 gap-0 w-full max-w-none sm:max-w-[425px] sm:rounded-lg rounded-none
                       h-[85vh] sm:h-auto"
          >
            <DialogHeader className="p-4 pb-2">
              <DialogTitle>Selecione a data</DialogTitle>
            </DialogHeader>

            <div className="p-2 max-h-[65vh] overflow-y-auto sm:max-h-none">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleSelect}
                initialFocus
              />
            </div>

            <DialogFooter className="p-3 pt-0">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // --------- DESKTOP (Popover) ----------
  return (
      <Popover open={open} onOpenChange={setOpen} modal /* <- fecha melhor no iOS */>
        <PopoverTrigger asChild>
          {/* no desktop o open é controlado pelo PopoverTrigger */}
          <div onClick={() => setOpen(true)} className="w-full">
            {TriggerBtn}
          </div>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="w-auto p-0 z-50"
          onInteractOutside={() => setOpen(false)} // <- garante fechar no "tap fora"
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
  );
}
