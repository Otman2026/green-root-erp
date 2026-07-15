import { Button, Input, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime } from "@/lib/format";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";

export const Route = createFileRoute("/_authenticated/suppliers")({ component: SuppliersPage });

interface Supplier {
  id: string; name: string; contact_person: string | null; phone: string | null;
  email: string | null; country: string | null; city: string | null;
  address: string | null; tax_number: string | null; notes: string | null;
  balance: number; status: string; created_at: string;
}
const empty: Partial<Supplier> = { name: "", status: "active" };

type PayMethod = "cash" | "card" | "transfer" | "check";

function SuppliersPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Supplier>>(empty);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState<{ invoice_id: string; amount: string; method: PayMethod; reference: string; notes: string }>({ invoice_id: "", amount: "", method: "cash", reference: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing.name?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      name: editing.name,
      contact_person: editing.contact_person || null,
      phone: editing.phone || null,
      email: editing.email || null,
      country: editing.country || null,
      city: editing.city || null,
      address: editing.address || null,
      tax_number: editing.tax_number || null,
      notes: editing.notes || null,
      status: editing.status || "active",
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
    await refreshDetail(s.id);
  };

  const refreshDetail = async (sid: string) => {
    const [po, inv, pay] = await Promise.all([
      supabase.from("purchase_orders").select("*").eq("supplier_id", sid).order("created_at", { ascending: false }),
      supabase.from("supplier_invoices").select("*").eq("supplier_id", sid).order("invoice_date", { ascending: false }),
      supabase.from("supplier_payments").select("*").eq("supplier_id", sid).order("paid_at", { ascending: false }),
    ]);
    setOrders((po.data ?? []) as any); setInvoices((inv.data ?? []) as any); setPayments((pay.data ?? []) as any);
    // refresh supplier balance in list
    const { data: fresh } = await supabase.from("suppliers").select("*").eq("id", sid).maybeSingle();
    if (fresh) setDetail(fresh as any);
  };

  const openPayment = (invoiceId: string = "") => {
    setPayForm({ invoice_id: invoiceId, amount: "", method: "cash", reference: "", notes: "" });
    setPayOpen(true);
  };

  const savePayment = async () => {
    if (!detail) return;
    const amt = Number(payForm.amount);
    if (!Number.isFinite(amt) || amt <= 0) return toast.error(t("common.empty"));
    const { error } = await supabase.from("supplier_payments").insert({
      supplier_id: detail.id,
      invoice_id: payForm.invoice_id || null,
      amount: amt,
      method: payForm.method,
      reference: payForm.reference || null,
      notes: payForm.notes || null,
      user_id: user?.id ?? null,
    } as any);
    if (error) return toast.error(error.message);

    // decrement supplier balance (read fresh to reduce staleness)
    const { data: freshSup } = await supabase.from("suppliers").select("balance").eq("id", detail.id).maybeSingle();
    await supabase.from("suppliers").update({ balance: Number(freshSup?.balance ?? 0) - amt }).eq("id", detail.id);

    // decrement invoice balance if specified
    if (payForm.invoice_id) {
      const { data: freshInv } = await supabase.from("supplier_invoices").select("balance").eq("id", payForm.invoice_id).maybeSingle();
      if (freshInv) {
        const newBal = Math.max(0, Number(freshInv.balance ?? 0) - amt);
        await supabase.from("supplier_invoices").update({
          balance: newBal,
          status: newBal <= 0 ? "paid" : "partial",
        } as any).eq("id", payForm.invoice_id);
      }
    }

    toast.success(t("auth.success"));
    setPayOpen(false);
    await refreshDetail(detail.id);
    load();
  };

  const columns: Column<Supplier>[] = [
    { key: "name", header: t("common.name"), accessor: (r) => <span className="font-medium">{r.name}</span>, sortValue: (r) => r.name, exportValue: (r) => r.name },
    { key: "contact", header: t("common.contact") || "Contact", accessor: (r) => r.contact_person ?? "—", sortValue: (r) => r.contact_person ?? "", exportValue: (r) => r.contact_person ?? "" },
    { key: "phone", header: t("common.phone"), accessor: (r) => <span dir="ltr">{r.phone ?? "—"}</span>, sortValue: (r) => r.phone ?? "", exportValue: (r) => r.phone ?? "" },
    { key: "city", header: t("common.city"), accessor: (r) => r.city ?? "—", sortValue: (r) => r.city ?? "", exportValue: (r) => r.city ?? "" },
    { key: "status", header: t("common.status"), accessor: (r) => <Badge variant={r.status === "active" ? "default" : "outline"}>{r.status ?? "active"}</Badge>, sortValue: (r) => r.status ?? "", exportValue: (r) => r.status ?? "" },
    { key: "balance", header: t("common.balance"), accessor: (r) => <span className={Number(r.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(r.balance)}</span>, sortValue: (r) => Number(r.balance), exportValue: (r) => Number(r.balance) },
    {
      key: "actions", header: t("common.actions"), sortable: false, hideable: false, className: "text-end",
      accessor: (r) => (
        <div className="text-end" onClick={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        icon={Truck} title={t("suppliers.title")} subtitle={`${rows.length} ${t("common.total")}`} colorVar="primary"
        actions={<Button onClick={() => { setEditing(empty); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("suppliers.new")}</Button>}
      />

      <DataTable
        data={rows} columns={columns} isLoading={loading}
        rowKey={(r) => r.id} onRowClick={openDetail}
        exportName="suppliers" exportTitle="Suppliers"
        searchKeys={["name", "phone", "contact_person", "city"]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editing.id ? t("common.edit") : t("suppliers.new")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>{t("common.name")} *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.contact") || "Contact person"}</Label><Input value={editing.contact_person ?? ""} onChange={(e) => setEditing({ ...editing, contact_person: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.phone")}</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.email")}</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Tax number</Label><Input value={editing.tax_number ?? ""} onChange={(e) => setEditing({ ...editing, tax_number: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Country</Label><Input value={editing.country ?? ""} onChange={(e) => setEditing({ ...editing, country: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.city")}</Label><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>{t("common.address")}</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>{t("common.status")}</Label>
              <Select value={editing.status ?? "active"} onValueChange={(v) => setEditing({ ...editing, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{detail?.name}</span>
              <span className={Number(detail?.balance ?? 0) > 0 ? "text-destructive font-mono text-sm" : "font-mono text-sm"}>{fmtMoney(detail?.balance ?? 0)}</span>
            </DialogTitle>
          </DialogHeader>
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
                <div className="mb-2 flex justify-end">
                  <Button size="sm" onClick={() => openPayment("")}><Wallet className="me-1 h-4 w-4" /> {t("suppliers.recordPayment") || "Record payment"}</Button>
                </div>
                <Table><TableHeader><TableRow><TableHead>{t("sales.invoiceNo")}</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.total")}</TableHead><TableHead>{t("common.balance")}</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {invoices.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                    : invoices.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>{i.invoice_no ?? "—"}</TableCell>
                        <TableCell className="text-xs">{fmtDateTime(i.invoice_date)}</TableCell>
                        <TableCell className="font-mono">{fmtMoney(i.total)}</TableCell>
                        <TableCell className={Number(i.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(i.balance)}</TableCell>
                        <TableCell className="text-end">
                          {Number(i.balance) > 0 && <Button size="sm" variant="outline" onClick={() => openPayment(i.id)}>{t("suppliers.pay") || "Pay"}</Button>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody></Table>
              </TabsContent>
              <TabsContent value="payments">
                <Table><TableHeader><TableRow><TableHead>{t("common.date")}</TableHead><TableHead>{t("pos.method")}</TableHead><TableHead>Reference</TableHead><TableHead>{t("receipts.amount")}</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                    : payments.map((p) => <TableRow key={p.id}><TableCell className="text-xs">{fmtDateTime(p.paid_at)}</TableCell><TableCell>{t(`pos.method.${p.method}`) || p.method}</TableCell><TableCell className="text-xs text-muted-foreground">{p.reference ?? "—"}</TableCell><TableCell className="font-mono">{fmtMoney(p.amount)}</TableCell></TableRow>)}
                  </TableBody></Table>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("suppliers.recordPayment") || "Record payment"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {payForm.invoice_id && (
              <div className="text-sm text-muted-foreground">
                {t("sales.invoiceNo")}: <span className="font-mono">{invoices.find((i) => i.id === payForm.invoice_id)?.invoice_no ?? "—"}</span>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{t("receipts.amount")} *</Label>
              <Input type="number" step="any" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("pos.method")}</Label>
              <Select value={payForm.method} onValueChange={(v) => setPayForm({ ...payForm, method: v as PayMethod })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["cash", "card", "transfer", "check"] as const).map((m) => <SelectItem key={m} value={m}>{t(`pos.method.${m}`) || m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Reference</Label><Input value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.notes")}</Label><Textarea rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={savePayment}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
