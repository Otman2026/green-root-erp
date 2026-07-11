import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  icon: Icon, title, subtitle, colorVar, actions,
}: {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  colorVar?: string;
  actions?: ReactNode;
}) {
  const color = colorVar ? { color: `var(--color-${colorVar})` } : undefined;
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted">
            <Icon className="h-6 w-6" style={color} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2 justify-self-end">{actions}</div>}
    </header>
  );
}
