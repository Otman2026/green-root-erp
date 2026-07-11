import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Wrench, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/fleet/maintenance")({ component: MaintenancePage });

function MaintenancePage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { vehicle_id: "", date: new Date().toISOString().slice(0,10), mtype: "routine", description: "", cost: 0, odometer: null, next_service_date: "", next_service_odometer: null, vendor: "", status: "done", notes: "" };
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const [{ data: m }, { data: v }] = await Promise.all([
      (supabase as any).from("fleet_maintenance").select("*, fleet_vehicles(plate)").order("date", { ascending: false }).limit(200),
      (supabase as any).from("fleet_vehicles").select("id,plate,name").eq("status","active"),
    ]);
    setRows(m ?? []); setVehicles(v ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.vehicle_id) { toast.error(t("common.fillAll")); return; }
    const payload = { ...form, cost: Number(form.cost || 0), odometer: form.odometer || null, next_service_odometer: form.next_service_odometer || null, next_service_date: form.next_service_date || null };
    const { error } = await (supabase as any).from("fleet_maintenance").insert(payload);
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm(empty); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await (supabase as any).from("fleet_maintenance").delete().eq("id", id);
    load();
  }

  const today = new Date().toISOString().slice(0, 10);
  const dueSoon = rows.filter((r) => r.next_service_date && r.next_service_date <= new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10) && r.next_service_date >= today);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Wrench className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.maintenance")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t("fleet.newMaintenance")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{t("fleet.vehicle")}</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t("common.date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
              <div>
                <Label>{t("fleet.mtype")}</Label>
                <Select value={form.mtype} onValueChange={(v) => setForm({ ...form, mtype: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="routine">{t("fleet.mt.routine")}</SelectItem>
                    <SelectItem value="repair">{t("fleet.mt.repair")}</SelectItem>
                    <SelectItem value="tire">{t("fleet.mt.tire")}</SelectItem>
                    <SelectItem value="oil">{t("fleet.mt.oil")}</SelectItem>
                    <SelectItem value="inspection">{t("fleet.mt.inspection")}</SelectItem>
                    <SelectItem value="other">{t("fleet.mt.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("fleet.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">{t("fleet.mst.scheduled")}</SelectItem>
                    <SelectItem value="in_progress">{t("fleet.mst.in_progress")}</SelectItem>
                    <SelectItem value="done">{t("fleet.mst.done")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>{t("fleet.description")}</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>{t("fleet.cost")}</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div><Label>{t("fleet.vendor")}</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              <div><Label>{t("fleet.odometer")}</Label><Input type="number" value={form.odometer ?? ""} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
              <div><Label>{t("fleet.nextServiceDate")}</Label><Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} /></div>
              <div><Label>{t("fleet.nextServiceKm")}</Label><Input type="number" value={form.next_service_odometer ?? ""} onChange={(e) => setForm({ ...form, next_service_odometer: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      {dueSoon.length > 0 && (
        <Card className="p-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-2 font-medium text-amber-600"><AlertTriangle className="h-4 w-4" />{t("fleet.upcomingService")}</div>
          <ul className="mt-2 text-sm space-y-1">
            {dueSoon.map((r) => <li key={r.id}>{r.fleet_vehicles?.plate} — {r.next_service_date}</li>)}
          </ul>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("fleet.vehicle")}</TableHead>
            <TableHead>{t("fleet.mtype")}</TableHead>
            <TableHead>{t("fleet.description")}</TableHead>
            <TableHead>{t("fleet.cost")}</TableHead>
            <TableHead>{t("fleet.nextServiceDate")}</TableHead>
            <TableHead>{t("fleet.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-mono">{r.fleet_vehicles?.plate}</TableCell>
                <TableCell>{t(`fleet.mt.${r.mtype}`)}</TableCell>
                <TableCell>{r.description ?? "—"}</TableCell>
                <TableCell>{Number(r.cost).toLocaleString()}</TableCell>
                <TableCell>{r.next_service_date ?? "—"}</TableCell>
                <TableCell><Badge variant={r.status === "done" ? "default" : "secondary"}>{t(`fleet.mst.${r.status}`)}</Badge></TableCell>
                <TableCell className="text-end"><Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
