import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingCart, Package, Users, Wallet, Receipt, CircleDollarSign, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";


export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState({ salesToday: 0, salesMonth: 0, invoices: 0, customers: 0, products: 0, debtsC: 0, debtsS: 0, receiptsToday: 0 });
  const [top, setTop] = useState<{ name: string; qty: number }[]>([]);

  useEffect(() => {
    (async () => {
      const today = new Date(); today.setHours(0,0,0,0);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const [salesT, salesM, invs, cust, prod, dC, dS, recT, items] = await Promise.all([
        supabase.from("sales").select("total").eq("type","sale").neq("status","void").gte("created_at", today.toISOString()),
        supabase.from("sales").select("total").eq("type","sale").neq("status","void").gte("created_at", monthStart.toISOString()),
        supabase.from("sales").select("id", { count: "exact", head: true }).eq("type","sale").neq("status","void"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("balance").gt("balance", 0),
        supabase.from("suppliers").select("balance").gt("balance", 0),
        supabase.from("receipts").select("amount,direction").gte("received_at", today.toISOString()),
        supabase.from("sale_items").select("product_id,qty,products(name)").limit(500),
      ]);
      const sum = (arr: any[] | null, key: string) => (arr ?? []).reduce((s, r) => s + Number(r[key] ?? 0), 0);
      const recIn = (recT.data ?? []).filter((r: any) => r.direction === "in").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
      setStats({
        salesToday: sum(salesT.data as any, "total"),
        salesMonth: sum(salesM.data as any, "total"),
        invoices: invs.count ?? 0,
        customers: cust.count ?? 0,
        products: prod.count ?? 0,
        debtsC: sum(dC.data as any, "balance"),
        debtsS: sum(dS.data as any, "balance"),
        receiptsToday: recIn,
      });
      const agg: Record<string, { name: string; qty: number }> = {};
      (items.data ?? []).forEach((r: any) => {
        const name = r.products?.name ?? "—";
        agg[name] = agg[name] ?? { name, qty: 0 };
        agg[name].qty += Number(r.qty ?? 0);
      });
      setTop(Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 5));
    })();
  }, []);

  const kpis = [
    { icon: TrendingUp, tk: "dashboard.kpi.sales", value: fmtMoney(stats.salesToday), color: "mod-sales" },
    { icon: TrendingUp, tk: "accounting.revenue", value: fmtMoney(stats.salesMonth), color: "mod-sales" },
    { icon: ShoppingCart, tk: "dashboard.kpi.orders", value: String(stats.invoices), color: "mod-products" },
    { icon: Users, tk: "dashboard.kpi.customers", value: String(stats.customers), color: "mod-customers" },
    { icon: Package, tk: "dashboard.kpi.stock", value: String(stats.products), color: "mod-warehouses" },
    { icon: CircleDollarSign, tk: "accounting.debts.customers", value: fmtMoney(stats.debtsC), color: "mod-accounting" },
    { icon: Truck, tk: "accounting.debts.suppliers", value: fmtMoney(stats.debtsS), color: "mod-suppliers" },
    { icon: Receipt, tk: "receipts.title", value: fmtMoney(stats.receiptsToday), color: "mod-accounting" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("dashboard.welcome")}{user?.email} — {t("dashboard.overview")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => { const Icon = k.icon; return (
          <Card key={k.tk} className="card-elevated p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t(k.tk)}</span>
              <div className="grid h-9 w-9 place-items-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, var(--color-${k.color}) 15%, transparent)` }}>
                <Icon className="h-4 w-4" style={{ color: `var(--color-${k.color})` }} />
              </div>
            </div>
            <div className="mt-2 text-xl font-bold">{k.value}</div>
          </Card>
        ); })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">Top products</h3>
          {top.length === 0 ? <div className="text-sm text-muted-foreground">—</div>
          : <div className="space-y-2">{top.map((p) => (
            <div key={p.name} className="flex items-center gap-3">
              <div className="min-w-0 flex-1 truncate text-sm">{p.name}</div>
              <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                <div className="h-full bg-primary" style={{ width: `${Math.min(100, (p.qty / (top[0]?.qty || 1)) * 100)}%` }} />
              </div>
              <div className="w-16 text-end font-mono text-sm">{p.qty.toFixed(0)}</div>
            </div>
          ))}</div>}
        </Card>
        <Card className="p-4">
          <Wallet className="mb-2 h-5 w-5 text-primary" />
          <div className="text-xs text-muted-foreground">{t("accounting.profit")}</div>
          <div className="mt-1 text-2xl font-bold">{fmtMoney(stats.salesMonth)}</div>
          <div className="mt-2 text-xs text-muted-foreground">Month sales total</div>
        </Card>
      </div>
    </div>
  );
}

