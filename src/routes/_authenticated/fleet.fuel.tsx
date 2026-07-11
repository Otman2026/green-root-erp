import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Fuel } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/fleet/fuel")({ component: FuelPage });

function FuelPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { vehicle_id: "", date: new Date().toISOString().slice(0,10), liters: 0, price_per_liter: 0, total_cost: 0, odometer: null, station: "", notes: "" };
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const [{ data: f }, { data: v }] = await Promise.all([
      supabase.from("fleet_fuel_logs").select("*, fleet_vehicles(plate)").order("date", { ascending: false }).limit(200),
      supabase.from("fleet_vehicles").select("id,plate,name").eq("status","active"),
    ]);
    setRows(f ?? []); setVehicles(v ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.vehicle_id) { toast.error(t("common.fillAll")); return; }
    const liters = Number(form.liters || 0), ppl = Number(form.price_per_liter || 0);
    const total = Number(form.total_cost) > 0 ? Number(form.total_cost) : liters * ppl;
    const { error } = await supabase.from("fleet_fuel_logs").insert({ ...form, liters, price_per_liter: ppl, total_cost: total, odometer: form.odometer || null });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setForm(empty); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("fleet_fuel_logs").delete().eq("id", id);
    load();
  }

  const totalCost = rows.reduce((s, r) => s + Number(r.total_cost ?? 0), 0);
  const totalLiters = rows.reduce((s, r) => s + Number(r.liters ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Fuel className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.fuel")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("fleet.newFuel")}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t("fleet.vehicle")}</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("common.date")}</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>{t("fleet.station")}</Label><Input value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>{t("fleet.liters")}</Label><Input type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} /></div>
                <div><Label>{t("fleet.pricePerLiter")}</Label><Input type="number" step="0.01" value={form.price_per_liter} onChange={(e) => setForm({ ...form, price_per_liter: e.target.value })} /></div>
                <div><Label>{t("fleet.totalCost")}</Label><Input type="number" step="0.01" value={form.total_cost} onChange={(e) => setForm({ ...form, total_cost: e.target.value })} /></div>
              </div>
              <div><Label>{t("fleet.odometer")}</Label><Input type="number" value={form.odometer ?? ""} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t("fleet.totalCost")}</div><div className="mt-2 text-xl font-bold">{totalCost.toLocaleString()}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t("fleet.liters")}</div><div className="mt-2 text-xl font-bold">{totalLiters.toLocaleString()}</div></Card>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("fleet.vehicle")}</TableHead>
            <TableHead>{t("fleet.liters")}</TableHead>
            <TableHead>{t("fleet.pricePerLiter")}</TableHead>
            <TableHead>{t("fleet.totalCost")}</TableHead>
            <TableHead>{t("fleet.odometer")}</TableHead>
            <TableHead>{t("fleet.station")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell className="font-mono">{r.fleet_vehicles?.plate}</TableCell>
                <TableCell>{Number(r.liters)}</TableCell>
                <TableCell>{Number(r.price_per_liter)}</TableCell>
                <TableCell className="font-bold">{Number(r.total_cost).toLocaleString()}</TableCell>
                <TableCell>{r.odometer ?? "—"}</TableCell>
                <TableCell>{r.station ?? "—"}</TableCell>
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
