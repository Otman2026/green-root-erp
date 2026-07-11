import { createFileRoute, Link } from "@tanstack/react-router";
import { TrendingUp, ShoppingCart, Package, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { MODULES } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();

  const kpis = [
    { icon: TrendingUp, tk: "dashboard.kpi.sales",     value: "—", color: "mod-sales" },
    { icon: ShoppingCart, tk: "dashboard.kpi.orders",  value: "—", color: "mod-products" },
    { icon: Package, tk: "dashboard.kpi.stock",        value: "—", color: "mod-warehouses" },
    { icon: Users, tk: "dashboard.kpi.customers",      value: "—", color: "mod-customers" },
  ];

  const modules = MODULES.filter((m) => m.key !== "dashboard");

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.welcome")}{user?.email} — {t("dashboard.overview")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.tk} className="card-elevated p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{t(k.tk)}</span>
                <div
                  className="grid h-9 w-9 place-items-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklab, var(--color-${k.color}) 15%, transparent)` }}
                >
                  <Icon className="h-4 w-4" style={{ color: `var(--color-${k.color})` }} />
                </div>
              </div>
              <div className="mt-3 text-2xl font-bold">{k.value}</div>
            </Card>
          );
        })}
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t("dashboard.modules")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.key} to={m.path} className="group">
                <Card className="card-elevated p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in oklab, var(--color-mod-${m.color}) 15%, transparent)` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: `var(--color-mod-${m.color})` }} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{t(m.labelKey)}</div>
                      <div className="text-xs text-muted-foreground">{t("common.comingSoon")}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
