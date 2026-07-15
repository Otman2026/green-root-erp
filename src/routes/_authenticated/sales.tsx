import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Printer, Ban, Undo2, ShoppingCart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, whatsappLink } from "@/lib/format";
import { printDocument } from "@/lib/print-templates";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";

export const Route = createFileRoute("/_authenticated/sales")({ component: SalesPage });

interface Sale {
  id: string; invoice_no: string; type: string; status: string;
  customer_id: string | null; total: number; paid: number; balance: number;
  created_at: string; notes: string | null;
}

function SalesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    const [s, c] = await Promise.all([
      supabase.from("sales").select("*").neq("type", "quote").order("created_at", { ascending: false }).limit(500),
      supabase.from("customers").select("id,name,phone"),
    ]);
    if (s.error) toast.error(s.error.message);
    setRows((s.data ?? []) as any);
    const map: Record<string, string> = {}; (c.data ?? []).forEach((x: any) => { map[x.id] = x.name; }); setCustomers(map);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => status === "all" || r.status === status), [rows, status]);

  const voidSale = async (s: Sale) => {
    if (s.status === "void") return;
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.rpc("void_sale", { _sale_id: s.id });
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
    load();
  };

  const doReturn = async (s: Sale) => {
    if (s.type === "return" || s.status === "void") return;
    if (!confirm(t("sales.confirmReturn"))) return;
    const { data: origItems } = await supabase.from("sale_items").select("*").eq("sale_id", s.id);
    const { data: ret, error } = await supabase.from("sales").insert({
      type: "return", status: "confirmed", customer_id: s.customer_id,
      parent_sale_id: s.id, subtotal: s.total, total: s.total,
    } as any).select().single();
    if (error || !ret) return toast.error(error?.message ?? "Failed");
    if (origItems?.length) {
      await supabase.from("sale_items").insert(origItems.map((it: any) => ({
        sale_id: ret.id, product_id: it.product_id, qty: it.qty,
        unit_price: it.unit_price, discount: 0, tax: 0, total: it.total,
      })));
    }
    toast.success(t("auth.success"));
    load();
  };

  const printInvoice = async (s: Sale) => {
    const { data: its } = await supabase.from("sale_items").select("*, products(name,sku)").eq("sale_id", s.id);
    const party = s.customer_id
      ? (await supabase.from("customers").select("name,phone,address").eq("id", s.customer_id).maybeSingle()).data
      : { name: "Walk-in" };
    await printDocument({
      type: s.type === "return" ? "return" : s.type === "quote" ? "quote" : "invoice",
      docNo: s.invoice_no, date: s.created_at, party,
      lines: (its ?? []).map((l: any) => ({
        name: l.products?.name ?? "—", sku: l.products?.sku ?? null,
        qty: Number(l.qty), unit_price: Number(l.unit_price),
        discount: Number(l.discount ?? 0), tax: Number(l.tax ?? 0), total: Number(l.total),
      })),
      subtotal: Number(s.total), total: Number(s.total),
      paid: Number(s.paid), balance: Number(s.balance),
      notes: s.notes,
    });
  };

  const shareWhatsapp = async (s: Sale) => {
    if (!s.customer_id) return toast.error("No customer");
    const { data: c } = await supabase.from("customers").select("phone,name").eq("id", s.customer_id).maybeSingle();
    if (!c?.phone) return toast.error("No phone");
    const msg = `Invoice ${s.invoice_no}\nTotal: ${fmtMoney(s.total)}\nBalance: ${fmtMoney(s.balance)}`;
    window.open(whatsappLink(c.phone, msg), "_blank");
  };

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", confirmed: "secondary", paid: "default", partial: "outline", void: "destructive",
  };

  const columns: Column<Sale>[] = [
    { key: "invoice", header: t("sales.invoiceNo"), accessor: (r) => <Link to="/sales/$id" params={{ id: r.id }} className="font-mono text-primary hover:underline">{r.invoice_no}</Link>, sortValue: (r) => r.invoice_no, exportValue: (r) => r.invoice_no },
    { key: "date", header: t("common.date"), accessor: (r) => <span className="text-xs">{fmtDateTime(r.created_at)}</span>, sortValue: (r) => r.created_at, exportValue: (r) => r.created_at },
    { key: "customer", header: t("common.customer"), accessor: (r) => customers[r.customer_id ?? ""] ?? "—", sortValue: (r) => customers[r.customer_id ?? ""] ?? "", exportValue: (r) => customers[r.customer_id ?? ""] ?? "" },
    { key: "type", header: t("common.type"), accessor: (r) => <Badge variant="secondary">{t(`sales.type.${r.type}`)}</Badge>, sortValue: (r) => r.type, exportValue: (r) => r.type },
    { key: "status", header: t("common.status"), accessor: (r) => <Badge variant={statusColor[r.status] ?? "outline"}>{t(`sales.status.${r.status}`)}</Badge>, sortValue: (r) => r.status, exportValue: (r) => r.status },
    { key: "total", header: t("common.total"), accessor: (r) => <span className="font-mono">{fmtMoney(r.total)}</span>, sortValue: (r) => Number(r.total), exportValue: (r) => Number(r.total) },
    { key: "balance", header: t("common.balance"), accessor: (r) => <span className={Number(r.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(r.balance)}</span>, sortValue: (r) => Number(r.balance), exportValue: (r) => Number(r.balance) },
    {
      key: "actions", header: t("common.actions"), sortable: false, hideable: false, className: "text-end",
      accessor: (r) => (
        <div className="text-end">
          <Button asChild size="icon" variant="ghost" title={t("common.view") || "View"}><Link to="/sales/$id" params={{ id: r.id }}><Eye className="h-4 w-4" /></Link></Button>
          <Button size="icon" variant="ghost" onClick={() => printInvoice(r)} title={t("common.print") || "Print"}><Printer className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => shareWhatsapp(r)} title="WhatsApp"><span aria-hidden="true">📱</span></Button>
          {r.type !== "return" && r.status !== "void" && <Button size="icon" variant="ghost" onClick={() => doReturn(r)} title={t("sales.return")}><Undo2 className="h-4 w-4" /></Button>}
          {r.status !== "void" && <Button size="icon" variant="ghost" onClick={() => voidSale(r)} title={t("sales.status.void")}><Ban className="h-4 w-4 text-destructive" /></Button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        icon={ShoppingCart} title={t("sales.title")} subtitle={`${rows.length} ${t("common.total")}`} colorVar="primary"
        actions={<Button asChild className="gap-2"><Link to="/pos"><Zap className="h-4 w-4" /> {t("pos.title")}</Link></Button>}
      />

      <DataTable
        data={filtered} columns={columns} isLoading={loading}
        rowKey={(r) => r.id}
        exportName="sales" exportTitle="Sales"
        searchKeys={["invoice_no"]}
        rightSlot={
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {["draft","confirmed","paid","partial","void"].map((s) => <SelectItem key={s} value={s}>{t(`sales.status.${s}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />
    </div>
  );
}
