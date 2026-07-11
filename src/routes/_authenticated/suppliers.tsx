import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Truck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, toCSV, downloadFile } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/suppliers")({ component: SuppliersPage });

interface Supplier {
  id: string; name: string; company: string | null; phone: string | null;
  email: string | null; country: string | null; city: string | null;
  address: string | null; notes: string | null; balance: number;
  is_active: boolean; created_at: string;
}
const empty: Partial<Supplier> = { name: "" };

function SuppliersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Supplier>>(empty);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const load = async () => {
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.name.toLowerCase().includes(s) || (r.phone ?? "").includes(s) || (r.company ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.name?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      name: editing.name, company: editing.company || null, phone: editing.phone || null,
      email: editing.email || null, country: editing.country || null, city: editing.city || null,
      address: editing.address || null, notes: editing.notes || null,
    };
    const res = editing.id
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("auth.success")); setOpen(false); setEditing(empty); load();
  };

  const del = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const openDetail = async (s: Supplier) => {
    setDetail(s);
    const [po, inv, pay] = await Promise.all([
      supabase.from("purchase_orders").select("*").eq("supplier_id", s.id).order("created_at", { ascending: false }),
      supabase.from("supplier_invoices").select("*").eq("supplier_id", s.id).order("invoice_date", { ascending: false }),
      supabase.from("supplier_payments").select("*").eq("supplier_id", s.id).order("paid_at", { ascending: false }),
    ]);
    setOrders((po.data ?? []) as any); setInvoices((inv.data ?? []) as any); setPayments((pay.data ?? []) as any);
  };

  const exportCsv = () => {
    const data = filtered.map((r) => ({ name: r.name, company: r.company, phone: r.phone, city: r.city, balance: r.balance }));
    downloadFile(`suppliers-${new Date().toISOString().slice(0,10)}.csv`, toCSV(data));
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Truck className="h-6 w-6 text-primary" /> {t("suppliers.title")}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} {t("common.total")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> {t("common.export")}</Button>
          <Button onClick={() => { setEditing(empty); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("suppliers.new")}</Button>
        </div>
      </div>

      <Card className="p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>{t("common.phone")}</TableHead>
            <TableHead>{t("common.city")}</TableHead>
            <TableHead>{t("common.balance")}</TableHead>
            <TableHead className="text-end">{t("common.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.company ?? "—"}</TableCell>
                <TableCell dir="ltr">{r.phone ?? "—"}</TableCell>
                <TableCell>{r.city ?? "—"}</TableCell>
                <TableCell className={Number(r.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(r.balance)}</TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing.id ? t("common.edit") : t("suppliers.new")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>{t("common.name")} *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Company</Label><Input value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.phone")}</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.email")}</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={editing.country ?? ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.city")}</Label><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>{t("common.address")}</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>{t("common.notes")}</Label><Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{detail?.name}</DialogTitle></DialogHeader>
          {detail && (
            <Tabs defaultValue="orders">
              <TabsList>
                <TabsTrigger value="orders">{t("suppliers.tabs.orders")}</TabsTrigger>
                <TabsTrigger value="invoices">{t("suppliers.tabs.invoices")}</TabsTrigger>
                <TabsTrigger value="payments">{t("suppliers.tabs.payments")}</TabsTrigger>
              </TabsList>
              <TabsContent value="orders">
                <Table><TableHeader><TableRow><TableHead>PO</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead>{t("common.total")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {orders.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                    : orders.map((o) => <TableRow key={o.id}><TableCell className="font-mono">{o.po_no}</TableCell><TableCell className="text-xs">{fmtDateTime(o.created_at)}</TableCell><TableCell>{t(`purchases.status.${o.status}`)}</TableCell><TableCell className="font-mono">{fmtMoney(o.total)}</TableCell></TableRow>)}
                  </TableBody></Table>
              </TabsContent>
              <TabsContent value="invoices">
                <Table><TableHeader><TableRow><TableHead>{t("sales.invoiceNo")}</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.balance")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                    : invoices.map((i) => <TableRow key={i.id}><TableCell>{i.invoice_no ?? "—"}</TableCell><TableCell className="text-xs">{fmtDateTime(i.invoice_date)}</TableCell><TableCell className="font-mono">{fmtMoney(i.total)}</TableCell><TableCell className="font-mono">{fmtMoney(i.balance)}</TableCell></TableRow>)}
                  </TableBody></Table>
              </TabsContent>
              <TabsContent value="payments">
                <Table><TableHeader><TableRow><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.type")}</TableHead><TableHead>{t("receipts.amount")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                    : payments.map((p) => <TableRow key={p.id}><TableCell className="text-xs">{fmtDateTime(p.paid_at)}</TableCell><TableCell>{p.method}</TableCell><TableCell className="font-mono">{fmtMoney(p.amount)}</TableCell></TableRow>)}
                  </TableBody></Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
