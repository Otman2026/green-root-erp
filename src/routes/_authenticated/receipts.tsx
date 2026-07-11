import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime, printHtml } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/receipts")({ component: ReceiptsPage });

function ReceiptsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ direction: "in", party_type: "customer", party_id: "", amount: 0, method: "cash", reference: "", notes: "" });

  const load = async () => {
    const [r, c, s] = await Promise.all([
      supabase.from("receipts").select("*").order("received_at", { ascending: false }).limit(300),
      supabase.from("customers").select("id,name"),
      supabase.from("suppliers").select("id,name"),
    ]);
    setRows((r.data ?? []) as any); setCustomers((c.data ?? []) as any); setSuppliers((s.data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.party_id || !form.amount) return toast.error("Missing data");
    const { data, error } = await supabase.from("receipts").insert({ ...form, created_by: user?.id ?? null }).select().single();
    if (error) return toast.error(error.message);
    toast.success(data?.receipt_no ?? t("auth.success"));
    setOpen(false); setForm({ direction: "in", party_type: "customer", party_id: "", amount: 0, method: "cash", reference: "", notes: "" }); load();
  };

  const partyName = (r: any) => (r.party_type === "customer" ? customers : suppliers).find((x) => x.id === r.party_id)?.name ?? "—";

  const print = (r: any) => {
    printHtml(`<div class="head"><div><h2>Haytam AGRI</h2><div class="muted">${t(`receipts.${r.direction}`)}</div></div><div><b>${r.receipt_no}</b><div class="muted">${fmtDateTime(r.received_at)}</div></div></div>
      <table><tbody>
        <tr><th>${t("receipts.party")}</th><td>${partyName(r)}</td></tr>
        <tr><th>${t("receipts.amount")}</th><td class="r"><b>${fmtMoney(r.amount)}</b></td></tr>
        <tr><th>${t("receipts.method")}</th><td>${r.method}</td></tr>
        ${r.reference ? `<tr><th>Reference</th><td>${r.reference}</td></tr>` : ""}
        ${r.notes ? `<tr><th>${t("common.notes")}</th><td>${r.notes}</td></tr>` : ""}
      </tbody></table>`);
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Receipt className="h-6 w-6 text-primary" /> {t("receipts.title")}</h1>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("receipts.new")}</Button>
      </div>

      <Card><Table>
        <TableHeader><TableRow><TableHead>{t("receipts.no")}</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.type")}</TableHead><TableHead>{t("receipts.party")}</TableHead><TableHead>{t("receipts.method")}</TableHead><TableHead>{t("receipts.amount")}</TableHead><TableHead className="text-end"></TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
          : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-mono">{r.receipt_no}</TableCell>
              <TableCell className="text-xs">{fmtDateTime(r.received_at)}</TableCell>
              <TableCell><Badge variant={r.direction === "in" ? "default" : "secondary"}>{t(`receipts.${r.direction}`)}</Badge></TableCell>
              <TableCell>{partyName(r)}</TableCell>
              <TableCell>{r.method}</TableCell>
              <TableCell className={r.direction === "in" ? "font-mono text-primary" : "font-mono text-destructive"}>{fmtMoney(r.amount)}</TableCell>
              <TableCell className="text-end"><Button size="icon" variant="ghost" onClick={() => print(r)}><Printer className="h-4 w-4" /></Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("receipts.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("common.type")}</Label>
                <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="in">{t("receipts.in")}</SelectItem><SelectItem value="out">{t("receipts.out")}</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>{t("receipts.party")}</Label>
                <Select value={form.party_type} onValueChange={(v) => setForm({ ...form, party_type: v, party_id: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="customer">{t("common.customer")}</SelectItem><SelectItem value="supplier">{t("common.supplier")}</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>{form.party_type === "customer" ? t("common.customer") : t("common.supplier")}</Label>
              <Select value={form.party_id} onValueChange={(v) => setForm({ ...form, party_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{(form.party_type === "customer" ? customers : suppliers).map((x) => <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("receipts.amount")} *</Label><Input type="number" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("receipts.method")}</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(["cash","card","transfer","check"] as const).map((m) => <SelectItem key={m} value={m}>{t(`pos.method.${m}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5"><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
