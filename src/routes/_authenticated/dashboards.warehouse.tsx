import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/dashboards/warehouse")({ component: WarehouseDashboard });

const COLORS = ["hsl(var(--primary))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

function WarehouseDashboard() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ products: 0, low: 0, out: 0, movements: 0 });
  const [lowStock, setLowStock] = useState<{ name: string; qty: number }[]>([]);
  const [byCat, setByCat] = useState<{ name: string; value: number }[]>([]);
  const [movements, setMovements] = useState<{ type: string; qty: number }[]>([]);

  useEffect(() => {
    (async () => {
      const [prods, moves, cats] = await Promise.all([
        supabase.from("products").select("name,stock_quantity,min_stock,category_id,categories(name)"),
        supabase.from("stock_movements").select("type,quantity").gte("created_at", new Date(Date.now()-30*86400000).toISOString()),
        supabase.from("categories").select("id,name"),
      ]);
      reportSupabaseErrors("المخزون", prods, moves, cats);
      const pdata = prods.data ?? [];
      const low = pdata.filter((p: any) => Number(p.stock_quantity ?? 0) <= Number(p.min_stock ?? 0) && Number(p.stock_quantity ?? 0) > 0);
      const out = pdata.filter((p: any) => Number(p.stock_quantity ?? 0) <= 0);
      setKpi({ products: pdata.length, low: low.length, out: out.length, movements: (moves.data ?? []).length });
      setLowStock(low.slice(0, 10).map((p: any) => ({ name: p.name, qty: Number(p.stock_quantity ?? 0) })));

      const catMap: Record<string, number> = {};
      pdata.forEach((p: any) => { const n = p.categories?.name ?? "—"; catMap[n] = (catMap[n] ?? 0) + Number(p.stock_quantity ?? 0); });
      setByCat(Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b)=>b.value-a.value).slice(0,6));

      const mmap: Record<string, number> = {};
      (moves.data ?? []).forEach((m: any) => { mmap[m.type] = (mmap[m.type] ?? 0) + Number(m.quantity ?? 0); });
      setMovements(Object.entries(mmap).map(([type, qty]) => ({ type, qty })));
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("dash.warehouse.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("dash.warehouse.products")} value={String(kpi.products)} />
        <Kpi label={t("dash.warehouse.low")} value={String(kpi.low)} />
        <Kpi label={t("dash.warehouse.out")} value={String(kpi.out)} />
        <Kpi label={t("dash.warehouse.movements30")} value={String(kpi.movements)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.warehouse.lowStock")}</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={lowStock} layout="vertical"><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis type="number" fontSize={11}/><YAxis type="category" dataKey="name" width={100} fontSize={10}/><Tooltip/><Bar dataKey="qty" fill="#ef4444"/></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.warehouse.byCategory")}</h3>
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={byCat} dataKey="value" nameKey="name" outerRadius={80} label>{byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.warehouse.movementsBreakdown")}</h3>
        <div className="h-64"><ResponsiveContainer><BarChart data={movements}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="type" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="qty" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="card-elevated p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></Card>;
}
