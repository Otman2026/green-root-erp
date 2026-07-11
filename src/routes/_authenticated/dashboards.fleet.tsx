import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/dashboards/fleet")({ component: FleetDashboard });

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function FleetDashboard() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ vehicles: 0, drivers: 0, trips30: 0, fuelCost30: 0 });
  const [byStatus, setByStatus] = useState<{ name: string; value: number }[]>([]);
  const [fuelByVehicle, setFuelByVehicle] = useState<{ name: string; cost: number }[]>([]);

  useEffect(() => {
    (async () => {
      const from = new Date(); from.setDate(from.getDate()-29); from.setHours(0,0,0,0);
      const [vehs, drvs, trips, fuel] = await Promise.all([
        supabase.from("fleet_vehicles").select("id,status,plate"),
        supabase.from("fleet_drivers").select("id"),
        supabase.from("fleet_trips").select("id").gte("created_at", from.toISOString()),
        supabase.from("fleet_fuel_logs").select("total_cost,vehicle_id,fleet_vehicles(plate)").gte("created_at", from.toISOString()),
      ]);
      reportSupabaseErrors("الأسطول", vehs, drvs, trips, fuel);
      const vdata = vehs.data ?? [];
      const fuelCost = (fuel.data ?? []).reduce((s: number, r: any) => s + Number(r.total_cost ?? 0), 0);
      setKpi({ vehicles: vdata.length, drivers: (drvs.data ?? []).length, trips30: (trips.data ?? []).length, fuelCost30: fuelCost });

      const smap: Record<string, number> = {};
      vdata.forEach((v: any) => { const s = v.status ?? "—"; smap[s] = (smap[s] ?? 0) + 1; });
      setByStatus(Object.entries(smap).map(([name, value]) => ({ name, value })));

      const vmap: Record<string, number> = {};
      (fuel.data ?? []).forEach((r: any) => { const n = r.fleet_vehicles?.plate ?? "—"; vmap[n] = (vmap[n] ?? 0) + Number(r.total_cost ?? 0); });
      setFuelByVehicle(Object.entries(vmap).map(([name, cost]) => ({ name, cost })).sort((a,b)=>b.cost-a.cost).slice(0,8));
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("dash.fleet.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("dash.fleet.vehicles")} value={String(kpi.vehicles)} />
        <Kpi label={t("dash.fleet.drivers")} value={String(kpi.drivers)} />
        <Kpi label={t("dash.fleet.trips30")} value={String(kpi.trips30)} />
        <Kpi label={t("dash.fleet.fuel30")} value={fmtMoney(kpi.fuelCost30)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.fleet.byStatus")}</h3>
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={byStatus} dataKey="value" nameKey="name" outerRadius={80} label>{byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.fleet.fuelByVehicle")}</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={fuelByVehicle}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="cost" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="card-elevated p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></Card>;
}
