import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Eye, Printer, Ban, Undo2, ShoppingCart, Download, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, toCSV, downloadFile, printHtml, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/sales")({ component: SalesPage });

interface Sale {
  id: string; invoice_no: string; type: string; status: string;
  customer_id: string | null; total: number; paid: number; balance: number;
  created_at: string; notes: string | null;
}

function SalesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<Sale | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const load = async () => {
    const [s, c] = await Promise.all([
      supabase.from("sales").select("*").neq("type", "quote").order("created_at", { ascending: false }).limit(500),
      supabase.from("customers").select("id,name,phone"),
    ]);
    if (s.error) toast.error(s.error.message);
    setRows((s.data ?? []) as any);
    const map: Record<string, string> = {}; (c.data ?? []).forEach((x: any) => { map[x.id] = x.name; }); setCustomers(map);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    const okQ = !s || r.invoice_no.toLowerCase().includes(s) || (customers[r.customer_id ?? ""] ?? "").toLowerCase().includes(s);
    const okS = status === "all" || r.status === status;
    return okQ && okS;
  }), [rows, q, status, customers]);

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
    const { data: its } = await supabase.from("sale_items").select("*, products(name)").eq("sale_id", s.id);
    const rowsHtml = (its ?? []).map((l: any) => `<tr><td>${l.products?.name ?? "—"}</td><td class="r">${l.qty}</td><td class="r">${fmtMoney(l.unit_price)}</td><td class="r">${fmtMoney(l.total)}</td></tr>`).join("");
    printHtml(`
      <div class="head"><div><h2>Haytam AGRI</h2><div class="muted">${t(`sales.type.${s.type}`)}</div></div>
      <div><b>${s.invoice_no}</b><div class="muted">${fmtDateTime(s.created_at)}</div></div></div>
      <div><b>Customer:</b> ${customers[s.customer_id ?? ""] ?? "Walk-in"}</div>
      <table><thead><tr><th>Product</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Total</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      <div class="totals">
        <div class="grand"><span>Total</span><span>${fmtMoney(s.total)}</span></div>
        <div><span>Paid</span><span>${fmtMoney(s.paid)}</span></div>
        <div><span>Balance</span><span>${fmtMoney(s.balance)}</span></div>
      </div>`);
  };

  const exportCsv = () => {
    downloadFile(`sales-${new Date().toISOString().slice(0,10)}.csv`,
      toCSV(filtered.map((r) => ({ invoice: r.invoice_no, date: r.created_at, customer: customers[r.customer_id ?? ""] ?? "", type: r.type, status: r.status, total: r.total, paid: r.paid, balance: r.balance }))));
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

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="h-6 w-6 text-primary" /> {t("sales.title")}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} {t("common.total")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> {t("common.export")}</Button>
          <Button asChild className="gap-2"><Link to="/pos"><Zap className="h-4 w-4" /> {t("pos.title")}</Link></Button>
        </div>
      </div>

      <Card className="flex flex-wrap gap-3 p-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {["draft","confirmed","paid","partial","void"].map((s) => <SelectItem key={s} value={s}>{t(`sales.status.${s}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("sales.invoiceNo")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("common.customer")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("common.total")}</TableHead>
            <TableHead>{t("common.balance")}</TableHead>
            <TableHead className="text-end">{t("common.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono">{r.invoice_no}</TableCell>
                <TableCell className="text-xs">{fmtDateTime(r.created_at)}</TableCell>
                <TableCell>{customers[r.customer_id ?? ""] ?? "—"}</TableCell>
                <TableCell><Badge variant="secondary">{t(`sales.type.${r.type}`)}</Badge></TableCell>
                <TableCell><Badge variant={statusColor[r.status] ?? "outline"}>{t(`sales.status.${r.status}`)}</Badge></TableCell>
                <TableCell className="font-mono">{fmtMoney(r.total)}</TableCell>
                <TableCell className={Number(r.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(r.balance)}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => view(r)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => printInvoice(r)}><Printer className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => shareWhatsapp(r)} title="WhatsApp">📱</Button>
                  <Button size="icon" variant="ghost" onClick={() => doReturn(r)} title="Return"><Undo2 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => voidSale(r)} title="Void"><Ban className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

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
              <Table><TableHeader><TableRow><TableHead>Product</TableHead><TableHead>{t("common.quantity")}</TableHead><TableHead>{t("common.price")}</TableHead><TableHead>{t("common.total")}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {items.map((i) => <TableRow key={i.id}><TableCell>{i.products?.name ?? "—"}</TableCell><TableCell className="font-mono">{i.qty}</TableCell><TableCell className="font-mono">{fmtMoney(i.unit_price)}</TableCell><TableCell className="font-mono">{fmtMoney(i.total)}</TableCell></TableRow>)}
                </TableBody></Table>
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
