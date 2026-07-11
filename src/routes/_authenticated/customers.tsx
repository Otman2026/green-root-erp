import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, toCSV, downloadFile } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/customers")({ component: CustomersPage });

type CType = "retail" | "wholesale" | "semi_wholesale" | "vip";
interface Customer {
  id: string; name: string; phone: string | null; email: string | null;
  city: string | null; address: string | null; activity_type: string | null;
  crops: string[] | null; farm_area: number | null; customer_type: CType;
  loyalty_points: number; credit_limit: number; balance: number;
  notes: string | null; is_active: boolean; created_at: string;
}
const empty: Partial<Customer> = { name: "", customer_type: "retail", credit_limit: 0 };

function CustomersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Customer>>(empty);
  const [detail, setDetail] = useState<Customer | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const load = async () => {
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setRows((data ?? []) as Customer[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.name.toLowerCase().includes(s) || (r.phone ?? "").includes(s) || (r.email ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.name?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      name: editing.name, phone: editing.phone || null, email: editing.email || null,
      city: editing.city || null, address: editing.address || null,
      activity_type: editing.activity_type || null,
      crops: editing.crops && (editing.crops as any).length ? editing.crops : null,
      farm_area: editing.farm_area ?? null,
      customer_type: editing.customer_type ?? "retail",
      credit_limit: editing.credit_limit ?? 0, notes: editing.notes || null,
    };
    const res = editing.id
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("auth.success")); setOpen(false); setEditing(empty); load();
  };

  const del = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const openDetail = async (c: Customer) => {
    setDetail(c);
    const [inv, pay] = await Promise.all([
      supabase.from("sales").select("*").eq("customer_id", c.id).order("created_at", { ascending: false }),
      supabase.from("receipts").select("*").eq("party_type", "customer").eq("party_id", c.id).order("received_at", { ascending: false }),
    ]);
    setInvoices((inv.data ?? []) as any[]);
    setPayments((pay.data ?? []) as any[]);
  };

  const exportCsv = () => {
    const data = filtered.map((r) => ({ name: r.name, phone: r.phone, email: r.email, city: r.city, type: r.customer_type, balance: r.balance, loyalty: r.loyalty_points }));
    downloadFile(`customers-${new Date().toISOString().slice(0,10)}.csv`, toCSV(data));
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><Users className="h-6 w-6 text-primary" /> {t("customers.title")}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} {t("common.total")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> {t("common.export")}</Button>
          <Button onClick={() => { setEditing(empty); setOpen(true); }} className="gap-2"><Plus className="h-4 w-4" /> {t("customers.new")}</Button>
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
            <TableHead>{t("common.phone")}</TableHead>
            <TableHead>{t("common.type")}</TableHead>
            <TableHead>{t("customers.balance")}</TableHead>
            <TableHead>{t("customers.loyaltyPoints")}</TableHead>
            <TableHead className="text-end">{t("common.actions")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={() => openDetail(r)}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell dir="ltr">{r.phone ?? "—"}</TableCell>
                <TableCell><Badge variant="secondary">{t(`customers.type.${r.customer_type}`)}</Badge></TableCell>
                <TableCell className={Number(r.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(r.balance)}</TableCell>
                <TableCell className="font-mono">{Number(r.loyalty_points).toFixed(0)}</TableCell>
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
          <DialogHeader><DialogTitle>{editing.id ? t("common.edit") : t("customers.new")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>{t("common.name")} *</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.phone")}</Label><Input value={editing.phone ?? ""} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.email")}</Label><Input type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.city")}</Label><Input value={editing.city ?? ""} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>{t("common.type")}</Label>
              <Select value={editing.customer_type ?? "retail"} onValueChange={(v) => setEditing({ ...editing, customer_type: v as CType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["retail","wholesale","semi_wholesale","vip"] as const).map((v) => <SelectItem key={v} value={v}>{t(`customers.type.${v}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5"><Label>{t("common.address")}</Label><Input value={editing.address ?? ""} onChange={(e) => setEditing({ ...editing, address: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("customers.activityType")}</Label><Input value={editing.activity_type ?? ""} onChange={(e) => setEditing({ ...editing, activity_type: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("customers.farmArea")} (Ha)</Label><Input type="number" step="any" value={editing.farm_area ?? ""} onChange={(e) => setEditing({ ...editing, farm_area: e.target.value ? Number(e.target.value) : null })} /></div>
            <div className="col-span-2 space-y-1.5"><Label>{t("customers.crops")}</Label>
              <Input placeholder="tomato, wheat, olive" value={(editing.crops ?? []).join(", ")} onChange={(e) => setEditing({ ...editing, crops: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-1.5"><Label>{t("customers.creditLimit")}</Label><Input type="number" step="any" value={editing.credit_limit ?? 0} onChange={(e) => setEditing({ ...editing, credit_limit: Number(e.target.value) })} /></div>
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
            <Tabs defaultValue="invoices">
              <TabsList>
                <TabsTrigger value="invoices">{t("customers.tabs.invoices")}</TabsTrigger>
                <TabsTrigger value="payments">{t("customers.tabs.payments")}</TabsTrigger>
                <TabsTrigger value="info">{t("common.details")}</TabsTrigger>
              </TabsList>
              <TabsContent value="invoices">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{t("sales.invoiceNo")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("common.total")}</TableHead>
                      <TableHead>{t("common.balance")}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                      : invoices.map((i) => (
                        <TableRow key={i.id}>
                          <TableCell className="font-mono">{i.invoice_no}</TableCell>
                          <TableCell className="text-xs">{fmtDateTime(i.created_at)}</TableCell>
                          <TableCell><Badge variant="secondary">{t(`sales.type.${i.type}`)}</Badge></TableCell>
                          <TableCell className="font-mono">{fmtMoney(i.total)}</TableCell>
                          <TableCell className={Number(i.balance) > 0 ? "text-destructive font-mono" : "font-mono"}>{fmtMoney(i.balance)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="payments">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>{t("receipts.no")}</TableHead>
                      <TableHead>{t("common.date")}</TableHead>
                      <TableHead>{t("common.type")}</TableHead>
                      <TableHead>{t("receipts.amount")}</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {payments.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
                      : payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">{p.receipt_no}</TableCell>
                          <TableCell className="text-xs">{fmtDateTime(p.received_at)}</TableCell>
                          <TableCell><Badge>{t(`receipts.${p.direction}`)}</Badge></TableCell>
                          <TableCell className="font-mono">{fmtMoney(p.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              <TabsContent value="info">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">{t("common.phone")}:</span> <span dir="ltr">{detail.phone ?? "—"}</span></div>
                  <div><span className="text-muted-foreground">{t("common.email")}:</span> {detail.email ?? "—"}</div>
                  <div><span className="text-muted-foreground">{t("common.city")}:</span> {detail.city ?? "—"}</div>
                  <div><span className="text-muted-foreground">{t("common.type")}:</span> {t(`customers.type.${detail.customer_type}`)}</div>
                  <div><span className="text-muted-foreground">{t("customers.balance")}:</span> <b>{fmtMoney(detail.balance)}</b></div>
                  <div><span className="text-muted-foreground">{t("customers.creditLimit")}:</span> {fmtMoney(detail.credit_limit)}</div>
                  <div><span className="text-muted-foreground">{t("customers.loyaltyPoints")}:</span> {Number(detail.loyalty_points).toFixed(0)}</div>
                  <div><span className="text-muted-foreground">{t("customers.farmArea")}:</span> {detail.farm_area ?? "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">{t("customers.crops")}:</span> {(detail.crops ?? []).join(", ") || "—"}</div>
                  <div className="col-span-2"><span className="text-muted-foreground">{t("common.notes")}:</span> {detail.notes ?? "—"}</div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
