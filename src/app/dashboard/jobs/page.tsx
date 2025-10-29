"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const filters = [
  { label: "All", value: "all" },
  { label: "Not Started", value: "not_started" },
  { label: "In Progress", value: "in_progress" },
  { label: "Complete", value: "complete" },
  { label: "Open Payment", value: "open_payment" },
  { label: "Finalized", value: "finalized" },
];

export default function MyJobsPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-zinc-50 to-zinc-100 p-4 sm:p-8 rounded-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Jobs</h1>
          <p className="text-gray-500 text-sm">
            Gerencie seus trabalhos, status e pagamentos.
          </p>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gray-900 text-white font-medium shadow hover:bg-gray-800 transition-colors">
          <Plus size={18} /> New Job
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap justify-start gap-2 sm:gap-3 mb-6">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-full border transition-colors",
              activeFilter === filter.value
                ? "bg-black text-white border-black"
                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Campo de busca */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search job, client or address..."
          className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-gray-300 focus:outline-none transition-all"
        />
      </div>

      {/* Cards de Jobs */}
      <div className="flex flex-col gap-4">
        {/* Job card exemplo */}
        <div className="p-5 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
              Middeke #11532
            </h2>
            <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium">
              Not Started
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-1">
            Client: <span className="font-medium">Gwen Middeke</span>
          </p>
          <p className="text-sm text-gray-600 mb-2">
            📍 1028 Bellevaux Pl, St Charles, MO 63301
          </p>

          <div className="flex justify-between text-sm text-gray-700 mt-3">
            <p>
              <span className="text-gray-500">Payout:</span> 
              <span className="font-semibold">$975</span>
            </p>
            <p>
              <span className="text-gray-500">Deadline:</span> 
              <span className="font-semibold">Oct 24, 2025</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}