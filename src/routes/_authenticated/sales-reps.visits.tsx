import { Card, Button, Input, Label, Textarea, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MapPin, Trash2, Crosshair } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sales-reps/visits")({ component: VisitsPage });

function VisitsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [reps, setReps] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ rep_id: "", customer_id: null, visit_type: "visit", outcome: "pending", notes: "", latitude: null, longitude: null, next_action_date: "" });

  async function load() {
    const [{ data: v }, { data: r }, { data: c }] = await Promise.all([
      supabase.from("sales_visits").select("*, sales_reps(full_name), customers(name)").order("visit_date", { ascending: false }).limit(200),
      supabase.from("sales_reps").select("id,full_name").eq("status", "active"),
      supabase.from("customers").select("id,name").order("name").limit(500),
    ]);
    setRows(v ?? []); setReps(r ?? []); setCustomers(c ?? []);
  }
  useEffect(() => { load(); }, []);

  function useGeo() {
    if (!navigator.geolocation) { toast.error("GPS?"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f: any) => ({ ...f, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
      (err) => toast.error(err.message)
    );
  }

  async function save() {
    if (!form.rep_id) { toast.error(t("reps.selectRep")); return; }
    const { error } = await supabase.from("sales_visits").insert({
      ...form,
      customer_id: form.customer_id || null,
      next_action_date: form.next_action_date || null,
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved"));
    setForm({ rep_id: "", customer_id: null, visit_type: "visit", outcome: "pending", notes: "", latitude: null, longitude: null, next_action_date: "" });
    load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("sales_visits").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><MapPin className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("reps.visits")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("reps.newVisit")}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t("reps.rep")}</Label>
                <Select value={form.rep_id} onValueChange={(v) => setForm({ ...form, rep_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{reps.map((r) => <SelectItem key={r.id} value={r.id}>{r.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("nav.customers")}</Label>
                <Select value={form.customer_id ?? "none"} onValueChange={(v) => setForm({ ...form, customer_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{t("reps.visitType")}</Label>
                  <Select value={form.visit_type} onValueChange={(v) => setForm({ ...form, visit_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="visit">{t("reps.vt.visit")}</SelectItem>
                      <SelectItem value="call">{t("reps.vt.call")}</SelectItem>
                      <SelectItem value="delivery">{t("reps.vt.delivery")}</SelectItem>
                      <SelectItem value="collection">{t("reps.vt.collection")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("reps.outcome")}</Label>
                  <Select value={form.outcome} onValueChange={(v) => setForm({ ...form, outcome: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">{t("reps.oc.pending")}</SelectItem>
                      <SelectItem value="success">{t("reps.oc.success")}</SelectItem>
                      <SelectItem value="failed">{t("reps.oc.failed")}</SelectItem>
                      <SelectItem value="followup">{t("reps.oc.followup")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 items-end">
                <div><Label>{t("reps.lat")}</Label><Input value={form.latitude ?? ""} onChange={(e) => setForm({ ...form, latitude: e.target.value })} /></div>
                <div><Label>{t("reps.lng")}</Label><Input value={form.longitude ?? ""} onChange={(e) => setForm({ ...form, longitude: e.target.value })} /></div>
                <Button variant="outline" onClick={useGeo}><Crosshair className="h-4 w-4 me-1" />GPS</Button>
              </div>
              <div><Label>{t("reps.nextAction")}</Label><Input type="date" value={form.next_action_date} onChange={(e) => setForm({ ...form, next_action_date: e.target.value })} /></div>
              <div><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("reps.rep")}</TableHead>
            <TableHead>{t("nav.customers")}</TableHead>
            <TableHead>{t("reps.visitType")}</TableHead>
            <TableHead>{t("reps.outcome")}</TableHead>
            <TableHead>{t("reps.nextAction")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{new Date(r.visit_date).toLocaleString()}</TableCell>
                <TableCell>{r.sales_reps?.full_name}</TableCell>
                <TableCell>{r.customers?.name ?? "—"}</TableCell>
                <TableCell>{t(`reps.vt.${r.visit_type}`)}</TableCell>
                <TableCell><Badge variant={r.outcome === "success" ? "default" : r.outcome === "failed" ? "destructive" : "secondary"}>{t(`reps.oc.${r.outcome}`)}</Badge></TableCell>
                <TableCell>{r.next_action_date ?? "—"}</TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
