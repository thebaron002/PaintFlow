import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  children,
  className,
}: {
  title: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8",
        className
      )}
    >
        <h2 className="text-3xl font-bold tracking-tight font-headline">
          {title}
        </h2>
      {children && <div className="shrink-0 flex items-center gap-4">{children}</div>}
    </div>
  );
}
