import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  label, value, icon: Icon, delta, hint, colorVar = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  colorVar?: string;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            {(hint || delta !== undefined) && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {delta !== undefined && (
                  <span className={cn("inline-flex items-center gap-0.5 font-semibold", up ? "text-emerald-600" : "text-rose-600")}>
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(delta).toFixed(1)}%
                  </span>
                )}
                {hint && <span className="truncate text-muted-foreground">{hint}</span>}
              </div>
            )}
          </div>
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
            style={{ background: `color-mix(in oklab, var(--color-${colorVar}) 15%, transparent)` }}
          >
            <Icon className="h-5 w-5" style={{ color: `var(--color-${colorVar})` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
