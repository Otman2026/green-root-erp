import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { UserCog, MapPin, TrendingUp, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sales-reps")({ component: RepsHub });

function RepsHub() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ reps: 0, visits: 0, sales: 0, commissions: 0 });

  useEffect(() => {
    (async () => {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const [r, v, s, c] = await Promise.all([
        (supabase as any).from("sales_reps").select("id", { count: "exact", head: true }).eq("status", "active"),
        (supabase as any).from("sales_visits").select("id", { count: "exact", head: true }).gte("visit_date", from),
        (supabase as any).from("sales").select("total").gte("created_at", from).not("sales_rep_id", "is", null),
        (supabase as any).from("sales_commissions").select("commission_amount").eq("period_year", now.getFullYear()).eq("period_month", now.getMonth() + 1),
      ]);
      setKpi({
        reps: r.count ?? 0,
        visits: v.count ?? 0,
        sales: (s.data ?? []).reduce((x: number, y: any) => x + Number(y.total ?? 0), 0),
        commissions: (c.data ?? []).reduce((x: number, y: any) => x + Number(y.commission_amount ?? 0), 0),
      });
    })();
  }, []);

  const cards = [
    { to: "/sales-reps/list",        icon: UserCog,   label: t("reps.list") },
    { to: "/sales-reps/visits",      icon: MapPin,    label: t("reps.visits") },
    { to: "/sales-reps/commissions", icon: TrendingUp,label: t("reps.commissions") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><UserCog className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("reps.title")}</h1></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("reps.kpi.reps")} value={String(kpi.reps)} icon={UserCog} />
        <Kpi label={t("reps.kpi.visits")} value={String(kpi.visits)} icon={MapPin} />
        <Kpi label={t("reps.kpi.sales")} value={kpi.sales.toLocaleString()} icon={Target} />
        <Kpi label={t("reps.kpi.commissions")} value={kpi.commissions.toLocaleString()} icon={TrendingUp} />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="flex cursor-pointer flex-col items-center gap-2 p-5 transition hover:shadow-md">
              <c.icon className="h-8 w-8 text-primary" />
              <div className="text-sm font-medium">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
function Kpi({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between"><div className="text-xs text-muted-foreground">{label}</div><Icon className="h-4 w-4 text-primary" /></div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </Card>
  );
}
