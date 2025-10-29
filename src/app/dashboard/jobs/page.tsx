
"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  MapPin,
  Search,
  Plus,
  LayoutGrid,
  Rows,
  CircleDot,
  CheckCircle2,
  Clock,
  Wallet2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// ---------- Types ----------
type JobStatus =
  | "Not Started"
  | "In Progress"
  | "Complete"
  | "Open Payment"
  | "Finalized";

type Job = {
  id: string;
  name: string;
  clientName: string;
  address: string;
  status: JobStatus;
  payout: number; // negativo para ajuste, positivo para receber
  deadline?: Date | string;
};

// ---------- Status → Badge ----------
function StatusBadge({ status }: { status: JobStatus }) {
  const map: Record<JobStatus, { label: string; className: string; icon: React.ReactNode }> = {
    "Not Started": { label: "Not Started", className: "bg-neutral-200 text-neutral-900", icon: <Clock className="h-3.5 w-3.5" /> },
    "In Progress": { label: "In Progress", className: "bg-blue-600/15 text-blue-700 dark:text-blue-600", icon: <CircleDot className="h-3.5 w-3.5" /> },
    "Complete": { label: "Complete", className: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-600", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
    "Open Payment": { label: "Open Payment", className: "bg-amber-500/15 text-amber-700 dark:text-amber-500", icon: <Wallet2 className="h-3.5 w-3.5" /> },
    "Finalized": { label: "Finalized", className: "bg-neutral-300 text-neutral-900", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  };
  const s = map[status];
  return (
    <Badge className={cn("gap-1.5 px-2.5 py-1 text-xs rounded-full", s.className)}>
      {s.icon}
      {s.label}
    </Badge>
  );
}

// ---------- Single Card ----------
function JobCard({ job }: { job: Job }) {
    const router = useRouter();
  const initials = useMemo(
    () =>
      job.clientName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [job.clientName]
  );

  const deadline =
    job.deadline ? format(new Date(job.deadline), "MMM dd, yyyy") : "—";

  const payoutFmt =
    (job.payout < 0 ? "- " : "") +
    Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(Math.abs(job.payout || 0));

  return (
    <Card className="border-0 shadow-sm backdrop-blur-sm bg-white/75 dark:bg-neutral-900/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 bg-neutral-200 dark:bg-neutral-800">
            <AvatarFallback className="text-neutral-700 dark:text-neutral-300">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-semibold text-neutral-900 text-base sm:text-[17px]">
                  {job.name}
                </div>
                <div className="text-sm text-neutral-500">
                  Client: <span className="text-neutral-700">{job.clientName}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={job.status} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/jobs/${job.id}`)}>
                      Open
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <MapPin className="h-4 w-4 text-neutral-400" />
                <span className="truncate">{job.address}</span>
              </div>
              <div className="text-sm">
                <div className="text-neutral-500">Payout</div>
                <div className={cn("font-medium", job.payout < 0 ? "text-red-600" : "text-neutral-900")}>
                  {payoutFmt}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-neutral-500">Deadline</div>
                <div className="font-medium">{deadline}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- Page ----------
export default function JobsPage() {
  const router = useRouter();
  // 🔌 Plugue aqui seu fetch atual (Firestore, React Query, etc.)
  //   O layout só lê deste array.
  const [view, setView] = useState<"cards" | "table">("cards");
  const [active, setActive] = useState<
    "all" | "not-started" | "in-progress" | "complete" | "open-payment" | "finalized"
  >("all");
  const [q, setQ] = useState("");

  // MOCK: substitua pelo seu array real
  const jobs: Job[] = [
    { id: "1", name: "Middeke #11532", clientName: "Gwen Middeke", address: "1028 Bellevaux Pl, St Charles, MO, 63301", status: "Not Started", payout: 975, deadline: new Date() },
    { id: "2", name: "Josh Help - Sue's", clientName: "Josh Help", address: "26 Hunting Manor Dr, St Charles, MO, 63303", status: "Open Payment", payout: 1, deadline: new Date() },
    { id: "3", name: "Holly Carson - Hank", clientName: "Holly Carson", address: "40 Moorings Dr, Lake St Louis, MO, 63367", status: "In Progress", payout: -383, deadline: new Date() },
  ];

  const filtered = useMemo(() => {
    const byTab = (j: Job) => {
      switch (active) {
        case "not-started": return j.status === "Not Started";
        case "in-progress": return j.status === "In Progress";
        case "complete": return j.status === "Complete";
        case "open-payment": return j.status === "Open Payment";
        case "finalized": return j.status === "Finalized";
        default: return true;
      }
    };
    const byQuery = (j: Job) =>
      (j.name + j.clientName + j.address).toLowerCase().includes(q.toLowerCase());
    return jobs.filter(byTab).filter(byQuery);
  }, [jobs, active, q]);

  return (
    <div
      className={cn(
        "min-h-[calc(100dvh-64px)]",
        // Fundo premium em cinzas (radial + linear) com leve glass
        "bg-[radial-gradient(1200px_600px_at_-10%_-20%,#f3f4f6_0%,#e7e9ee_35%,#e6e7eb_60%,#e4e5ea_100%)]",
        "dark:bg-[radial-gradient(1200px_600px_at_-10%_-20%,#0a0a0a_0%,#0d0e10_40%,#0d0e10_100%)]"
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900">My Jobs</h1>
            <p className="text-sm text-neutral-500">Gerencie seus trabalhos, status e pagamentos.</p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => router.push('/dashboard/jobs/new')}>
            <Plus className="h-4 w-4" />
            New Job
          </Button>
        </div>

        {/* Filtros */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={active} onValueChange={(v) => setActive(v as any)} className="w-full sm:w-auto">
            <TabsList className="bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="not-started">Not Started</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="complete">Complete</TabsTrigger>
              <TabsTrigger value="open-payment">Open Payment</TabsTrigger>
              <TabsTrigger value="finalized">Finalized</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-1 sm:flex-none items-center gap-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search job, client or address…"
                className="pl-8 bg-white/70 placeholder:text-neutral-400"
              />
            </div>

            <div className="hidden sm:flex items-center rounded-lg bg-white/60 backdrop-blur p-1">
              <Button variant={view === "cards" ? "default" : "ghost"} size="icon" onClick={() => setView("cards")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button variant={view === "table" ? "default" : "ghost"} size="icon" onClick={() => setView("table")}>
                <Rows className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Lista */}
        {view === "cards" ? (
          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            {filtered.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm backdrop-blur-sm bg-white/75">
            <CardHeader className="pb-2">
              <div className="text-sm text-neutral-500">Table view</div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="min-w-[840px] w-full text-sm">
                <thead className="text-neutral-500">
                  <tr className="[&_th]:text-left [&_th]:py-2">
                    <th>Job</th>
                    <th>Client</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Payout</th>
                    <th>Deadline</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="text-neutral-800">
                  {filtered.map((j) => (
                    <tr key={j.id} className="border-t border-neutral-100">
                      <td className="py-3 font-medium">{j.name}</td>
                      <td>{j.clientName}</td>
                      <td className="max-w-[280px] truncate">{j.address}</td>
                      <td><StatusBadge status={j.status} /></td>
                      <td className={cn(j.payout < 0 ? "text-red-600" : "")}>
                        {Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(j.payout)}
                      </td>
                      <td>{j.deadline ? format(new Date(j.deadline), "MMM dd, yyyy") : "—"}</td>
                      <td className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-neutral-500">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/jobs/${j.id}`)}>Open</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
