import { PaintRoller } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  const inheritedColor = !className || className.includes("text-sidebar-foreground") || className.includes("text-foreground")
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PaintRoller className={cn("h-7 w-7", inheritedColor ? '' : 'text-primary')} />
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        PaintFlow
      </h1>
    </div>
  );
}
