import { PaintRoller } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  const inheritedColor = !className || className.includes("text-sidebar-foreground") || className.includes("text-foreground")
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PaintRoller className={`h-7 w-7 ${inheritedColor ? '' : 'text-primary'}`} />
      <h1 className="text-2xl font-bold font-headline tracking-tight">
        PaintFlow
      </h1>
    </div>
  );
}
