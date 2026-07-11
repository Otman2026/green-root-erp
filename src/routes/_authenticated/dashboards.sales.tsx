import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/dashboards/sales")({ component: SalesDashboard });

function SalesDashboard() {
  const { t } = useI18n();
  const [daily, setDaily] = useState<{ day: string; total: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([]);
  const [topCustomers, setTopCustomers] = useState<{ name: string; total: number }[]>([]);
  const [kpi, setKpi] = useState({ month: 0, count: 0, avg: 0, unpaid: 0 });

  useEffect(() => {
    (async () => {
      const from = new Date(); from.setDate(from.getDate() - 29); from.setHours(0,0,0,0);
      const [sales, items, custs, unpaid] = await Promise.all([
        supabase.from("sales").select("total,created_at,customer_id,customers(name)").eq("type","sale").neq("status","void").gte("created_at", from.toISOString()),
        supabase.from("sale_items").select("qty,products(name)").limit(1000),
        supabase.from("sales").select("customer_id,total,customers(name)").eq("type","sale").neq("status","void").not("customer_id","is",null).limit(1000),
        supabase.from("sales").select("balance").eq("type","sale").neq("status","void").gt("balance", 0),
      ]);
      reportSupabaseErrors("المبيعات", sales, items, custs, unpaid);
      const byDay: Record<string, number> = {};
      for (let i = 0; i < 30; i++) { const d = new Date(from); d.setDate(from.getDate() + i); byDay[d.toISOString().slice(5,10)] = 0; }
      let sum = 0; const rows = sales.data ?? [];
      rows.forEach((r: any) => { const k = new Date(r.created_at).toISOString().slice(5,10); byDay[k] = (byDay[k] ?? 0) + Number(r.total ?? 0); sum += Number(r.total ?? 0); });
      setDaily(Object.entries(byDay).map(([day, total]) => ({ day, total })));
      const unpaidSum = (unpaid.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      setKpi({ month: sum, count: rows.length, avg: rows.length ? sum / rows.length : 0, unpaid: unpaidSum });

      const pmap: Record<string, number> = {};
      (items.data ?? []).forEach((r: any) => { const n = r.products?.name ?? "—"; pmap[n] = (pmap[n] ?? 0) + Number(r.qty ?? 0); });
      setTopProducts(Object.entries(pmap).map(([name, qty]) => ({ name, qty })).sort((a,b)=>b.qty-a.qty).slice(0,7));

      const cmap: Record<string, number> = {};
      (custs.data ?? []).forEach((r: any) => { const n = r.customers?.name ?? "—"; cmap[n] = (cmap[n] ?? 0) + Number(r.total ?? 0); });
      setTopCustomers(Object.entries(cmap).map(([name, total]) => ({ name, total })).sort((a,b)=>b.total-a.total).slice(0,7));
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("dash.sales.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("dash.sales.month")} value={fmtMoney(kpi.month)} />
        <Kpi label={t("dash.sales.count")} value={String(kpi.count)} />
        <Kpi label={t("dash.sales.avg")} value={fmtMoney(kpi.avg)} />
        <Kpi label={t("dash.sales.unpaid")} value={fmtMoney(kpi.unpaid)} />
      </div>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">{t("dash.sales.trend30")}</h3>
        <div className="h-64"><ResponsiveContainer><LineChart data={daily}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="day" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.sales.topProducts")}</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={topProducts}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="qty" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.sales.topCustomers")}</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={topCustomers}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="total" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="card-elevated p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></Card>;
}
