import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width="32"
          height="32"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300 hover:scale-110"
        >
          {/* House Structure */}
          <path
            d="M20 50L50 20L80 50V80C80 85.5228 75.5228 90 70 90H30C24.4772 90 20 85.5228 20 80V50Z"
            fill="#18181B"
          />
          {/* Paint Tray/Base Accent */}
          <rect x="35" y="60" width="30" height="20" rx="2" fill="#F59E0B" />
          {/* Bristle Accents */}
          <path d="M40 80V85" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d="M50 80V85" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
          <path d="M60 80V85" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <h1 className="text-xl font-black font-headline tracking-tighter text-zinc-900 leading-none">
        PaintFlow
      </h1>
    </div>
  );
}
