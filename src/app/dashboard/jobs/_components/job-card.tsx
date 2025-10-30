
"use client";

import { MapPin, CircleDot, CheckCircle2, Clock, Wallet2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Job } from '@/app/lib/types';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { JobActions } from '../../job-actions';

function StatusBadge({ status }: { status: Job['status'] }) {
  const statusMap: Record<Job['status'], { label: string; className: string; icon: React.ReactNode }> = {
    "Not Started": { label: "Not Started", className: "bg-neutral-200 text-neutral-900", icon: <Clock className="h-3.5 w-3.5" /> },
    "In Progress": { label: "In Progress", className: "bg-blue-600/15 text-blue-700 dark:text-blue-600", icon: <CircleDot className="h-3.5 w-3.5" /> },
    "Complete": { label: "Complete", className: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-600", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    "Open Payment": { label: "Open Payment", className: "bg-amber-500/15 text-amber-700 dark:text-amber-500", icon: <Wallet2 className="h-3.5 w-3.5" /> },
    "Finalized": { label: "Finalized", className: "bg-neutral-300 text-neutral-900", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  };
  const s = statusMap[status];
  return (
    <Badge className={cn("gap-1.5 px-2.5 py-1 text-xs rounded-full shrink-0 whitespace-nowrap", s.className)}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

function Info({label, value, className}: {label: string; value: string | React.ReactNode, className?: string}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}

export function JobCard({ job }: { job: Job }) {
  const router = useRouter();

  const initials = job.clientName.split(' ').slice(0, 2).map(s => s[0]).join('').toUpperCase();
  const title = job.title || `${job.clientName.split(' ').pop()} #${job.quoteNumber}`;
  const deadline = job.deadline ? format(new Date(job.deadline), 'MMM dd, yyyy') : 'N/A';
  
  const payout = job.isFixedPay 
    ? job.initialValue 
    : job.budget;

  const payoutFmt = (payout < 0 ? '- ' : '') + Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.abs(payout || 0));

  return (
    <div
      onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
      className={cn(
        "block rounded-2xl border bg-card/60 backdrop-blur-sm supports-[backdrop-filter]:bg-card/40 cursor-pointer",
        "hover:shadow-md transition-shadow p-4 sm:p-5"
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium sm:h-14 sm:w-14">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          {/* Header: Title and Badge/Actions */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-semibold truncate">{title}</h3>
                <p className="text-muted-foreground text-sm mt-0.5 truncate">
                    Client: <span className="font-medium text-foreground">{job.clientName}</span>
                </p>
            </div>
            <div className="shrink-0 flex items-center gap-2 -mt-1 sm:mt-0">
               <div className="hidden sm:block">
                 <StatusBadge status={job.status} />
               </div>
                <div onClick={(e) => e.stopPropagation()}>
                    <JobActions job={job} />
                </div>
            </div>
          </div>

          <div className="sm:hidden mt-2">
            <StatusBadge status={job.status} />
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 mt-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
            <span className="line-clamp-2 break-words">{job.address}</span>
          </div>

          {/* Info Grid */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Info label="Payout" value={payoutFmt} />
            <Info label="Deadline" value={deadline} />
          </div>
        </div>
      </div>
    </div>
  );
}
