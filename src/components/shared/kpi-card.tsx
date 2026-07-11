import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Preset gradient keys → utility class */
const GRADIENTS: Record<string, string> = {
  primary: "gradient-primary",
  sales: "gradient-sales",
  profit: "gradient-profit",
  customers: "gradient-customers",
  suppliers: "gradient-suppliers",
  inventory: "gradient-inventory",
  orders: "gradient-orders",
  invoices: "gradient-invoices",
  expenses: "gradient-expenses",
  accounting: "gradient-accounting",
  ai: "gradient-ai",
};

export function KpiCard({
  label, value, icon: Icon, delta, hint, colorVar = "primary", tone,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
  colorVar?: string;
  /** Preset gradient tone: sales|profit|customers|suppliers|inventory|orders|invoices|expenses|accounting|ai */
  tone?: keyof typeof GRADIENTS;
}) {
  const up = (delta ?? 0) >= 0;

  if (tone && GRADIENTS[tone]) {
    return (
      <div className={cn("kpi-card animate-float-in", GRADIENTS[tone])}>
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-white/85">{label}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{value}</p>
            {(hint || delta !== undefined) && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                {delta !== undefined && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 font-semibold backdrop-blur">
                    {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(delta).toFixed(1)}%
                  </span>
                )}
                {hint && <span className="truncate text-white/80">{hint}</span>}
              </div>
            )}
          </div>
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20 backdrop-blur">
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-elevated animate-float-in overflow-hidden rounded-xl border bg-card p-4">
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
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
          style={{ background: `color-mix(in oklab, var(--color-${colorVar}) 15%, transparent)` }}
        >
          <Icon className="h-5 w-5" style={{ color: `var(--color-${colorVar})` }} />
        </div>
      </div>
    </div>
  );
}
