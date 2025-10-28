import * as React from "react";
import { cn } from "@/lib/utils";

export function GlassCard({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl p-6 shadow-glass border border-white/50",
        className
      )}
      {...props}
    />
  );
}
