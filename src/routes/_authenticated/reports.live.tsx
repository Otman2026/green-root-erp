import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type Column } from "@/components/shared/data-table";
import { KpiCard } from "@/components/shared/kpi-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { fmtMoney, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/reports/live")({ component: LiveReports });

function useRange() {
  const today = new Date();
  const start = new Date(); start.setDate(start.getDate() - 30);
  const [from, setFrom] = useState(start.toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  return { from, to, setFrom, setTo };
}

function LiveReports() {
  const { from, to, setFrom, setTo } = useRange();

  return (
    <div className="space-y-4">
      <PageHeader icon={BarChart3} title="التقارير الحية" subtitle="تقارير تفاعلية بمعايير مخصصة" />

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><Label className="text-xs"><Calendar className="me-1 inline h-3 w-3" /> من</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-44" /></div>
          <div className="space-y-1"><Label className="text-xs">إلى</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-44" /></div>
        </div>
      </Card>

      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">ملخّص المبيعات</TabsTrigger>
          <TabsTrigger value="products">أفضل المنتجات</TabsTrigger>
          <TabsTrigger value="customers">كشوف العملاء</TabsTrigger>
          <TabsTrigger value="profit">هامش الربح</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4"><SalesSummary from={from} to={to} /></TabsContent>
        <TabsContent value="products" className="mt-4"><TopProducts from={from} to={to} /></TabsContent>
        <TabsContent value="customers" className="mt-4"><CustomerStatements from={from} to={to} /></TabsContent>
        <TabsContent value="profit" className="mt-4"><ProfitMargin from={from} to={to} /></TabsContent>
      </Tabs>
    </div>
  );
}

type Range = { from: string; to: string };

function SalesSummary({ from, to }: Range) {
  const { data } = useQuery({
    queryKey: ["rep-sales", from, to],
    queryFn: async () => {
      const { data } = await supabase.from("sales")
        .select("id,invoice_no,created_at,total,paid,balance,status,customer_id,customers(name)")
        .eq("type", "sale").neq("status", "void")
        .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const rows = data ?? [];
  const total = rows.reduce((s, r: any) => s + Number(r.total ?? 0), 0);
  const paid = rows.reduce((s, r: any) => s + Number(r.paid ?? 0), 0);
  const balance = total - paid;

  const cols: Column<any>[] = [
    { key: "invoice_no", header: "الفاتورة", accessor: (r) => r.invoice_no, sortable: true },
    { key: "date", header: "التاريخ", accessor: (r) => fmtDate(r.created_at), sortValue: (r) => r.created_at, exportValue: (r) => r.created_at, sortable: true },
    { key: "customer", header: "العميل", accessor: (r) => r.customers?.name ?? "—", exportValue: (r) => r.customers?.name ?? "" },
    { key: "total", header: "الإجمالي", accessor: (r) => fmtMoney(r.total), sortValue: (r) => Number(r.total ?? 0), exportValue: (r) => Number(r.total ?? 0), sortable: true },
    { key: "paid", header: "المدفوع", accessor: (r) => fmtMoney(r.paid), sortValue: (r) => Number(r.paid ?? 0), exportValue: (r) => Number(r.paid ?? 0) },
    { key: "balance", header: "الرصيد", accessor: (r) => fmtMoney(r.balance), sortValue: (r) => Number(r.balance ?? 0), exportValue: (r) => Number(r.balance ?? 0) },
    { key: "status", header: "الحالة", accessor: (r) => r.status },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard title="عدد الفواتير" value={String(rows.length)} />
        <KpiCard title="إجمالي المبيعات" value={fmtMoney(total)} />
        <KpiCard title="المحصّل" value={fmtMoney(paid)} />
        <KpiCard title="الرصيد" value={fmtMoney(balance)} />
      </div>
      <DataTable data={rows} columns={cols} exportName={`sales_${from}_${to}`} exportTitle="ملخص المبيعات" />
    </div>
  );
}

function TopProducts({ from, to }: Range) {
  const { data } = useQuery({
    queryKey: ["rep-top-products", from, to],
    queryFn: async () => {
      const { data: sales } = await supabase.from("sales").select("id")
        .eq("type", "sale").neq("status", "void")
        .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`);
      const ids = (sales ?? []).map((s: any) => s.id);
      if (ids.length === 0) return [];
      const { data: items } = await supabase.from("sale_items")
        .select("product_id,qty,unit_price,total,products(name,sku)")
        .in("sale_id", ids);
      const map = new Map<string, any>();
      for (const it of items ?? []) {
        const key = it.product_id;
        const cur = map.get(key) ?? { product_id: key, name: (it as any).products?.name ?? "—", sku: (it as any).products?.sku ?? "", qty: 0, revenue: 0 };
        cur.qty += Number(it.qty ?? 0);
        cur.revenue += Number(it.total ?? Number(it.qty ?? 0) * Number(it.unit_price ?? 0));
        map.set(key, cur);
      }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    },
  });
  const rows = data ?? [];
  const cols: Column<any>[] = [
    { key: "name", header: "المنتج", accessor: (r) => r.name, sortable: true },
    { key: "sku", header: "الكود", accessor: (r) => r.sku },
    { key: "qty", header: "الكمية", accessor: (r) => r.qty, sortValue: (r) => r.qty, sortable: true },
    { key: "revenue", header: "الإيراد", accessor: (r) => fmtMoney(r.revenue), sortValue: (r) => r.revenue, exportValue: (r) => r.revenue, sortable: true },
  ];
  return <DataTable data={rows} columns={cols} exportName={`top_products_${from}_${to}`} exportTitle="أفضل المنتجات" />;
}

function CustomerStatements({ from, to }: Range) {
  const { data } = useQuery({
    queryKey: ["rep-customers", from, to],
    queryFn: async () => {
      const { data: sales } = await supabase.from("sales")
        .select("customer_id,total,paid,balance")
        .eq("type", "sale").neq("status", "void")
        .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`);
      const map = new Map<string, any>();
      for (const s of sales ?? []) {
        const key = (s as any).customer_id ?? "walk-in";
        const cur = map.get(key) ?? { customer_id: key, name: "", invoices: 0, total: 0, paid: 0, balance: 0 };
        cur.invoices += 1;
        cur.total += Number(s.total ?? 0);
        cur.paid += Number(s.paid ?? 0);
        cur.balance += Number(s.balance ?? 0);
        map.set(key, cur);
      }
      const ids = Array.from(map.keys()).filter((k) => k !== "walk-in");
      if (ids.length > 0) {
        const { data: custs } = await supabase.from("customers").select("id,name").in("id", ids);
        for (const c of custs ?? []) { const row = map.get(c.id); if (row) row.name = c.name; }
      }
      const walk = map.get("walk-in"); if (walk) walk.name = "زبون نقدي";
      return Array.from(map.values()).sort((a, b) => b.total - a.total);
    },
  });
  const rows = data ?? [];
  const cols: Column<any>[] = [
    { key: "name", header: "العميل", accessor: (r) => r.name || "—", sortable: true },
    { key: "invoices", header: "الفواتير", accessor: (r) => r.invoices, sortValue: (r) => r.invoices, sortable: true },
    { key: "total", header: "إجمالي المبيعات", accessor: (r) => fmtMoney(r.total), sortValue: (r) => r.total, exportValue: (r) => r.total, sortable: true },
    { key: "paid", header: "المدفوع", accessor: (r) => fmtMoney(r.paid), sortValue: (r) => r.paid, exportValue: (r) => r.paid },
    { key: "balance", header: "الرصيد", accessor: (r) => fmtMoney(r.balance), sortValue: (r) => r.balance, exportValue: (r) => r.balance, sortable: true },
  ];
  return <DataTable data={rows} columns={cols} exportName={`customers_${from}_${to}`} exportTitle="كشوف العملاء" />;
}

function ProfitMargin({ from, to }: Range) {
  const { data } = useQuery({
    queryKey: ["rep-profit", from, to],
    queryFn: async () => {
      const { data: sales } = await supabase.from("sales").select("id")
        .eq("type", "sale").neq("status", "void")
        .gte("created_at", `${from}T00:00:00`).lte("created_at", `${to}T23:59:59`);
      const ids = (sales ?? []).map((s: any) => s.id);
      if (ids.length === 0) return [];
      const { data: items } = await supabase.from("sale_items")
        .select("product_id,qty,unit_price,total,products(name,sku,cost_price)")
        .in("sale_id", ids);
      const map = new Map<string, any>();
      for (const it of items ?? []) {
        const p = (it as any).products;
        const cost = Number(p?.cost_price ?? 0) * Number(it.qty ?? 0);
        const rev = Number(it.total ?? Number(it.qty ?? 0) * Number(it.unit_price ?? 0));
        const key = it.product_id;
        const cur = map.get(key) ?? { product_id: key, name: p?.name ?? "—", sku: p?.sku ?? "", qty: 0, revenue: 0, cost: 0 };
        cur.qty += Number(it.qty ?? 0);
        cur.revenue += rev;
        cur.cost += cost;
        map.set(key, cur);
      }
      const out = Array.from(map.values()).map((r) => ({ ...r, profit: r.revenue - r.cost, margin: r.revenue > 0 ? ((r.revenue - r.cost) / r.revenue) * 100 : 0 }));
      return out.sort((a, b) => b.profit - a.profit);
    },
  });
  const rows = data ?? [];
  const totals = useMemo(() => {
    const rev = rows.reduce((s: number, r: any) => s + r.revenue, 0);
    const cost = rows.reduce((s: number, r: any) => s + r.cost, 0);
    return { rev, cost, profit: rev - cost, margin: rev > 0 ? ((rev - cost) / rev) * 100 : 0 };
  }, [rows]);
  const cols: Column<any>[] = [
    { key: "name", header: "المنتج", accessor: (r) => r.name, sortable: true },
    { key: "sku", header: "الكود", accessor: (r) => r.sku },
    { key: "qty", header: "الكمية", accessor: (r) => r.qty, sortValue: (r) => r.qty },
    { key: "revenue", header: "الإيراد", accessor: (r) => fmtMoney(r.revenue), sortValue: (r) => r.revenue, exportValue: (r) => r.revenue, sortable: true },
    { key: "cost", header: "التكلفة", accessor: (r) => fmtMoney(r.cost), sortValue: (r) => r.cost, exportValue: (r) => r.cost },
    { key: "profit", header: "الربح", accessor: (r) => fmtMoney(r.profit), sortValue: (r) => r.profit, exportValue: (r) => r.profit, sortable: true },
    { key: "margin", header: "الهامش %", accessor: (r) => `${r.margin.toFixed(1)}%`, sortValue: (r) => r.margin, exportValue: (r) => r.margin.toFixed(2), sortable: true },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard title="إجمالي الإيراد" value={fmtMoney(totals.rev)} />
        <KpiCard title="إجمالي التكلفة" value={fmtMoney(totals.cost)} />
        <KpiCard title="صافي الربح" value={fmtMoney(totals.profit)} />
        <KpiCard title="متوسط الهامش" value={`${totals.margin.toFixed(1)}%`} />
      </div>
      <DataTable data={rows} columns={cols} exportName={`profit_${from}_${to}`} exportTitle="هامش الربح" />
    </div>
  );
}
