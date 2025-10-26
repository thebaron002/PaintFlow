
"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------
// Hook: detecta “mobile/iOS” e telas pequenas de forma SSR-safe
// ---------------------------------------------------------------
function useIsMobile(breakpointPx = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // 1) largura de tela (UX responsivo)
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);

    // 2) heurística iOS (Safari) — reforça fallback para modal
    const ua = window.navigator.userAgent || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reporta como Mac; checamos touch
      (ua.includes("Mac") && "ontouchend" in document);

    const update = () => setIsMobile(mq.matches || isIOS);
    update();

    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, [breakpointPx]);

  return isMobile;
}

// ---------------------------------------------------------------
// Componente: DatePicker responsivo
// props: value (Date | undefined) e onChange (Date | undefined => void)
// ---------------------------------------------------------------
type ResponsiveDatePickerProps = {
  value?: Date;
  onChange: (d?: Date) => void;
  placeholder?: string;
};

export function ResponsiveDatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
}: ResponsiveDatePickerProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (d?: Date) => {
    onChange(d);
    // Fecha imediatamente após escolher
    setOpen(false);
  };

  // --------- Variante MOBILE (Dialog) ----------
  if (isMobile) {
    return (
      <>
        <Button
          type="button"
          variant="outline"
          className={cn("justify-start pl-3 text-left font-normal", !value && "text-muted-foreground")}
          onClick={() => setOpen(true)}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
        </Button>

        <Dialog open={open} onOpenChange={setOpen}>
           <DialogContent
                className="p-0 gap-0 w-full max-w-none sm:max-w-[425px] sm:rounded-lg rounded-none h-[85vh] sm:h-auto data-[state=open]:animate-in"
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

  // --------- Variante DESKTOP (Popover) ----------
  return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn("justify-start pl-3 text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          collisionPadding={8}
          className="w-auto p-0 z-50"
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
