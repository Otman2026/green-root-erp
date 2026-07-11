import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Truck, Users, Route as RouteIcon, Fuel, Wrench, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/fleet")({ component: FleetHub });

function FleetHub() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ vehicles: 0, drivers: 0, trips: 0, fuel: 0 });

  useEffect(() => {
    (async () => {
      const from = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0,10);
      const [v, d, tr, f] = await Promise.all([
        (supabase as any).from("fleet_vehicles").select("id", { count: "exact", head: true }).eq("status","active"),
        (supabase as any).from("fleet_drivers").select("id", { count: "exact", head: true }).eq("status","active"),
        (supabase as any).from("fleet_trips").select("distance").gte("trip_date", from),
        (supabase as any).from("fleet_fuel_logs").select("total_cost").gte("date", from),
      ]);
      reportSupabaseErrors("الأسطول", v, d, tr, f);
      setKpi({
        vehicles: v.count ?? 0,
        drivers: d.count ?? 0,
        trips: (tr.data ?? []).reduce((s: number, r: any) => s + Number(r.distance ?? 0), 0),
        fuel: (f.data ?? []).reduce((s: number, r: any) => s + Number(r.total_cost ?? 0), 0),
      });
    })();
  }, []);

  const cards = [
    { to: "/fleet/vehicles",    icon: Truck,     label: t("fleet.vehicles") },
    { to: "/fleet/drivers",     icon: Users,     label: t("fleet.drivers") },
    { to: "/fleet/trips",       icon: RouteIcon, label: t("fleet.trips") },
    { to: "/fleet/fuel",        icon: Fuel,      label: t("fleet.fuel") },
    { to: "/fleet/maintenance", icon: Wrench,    label: t("fleet.maintenance") },
    { to: "/fleet/tracking",    icon: MapPin,    label: t("fleet.tracking") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3"><Truck className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.title")}</h1></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("fleet.kpi.vehicles")} value={String(kpi.vehicles)} icon={Truck} />
        <Kpi label={t("fleet.kpi.drivers")} value={String(kpi.drivers)} icon={Users} />
        <Kpi label={t("fleet.kpi.distance")} value={kpi.trips.toLocaleString() + " km"} icon={RouteIcon} />
        <Kpi label={t("fleet.kpi.fuel")} value={kpi.fuel.toLocaleString()} icon={Fuel} />
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
