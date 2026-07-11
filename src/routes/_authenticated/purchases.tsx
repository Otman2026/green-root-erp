import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ClipboardList, Trash2, CheckCircle2, PackageCheck, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/purchases")({ component: PurchasesPage });

interface Line { product_id: string; qty: number; unit_cost: number }

function PurchasesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<{ supplier_id: string; warehouse_id: string; notes: string; lines: Line[] }>({ supplier_id: "", warehouse_id: "", notes: "", lines: [] });

  const load = async () => {
    const [po, sp, pr, wh] = await Promise.all([
      supabase.from("purchase_orders").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("suppliers").select("id,name"),
      supabase.from("products").select("id,name,sku,cost_price"),
      supabase.from("warehouses").select("id,name"),
    ]);
    setRows((po.data ?? []) as any); setSuppliers((sp.data ?? []) as any);
    setProducts((pr.data ?? []) as any); setWarehouses((wh.data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { product_id: "", qty: 1, unit_cost: 0 }] }));
  const setLine = (i: number, patch: Partial<Line>) => setForm((f) => ({ ...f, lines: f.lines.map((l, idx) => idx === i ? { ...l, ...patch } : l) }));
  const rmLine = (i: number) => setForm((f) => ({ ...f, lines: f.lines.filter((_, idx) => idx !== i) }));

  const subtotal = form.lines.reduce((s, l) => s + l.qty * l.unit_cost, 0);

  const createPO = async () => {
    if (!form.supplier_id || form.lines.length === 0) return toast.error("Missing data");
    const { data: po, error } = await supabase.from("purchase_orders").insert({
      supplier_id: form.supplier_id, warehouse_id: form.warehouse_id || null,
      subtotal, total: subtotal, notes: form.notes || null, created_by: user?.id ?? null,
    } as any).select().single();
    if (error || !po) return toast.error(error?.message ?? "Failed");
    await supabase.from("purchase_order_items").insert(form.lines.filter((l) => l.product_id).map((l) => ({
      po_id: po.id, product_id: l.product_id, qty: l.qty, unit_cost: l.unit_cost, total: l.qty * l.unit_cost,
    })));
    toast.success(po.po_no);
    setOpen(false); setForm({ supplier_id: "", warehouse_id: "", notes: "", lines: [] }); load();
  };

  const approve = async (po: any) => {
    const { error } = await supabase.from("purchase_orders").update({ status: "approved", approved_by: user?.id ?? null, approved_at: new Date().toISOString() }).eq("id", po.id);
    if (error) return toast.error(error.message); toast.success(t("auth.success")); load();
  };

  const receive = async (po: any) => {
    if (!confirm(t("purchases.receive") + "?")) return;
    const { data: poItems } = await supabase.from("purchase_order_items").select("*").eq("po_id", po.id);
    if (!poItems?.length) return toast.error("No items");
    const { data: r, error } = await supabase.from("purchase_receipts").insert({
      po_id: po.id, supplier_id: po.supplier_id, warehouse_id: po.warehouse_id, received_by: user?.id ?? null,
    } as any).select().single();
    if (error || !r) return toast.error(error?.message ?? "Failed");
    await supabase.from("purchase_receipt_items").insert(poItems.map((i: any) => ({
      receipt_id: r.id, product_id: i.product_id, qty: i.qty, unit_cost: i.unit_cost,
    })));
    await supabase.from("purchase_orders").update({ status: "received" }).eq("id", po.id);
    toast.success(t("auth.success")); load();
  };

  const invoice = async (po: any) => {
    const { error } = await supabase.from("supplier_invoices").insert({
      supplier_id: po.supplier_id, po_id: po.id, subtotal: po.subtotal, tax: po.tax, total: po.total, balance: po.total,
    });
    if (error) return toast.error(error.message);
    await supabase.from("purchase_orders").update({ status: "invoiced" }).eq("id", po.id);
    // supplier balance +
    if (po.supplier_id) {
      const { data: s } = await supabase.from("suppliers").select("balance").eq("id", po.supplier_id).maybeSingle();
      await supabase.from("suppliers").update({ balance: (s?.balance ?? 0) + Number(po.total) }).eq("id", po.supplier_id);
    }
    toast.success(t("auth.success")); load();
  };

  const view = async (po: any) => {
    setDetail(po);
    const { data } = await supabase.from("purchase_order_items").select("*, products(name)").eq("po_id", po.id);
    setItems((data ?? []) as any);
  };

  const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline", approved: "secondary", ordered: "secondary", received: "default", invoiced: "default", closed: "default", cancelled: "destructive",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="h-6 w-6 text-primary" /> {t("purchases.title")}</h1>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("purchases.new")}</Button>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow><TableHead>PO</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.supplier")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : rows.map((po) => (
              <TableRow key={po.id}>
                <TableCell className="font-mono">{po.po_no}</TableCell>
                <TableCell className="text-xs">{fmtDateTime(po.created_at)}</TableCell>
                <TableCell>{suppliers.find((s) => s.id === po.supplier_id)?.name ?? "—"}</TableCell>
                <TableCell><Badge variant={statusColor[po.status] ?? "outline"}>{t(`purchases.status.${po.status}`)}</Badge></TableCell>
                <TableCell className="font-mono">{fmtMoney(po.total)}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => view(po)}><Eye className="h-4 w-4" /></Button>
                  {po.status === "draft" && <Button size="icon" variant="ghost" onClick={() => approve(po)} title="Approve"><CheckCircle2 className="h-4 w-4 text-primary" /></Button>}
                  {(po.status === "approved" || po.status === "ordered") && <Button size="icon" variant="ghost" onClick={() => receive(po)} title="Receive"><PackageCheck className="h-4 w-4 text-primary" /></Button>}
                  {po.status === "received" && <Button size="sm" variant="outline" onClick={() => invoice(po)}>{t("purchases.invoice")}</Button>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t("purchases.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.supplier")} *</Label>
                <Select value={form.supplier_id} onValueChange={(v) => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("nav.warehouses")}</Label>
                <Select value={form.warehouse_id || "none"} onValueChange={(v) => setForm({ ...form, warehouse_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="none">—</SelectItem>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>{t("nav.products")}</Label>
                <Button size="sm" variant="outline" onClick={addLine}><Plus className="me-1 h-4 w-4" /> {t("common.add")}</Button>
              </div>
              <div className="space-y-2">
                {form.lines.map((l, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_100px_100px_40px] gap-2 items-center">
                    <Select value={l.product_id} onValueChange={(v) => { const p = products.find((x) => x.id === v); setLine(i, { product_id: v, unit_cost: p?.cost_price ?? l.unit_cost }); }}>
                      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input type="number" step="any" value={l.qty} onChange={(e) => setLine(i, { qty: Number(e.target.value) })} />
                    <Input type="number" step="any" value={l.unit_cost} onChange={(e) => setLine(i, { unit_cost: Number(e.target.value) })} />
                    <div className="text-end font-mono text-sm">{fmtMoney(l.qty * l.unit_cost)}</div>
                    <Button size="icon" variant="ghost" onClick={() => rmLine(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-end text-lg font-bold">{t("common.total")}: {fmtMoney(subtotal)}</div>
            </div>
            <div className="space-y-1.5"><Label>{t("common.notes")}</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={createPO}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.po_no}</DialogTitle></DialogHeader>
          <Table><TableHeader><TableRow><TableHead>{t("nav.products")}</TableHead><TableHead>{t("common.quantity")}</TableHead><TableHead>{t("common.price")}</TableHead><TableHead>{t("common.total")}</TableHead></TableRow></TableHeader>
            <TableBody>{items.map((i) => <TableRow key={i.id}><TableCell>{i.products?.name ?? "—"}</TableCell><TableCell className="font-mono">{i.qty}</TableCell><TableCell className="font-mono">{fmtMoney(i.unit_cost)}</TableCell><TableCell className="font-mono">{fmtMoney(i.total)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
