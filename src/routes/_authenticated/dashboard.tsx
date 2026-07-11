import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { scanAndNotify } from "@/lib/smart-notifications";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, ShoppingCart, Package, Users, Wallet, Receipt,
  CircleDollarSign, Truck, AlertTriangle, CalendarX, Activity,
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { fmtMoney } from "@/lib/format";
import { KpiCard } from "@/components/shared/kpi-card";
import { ChartCard } from "@/components/shared/chart-card";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/ds";
import { Alert, AlertDescription, AlertTitle, StatusBadge } from "@/ds";


export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

type Sale = { total: number | null; created_at: string; invoice_no: string; id: string; customer_id: string | null };

async function loadStats() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30); thirtyAgo.setHours(0, 0, 0, 0);
  const in30 = new Date(); in30.setDate(in30.getDate() + 30);

  const [
    salesToday, salesMonth, invCount, custCount, prodCount,
    debtsC, debtsS, recToday, saleItems, lowStock, expSoon,
    recentSales, cashBoxes, sales30, topCustomers,
  ] = await Promise.all([
    supabase.from("sales").select("total").eq("type", "sale").neq("status", "void").gte("created_at", today.toISOString()),
    supabase.from("sales").select("total").eq("type", "sale").neq("status", "void").gte("created_at", monthStart.toISOString()),
    supabase.from("sales").select("id", { count: "exact", head: true }).eq("type", "sale").neq("status", "void"),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("customers").select("balance").gt("balance", 0),
    supabase.from("suppliers").select("balance").gt("balance", 0),
    supabase.from("receipts").select("amount,direction").gte("received_at", today.toISOString()),
    supabase.from("sale_items").select("product_id,qty,products(name,name_ar)").limit(2000),
    supabase.from("products").select("id,name,name_ar,stock_quantity,min_stock_alert,unit").eq("status", "active").limit(200),
    supabase.from("product_batches").select("id,product_id,expiry_date,quantity,products(name,name_ar)").not("expiry_date", "is", null).lte("expiry_date", in30.toISOString().slice(0, 10)).gt("quantity", 0).order("expiry_date").limit(10),
    supabase.from("sales").select("id,invoice_no,total,created_at,customer_id").eq("type", "sale").neq("status", "void").order("created_at", { ascending: false }).limit(8),
    supabase.from("cash_boxes").select("balance"),
    supabase.from("sales").select("total,created_at").eq("type", "sale").neq("status", "void").gte("created_at", thirtyAgo.toISOString()),
    supabase.from("sales").select("customer_id,total,customers(name)").eq("type", "sale").neq("status", "void").gte("created_at", thirtyAgo.toISOString()).not("customer_id", "is", null).limit(2000),
  ]);

  const sum = (arr: { [k: string]: unknown }[] | null, k: string) =>
    (arr ?? []).reduce((s, r) => s + Number(r[k] ?? 0), 0);
  const recIn = (recToday.data ?? []).filter((r) => r.direction === "in").reduce((s, r) => s + Number(r.amount ?? 0), 0);

  // Top products
  const agg: Record<string, { name: string; qty: number }> = {};
  (saleItems.data ?? []).forEach((r) => {
    const p = r.products as { name?: string; name_ar?: string } | null;
    const name = p?.name_ar || p?.name || "—";
    agg[name] = agg[name] ?? { name, qty: 0 };
    agg[name].qty += Number(r.qty ?? 0);
  });
  const topProducts = Object.values(agg).sort((a, b) => b.qty - a.qty).slice(0, 8);

  // Low stock
  const low = (lowStock.data ?? [])
    .filter((p) => Number(p.stock_quantity ?? 0) <= Number(p.min_stock_alert ?? 0))
    .slice(0, 8);

  // 30-day timeseries
  const days: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  (sales30.data ?? []).forEach((s) => {
    const k = String(s.created_at).slice(0, 10);
    if (k in days) days[k] += Number(s.total ?? 0);
  });
  const chart30 = Object.entries(days).map(([date, total]) => ({
    date: date.slice(5),
    total: Math.round(total),
  }));

  // Top customers
  const custAgg: Record<string, { name: string; total: number }> = {};
  (topCustomers.data ?? []).forEach((s) => {
    const id = s.customer_id as string;
    const c = s.customers as { name?: string } | null;
    const name = c?.name || "—";
    custAgg[id] = custAgg[id] ?? { name, total: 0 };
    custAgg[id].total += Number(s.total ?? 0);
  });
  const bestCustomers = Object.values(custAgg).sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    salesToday: sum(salesToday.data, "total"),
    salesMonth: sum(salesMonth.data, "total"),
    invoices: invCount.count ?? 0,
    customers: custCount.count ?? 0,
    products: prodCount.count ?? 0,
    debtsC: sum(debtsC.data, "balance"),
    debtsS: sum(debtsS.data, "balance"),
    receiptsToday: recIn,
    cashBalance: sum(cashBoxes.data, "balance"),
    topProducts,
    lowStock: low,
    expiring: expSoon.data ?? [],
    recentSales: (recentSales.data ?? []) as Sale[],
    chart30,
    bestCustomers,
  };
}

function Dashboard() {
  const { user } = useAuth();
  const { data: s, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: loadStats,
    refetchInterval: 60_000,
  });

  useEffect(() => { if (user?.id) void scanAndNotify(user.id); }, [user?.id]);

  const alertsCount = (s?.lowStock.length ?? 0) + (s?.expiring.length ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Activity}
        title="لوحة التحكم"
        subtitle={`أهلاً ${user?.email ?? ""} — نظرة عامة على أداء الأعمال`}
      />

      {alertsCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>تنبيهات ذكية</AlertTitle>
          <AlertDescription>
            {s!.lowStock.length > 0 && <span className="me-3">🔴 {s!.lowStock.length} منتج بمخزون منخفض</span>}
            {s!.expiring.length > 0 && <span>🟡 {s!.expiring.length} دفعة قريبة الانتهاء</span>}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="مبيعات اليوم" value={fmtMoney(s?.salesToday ?? 0)} icon={TrendingUp} colorVar="mod-sales" hint="اليوم" />
        <KpiCard label="مبيعات الشهر" value={fmtMoney(s?.salesMonth ?? 0)} icon={TrendingUp} colorVar="mod-sales" hint="هذا الشهر" />
        <KpiCard label="عدد الفواتير" value={s?.invoices ?? 0} icon={ShoppingCart} colorVar="mod-products" />
        <KpiCard label="العملاء" value={s?.customers ?? 0} icon={Users} colorVar="mod-customers" />
        <KpiCard label="المنتجات النشطة" value={s?.products ?? 0} icon={Package} colorVar="mod-warehouses" />
        <KpiCard label="ديون العملاء" value={fmtMoney(s?.debtsC ?? 0)} icon={CircleDollarSign} colorVar="mod-accounting" />
        <KpiCard label="ديون للموردين" value={fmtMoney(s?.debtsS ?? 0)} icon={Truck} colorVar="mod-suppliers" />
        <KpiCard label="رصيد الصندوق" value={fmtMoney(s?.cashBalance ?? 0)} icon={Wallet} colorVar="mod-accounting" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard title="مبيعات آخر 30 يوم" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={s?.chart30 ?? []}>
                <defs>
                  <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip formatter={(v: number) => fmtMoney(v)} />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#fillSales)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="أفضل المنتجات">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={s?.topProducts ?? []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" fontSize={11} />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Bar dataKey="qty" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4" />آخر الفواتير
            </CardTitle>
            <Link to="/sales" className="text-xs text-primary hover:underline">عرض الكل</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <SkeletonRows /> : s?.recentSales.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">لا فواتير</p>
            ) : (
              s?.recentSales.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.invoice_no}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("ar-MA", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <span className="font-bold tabular-nums">{fmtMoney(Number(r.total ?? 0))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />مخزون منخفض
            </CardTitle>
            <Link to="/products" className="text-xs text-primary hover:underline">عرض الكل</Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <SkeletonRows /> : s?.lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">جميع المنتجات ضمن الحد الآمن</p>
            ) : (
              s?.lowStock.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                  <span className="min-w-0 truncate">{p.name_ar || p.name}</span>
                  <StatusBadge tone="danger" dot>{p.stock_quantity} {p.unit}</StatusBadge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarX className="h-4 w-4 text-amber-600" />قرب انتهاء الصلاحية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? <SkeletonRows /> : s?.expiring.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">لا توجد دفعات منتهية قريباً</p>
            ) : (
              s?.expiring.map((b) => {
                const p = b.products as { name?: string; name_ar?: string } | null;
                return (
                  <div key={b.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                    <span className="min-w-0 truncate">{p?.name_ar || p?.name}</span>
                    <Badge variant="outline" className="border-amber-500 text-amber-700">
                      {b.expiry_date ? new Date(b.expiry_date).toLocaleDateString("ar-MA") : "—"}
                    </Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />أفضل العملاء (آخر 30 يوم)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <SkeletonRows /> : s?.bestCustomers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">لا بيانات كافية</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {s?.bestCustomers.map((c, i) => (
                <div key={c.name + i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    #{i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">{fmtMoney(c.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-10 animate-pulse rounded bg-muted" />)}
    </>
  );
}
