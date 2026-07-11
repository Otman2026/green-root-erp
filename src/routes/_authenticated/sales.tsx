import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Printer, Ban, Undo2, ShoppingCart, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [detail, setDetail] = useState<Sale | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

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

  const view = async (s: Sale) => {
    setDetail(s);
    const [i, p] = await Promise.all([
      supabase.from("sale_items").select("*, products(name,sku)").eq("sale_id", s.id),
      supabase.from("sale_payments").select("*").eq("sale_id", s.id).order("paid_at"),
    ]);
    setItems((i.data ?? []) as any); setPayments((p.data ?? []) as any);
  };

  const voidSale = async (s: Sale) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("sales").update({ status: "void" }).eq("id", s.id);
    if (error) return toast.error(error.message); toast.success(t("auth.success")); load();
  };

  const doReturn = async (s: Sale) => {
    if (!confirm("Create return for this sale?")) return;
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
    toast.success("Return created"); load();
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
    { key: "invoice", header: t("sales.invoiceNo"), accessor: (r) => <span className="font-mono">{r.invoice_no}</span>, sortValue: (r) => r.invoice_no, exportValue: (r) => r.invoice_no },
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
          <Button size="icon" variant="ghost" onClick={() => view(r)}><Eye className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => printInvoice(r)}><Printer className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => shareWhatsapp(r)} title="WhatsApp">📱</Button>
          <Button size="icon" variant="ghost" onClick={() => doReturn(r)} title="Return"><Undo2 className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => voidSale(r)} title="Void"><Ban className="h-4 w-4 text-destructive" /></Button>
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

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{detail?.invoice_no}</DialogTitle></DialogHeader>
          {detail && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">{t("common.customer")}:</span> {customers[detail.customer_id ?? ""] ?? "—"}</div>
                <div><span className="text-muted-foreground">{t("common.date")}:</span> {fmtDateTime(detail.created_at)}</div>
                <div><span className="text-muted-foreground">{t("common.total")}:</span> <b>{fmtMoney(detail.total)}</b></div>
                <div><span className="text-muted-foreground">{t("common.balance")}:</span> <b>{fmtMoney(detail.balance)}</b></div>
              </div>
              <Card>
                <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>{t("common.quantity")}</TableHead><TableHead>{t("common.price")}</TableHead><TableHead>{t("common.total")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {items.map((i) => <TableRow key={i.id}><TableCell>{i.products?.name ?? "—"}</TableCell><TableCell className="font-mono">{i.qty}</TableCell><TableCell className="font-mono">{fmtMoney(i.unit_price)}</TableCell><TableCell className="font-mono">{fmtMoney(i.total)}</TableCell></TableRow>)}
                  </TableBody></Table>
              </Card>
              {payments.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">{t("customers.tabs.payments")}</h4>
                  <Table><TableHeader><TableRow><TableHead>{t("common.date")}</TableHead><TableHead>{t("pos.method")}</TableHead><TableHead>{t("receipts.amount")}</TableHead></TableRow></TableHeader>
                    <TableBody>{payments.map((p) => <TableRow key={p.id}><TableCell className="text-xs">{fmtDateTime(p.paid_at)}</TableCell><TableCell>{t(`pos.method.${p.method}`)}</TableCell><TableCell className="font-mono">{fmtMoney(p.amount)}</TableCell></TableRow>)}</TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
