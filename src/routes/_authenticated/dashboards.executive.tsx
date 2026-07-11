import { Card, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import {
  TrendingUp, TrendingDown, AlertTriangle, PackageX, CircleDollarSign,
  Receipt, ShoppingCart, Users, Warehouse, Bell,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/dashboards/executive")({
  component: ExecutiveDashboard,
});

type Alert = {
  id: string;
  severity: "critical" | "warning" | "info";
  icon: typeof AlertTriangle;
  title: string;
  detail: string;
  href?: string;
};

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 200 80% 55%))", "hsl(var(--chart-3, 30 80% 55%))", "hsl(var(--chart-4, 280 60% 60%))", "hsl(var(--chart-5, 340 70% 55%))"];

function ExecutiveDashboard() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({
    salesMonth: 0, salesPrev: 0, salesCount: 0,
    purchasesMonth: 0, unpaidSales: 0, unpaidPurchases: 0,
    cashOnHand: 0, bankBalance: 0, customers: 0, products: 0,
  });
  const [trend, setTrend] = useState<{ day: string; sales: number; purchases: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; qty: number }[]>([]);
  const [byWh, setByWh] = useState<{ name: string; value: number }[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const from = new Date(now); from.setDate(now.getDate() - 29); from.setHours(0, 0, 0, 0);
      const prevFrom = new Date(from); prevFrom.setDate(from.getDate() - 30);
      const soon = new Date(now); soon.setDate(now.getDate() + 7);

      const [
        salesRes, prevSalesRes, purchRes, unpaidSalesRes, unpaidPurchRes,
        cashRes, bankRes, custRes, prodRes,
        lowStockRes, dueChecksRes, overdueDebtsRes, whStockRes,
        salesItemsRes,
      ] = await Promise.all([
        supabase.from("sales").select("total,created_at").eq("type", "sale").neq("status", "void").gte("created_at", from.toISOString()),
        supabase.from("sales").select("total").eq("type", "sale").neq("status", "void").gte("created_at", prevFrom.toISOString()).lt("created_at", from.toISOString()),
        supabase.from("purchase_orders").select("total_amount,created_at").gte("created_at", from.toISOString()),
        supabase.from("sales").select("balance").eq("type", "sale").neq("status", "void").gt("balance", 0),
        supabase.from("purchase_orders").select("total_amount,paid_amount").gt("total_amount", 0),
        supabase.from("cash_boxes").select("current_balance"),
        supabase.from("bank_accounts").select("current_balance"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id,name,stock_quantity,min_stock_alert").eq("status", "active"),
        supabase.from("products").select("id,name,stock_quantity,min_stock_alert").eq("status", "active").limit(500),
        supabase.from("checks").select("id,check_no,amount,due_date,party_name,direction").in("status", ["pending"]).lte("due_date", soon.toISOString().slice(0, 10)).order("due_date", { ascending: true }).limit(20),
        supabase.from("sales").select("id,invoice_no,balance,due_date,customers(name)").eq("type", "sale").neq("status", "void").gt("balance", 0).not("due_date", "is", null).lt("due_date", now.toISOString().slice(0, 10)).limit(20),
        supabase.from("product_locations").select("qty,warehouses(name)"),
        supabase.from("sale_items").select("qty,products(name),sales!inner(created_at,type,status)").gte("sales.created_at", from.toISOString()),
      ]);
      reportSupabaseErrors("اللوحة التنفيذية", salesRes, prevSalesRes, purchRes, unpaidSalesRes, unpaidPurchRes, cashRes, bankRes, custRes, prodRes, lowStockRes, dueChecksRes, overdueDebtsRes, whStockRes, salesItemsRes);

      const salesRows = salesRes.data ?? [];
      const purchRows = purchRes.data ?? [];
      const salesTotal = salesRows.reduce((s, r: any) => s + Number(r.total ?? 0), 0);
      const salesPrev = (prevSalesRes.data ?? []).reduce((s, r: any) => s + Number(r.total ?? 0), 0);
      const purchTotal = purchRows.reduce((s, r: any) => s + Number(r.total_amount ?? 0), 0);
      const unpaidS = (unpaidSalesRes.data ?? []).reduce((s, r: any) => s + Number(r.balance ?? 0), 0);
      const unpaidP = (unpaidPurchRes.data ?? []).reduce((s, r: any) => s + Math.max(0, Number(r.total_amount ?? 0) - Number(r.paid_amount ?? 0)), 0);
      const cash = (cashRes.data ?? []).reduce((s, r: any) => s + Number(r.current_balance ?? 0), 0);
      const bank = (bankRes.data ?? []).reduce((s, r: any) => s + Number(r.current_balance ?? 0), 0);

      setKpi({
        salesMonth: salesTotal, salesPrev, salesCount: salesRows.length,
        purchasesMonth: purchTotal, unpaidSales: unpaidS, unpaidPurchases: unpaidP,
        cashOnHand: cash, bankBalance: bank,
        customers: custRes.count ?? 0, products: (prodRes.data ?? []).length,
      });

      const byDay: Record<string, { sales: number; purchases: number }> = {};
      for (let i = 0; i < 30; i++) {
        const d = new Date(from); d.setDate(from.getDate() + i);
        byDay[d.toISOString().slice(5, 10)] = { sales: 0, purchases: 0 };
      }
      salesRows.forEach((r: any) => {
        const k = new Date(r.created_at).toISOString().slice(5, 10);
        if (byDay[k]) byDay[k].sales += Number(r.total ?? 0);
      });
      purchRows.forEach((r: any) => {
        const k = new Date(r.created_at).toISOString().slice(5, 10);
        if (byDay[k]) byDay[k].purchases += Number(r.total_amount ?? 0);
      });
      setTrend(Object.entries(byDay).map(([day, v]) => ({ day, ...v })));

      const pmap: Record<string, number> = {};
      (salesItemsRes.data ?? []).forEach((r: any) => {
        const n = r.products?.name ?? "—";
        pmap[n] = (pmap[n] ?? 0) + Number(r.qty ?? 0);
      });
      setTopProducts(Object.entries(pmap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty).slice(0, 7));

      const wmap: Record<string, number> = {};
      (whStockRes.data ?? []).forEach((r: any) => {
        const n = r.warehouses?.name ?? "—";
        wmap[n] = (wmap[n] ?? 0) + Number(r.qty ?? 0);
      });
      setByWh(Object.entries(wmap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5));

      const al: Alert[] = [];
      const low = (lowStockRes.data ?? []).filter((p: any) => Number(p.stock_quantity ?? 0) <= Number(p.min_stock_alert ?? 0));
      if (low.length) {
        al.push({
          id: "low-stock", severity: low.length > 10 ? "critical" : "warning", icon: PackageX,
          title: t("exec.alert.lowStock"),
          detail: `${low.length} ${t("exec.alert.itemsAtOrBelowMin")}`,
          href: "/products",
        });
      }
      (dueChecksRes.data ?? []).forEach((c: any) => {
        al.push({
          id: `chk-${c.id}`, severity: "warning", icon: Receipt,
          title: `${t("exec.alert.checkDue")} #${c.check_no}`,
          detail: `${c.party_name ?? ""} — ${fmtMoney(Number(c.amount ?? 0))} — ${c.due_date}`,
          href: "/checks",
        });
      });
      (overdueDebtsRes.data ?? []).forEach((d: any) => {
        al.push({
          id: `debt-${d.id}`, severity: "critical", icon: CircleDollarSign,
          title: `${t("exec.alert.overdueInvoice")} ${d.invoice_no ?? ""}`,
          detail: `${d.customers?.name ?? ""} — ${fmtMoney(Number(d.balance ?? 0))} — ${d.due_date}`,
          href: "/debts",
        });
      });
      setAlerts(al);
      setLoading(false);
    })();
  }, [t]);

  const growth = kpi.salesPrev > 0 ? ((kpi.salesMonth - kpi.salesPrev) / kpi.salesPrev) * 100 : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("exec.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("exec.subtitle")}</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Bell className="h-3 w-3" /> {alerts.length} {t("exec.alerts")}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={ShoppingCart} label={t("exec.kpi.salesMonth")} value={fmtMoney(kpi.salesMonth)} sub={
          <span className={growth >= 0 ? "text-emerald-600" : "text-red-600"}>
            {growth >= 0 ? <TrendingUp className="inline h-3 w-3" /> : <TrendingDown className="inline h-3 w-3" />} {growth.toFixed(1)}%
          </span>
        } />
        <Kpi icon={Warehouse} label={t("exec.kpi.purchasesMonth")} value={fmtMoney(kpi.purchasesMonth)} />
        <Kpi icon={CircleDollarSign} label={t("exec.kpi.unpaidSales")} value={fmtMoney(kpi.unpaidSales)} />
        <Kpi icon={Receipt} label={t("exec.kpi.unpaidPurchases")} value={fmtMoney(kpi.unpaidPurchases)} />
        <Kpi icon={CircleDollarSign} label={t("exec.kpi.cashOnHand")} value={fmtMoney(kpi.cashOnHand)} />
        <Kpi icon={CircleDollarSign} label={t("exec.kpi.bankBalance")} value={fmtMoney(kpi.bankBalance)} />
        <Kpi icon={Users} label={t("exec.kpi.customers")} value={String(kpi.customers)} />
        <Kpi icon={Warehouse} label={t("exec.kpi.products")} value={String(kpi.products)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h3 className="mb-3 text-sm font-semibold">{t("exec.trend30")}</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="sales" name={t("exec.sales")} stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="purchases" name={t("exec.purchases")} stroke="hsl(var(--muted-foreground))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> {t("exec.smartAlerts")}
          </h3>
          <div className="max-h-72 space-y-2 overflow-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground">…</p>
            ) : alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("exec.noAlerts")}</p>
            ) : (
              alerts.map((a) => {
                const Icon = a.icon;
                const tone =
                  a.severity === "critical" ? "border-red-500/40 bg-red-500/5 text-red-700 dark:text-red-300" :
                  a.severity === "warning" ? "border-amber-500/40 bg-amber-500/5 text-amber-700 dark:text-amber-300" :
                  "border-border bg-muted/30";
                const body = (
                  <div className={`rounded-md border p-2 ${tone}`}>
                    <div className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold">{a.title}</div>
                        <div className="truncate text-xs opacity-80">{a.detail}</div>
                      </div>
                    </div>
                  </div>
                );
                return a.href ? (
                  <Link key={a.id} to={a.href} className="block">{body}</Link>
                ) : (
                  <div key={a.id}>{body}</div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{t("exec.topProducts")}</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-semibold">{t("exec.stockByWh")}</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byWh} dataKey="value" nameKey="name" outerRadius={90} label={(e) => e.name}>
                  {byWh.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof AlertTriangle; label: string; value: string; sub?: React.ReactNode }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs">{sub}</div>}
    </Card>
  );
}
