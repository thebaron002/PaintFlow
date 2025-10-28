import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";

export function RecentProjects() {
  const items = [
    { title: "Web Development Project", tags: ["Remote", "Part-time"], paid: true, rate: "$10/h" },
    { title: "Copyright Project", tags: [], paid: false, rate: "$10/h" },
    { title: "Web Design Project", tags: [], paid: true, rate: "$10/h" },
  ];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Your Recent Projects</h3>
        <button className="text-sm text-zinc-700 hover:underline">See all</button>
      </div>

      <div className="space-y-3">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl bg-white/70 p-4 border border-white/60 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-zinc-900/90 text-white grid place-items-center">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate">{it.title}</p>
                  {it.paid ? (
                    <Badge className="bg-zinc-900 text-white">Paid</Badge>
                  ) : (
                    <Badge variant="secondary">Not Paid</Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-700 mt-1">{it.rate}</p>
                <div className="mt-2 flex gap-2 flex-wrap">
                  {it.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="bg-white/80">
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
