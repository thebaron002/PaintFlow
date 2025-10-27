"use client";

import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// ---- detecção iOS + mobile ----
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

// helpers p/ string yyyy-MM-dd
function toDateInputValue(d?: Date) {
  if (!d) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function fromDateInputValue(v: string): Date | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  // cria como data local (sem fuso)
  return new Date(y, m - 1, d, 12, 0, 0, 0); // 12:00 minimiza edge no DST
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

  // ---------- 1) iOS: input nativo ----------
  if (isIOS) {
    return (
      <div className="flex flex-col gap-2">
        {label ? <span className="text-sm font-medium">{label}</span> : null}
        <input
          type="date"
          value={toDateInputValue(value)}
          onChange={(e) => onChange(fromDateInputValue(e.target.value))}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
          // garante clique mesmo com wrappers "estranhos"
          style={{ WebkitTapHighlightColor: "transparent" }}
        />
      </div>
    );
  }

  // Botão gatilho (desktop e mobile não-iOS)
  const trigger = (
    <Button
      type="button"
      variant="outline"
      className={cn("justify-start pl-3 text-left font-normal w-full", !value && "text-muted-foreground")}
      onClick={() => setOpen((v) => !v)}
      role="button"
      tabIndex={0}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <CalendarIcon className="mr-2 h-4 w-4" />
      {value ? format(value, "PPP", { locale: ptBR }) : <span>{placeholder}</span>}
    </Button>
  );

  // ---------- 2) Mobile não-iOS: inline ----------
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {label ? <span className="text-sm font-medium">{label}</span> : null}
        {trigger}
        {open && (
          <div
            className="mt-2 rounded-md border bg-background p-2 shadow-sm"
            style={{ position: "relative", zIndex: 1, pointerEvents: "auto" }}
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

  // ---------- 3) Desktop: popover ----------
  return (
    <div className="flex flex-col gap-2">
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>
          <div onClick={() => setOpen(true)} className="w-full">
            {trigger}
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
              onChange(d);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
