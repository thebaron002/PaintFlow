"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  asChild?: boolean;
};

export function GlassCard({ className, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        // vidro premium
        "rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl",
        // deep shadow + sutil highlight
        "shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)]",
        // light inner stroke
        "ring-1 ring-inset ring-white/5",
        className
      )}
      {...props}
    />
  );
}
