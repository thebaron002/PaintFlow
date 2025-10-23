import type { ReactNode } from "react";

export function PageHeader({ title, children }: { title: string, children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
      <h2 className="text-3xl font-bold tracking-tight font-headline">{title}</h2>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
