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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Route as RouteIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/fleet/trips")({ component: TripsPage });

function TripsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const empty = { vehicle_id: "", driver_id: null, trip_date: new Date().toISOString().slice(0,10), from_location: "", to_location: "", start_odometer: null, end_odometer: null, distance: 0, cost: 0, purpose: "", status: "completed", notes: "" };
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const [{ data: t }, { data: v }, { data: d }] = await Promise.all([
      supabase.from("fleet_trips").select("*, fleet_vehicles(plate,name), fleet_drivers(full_name)").order("trip_date", { ascending: false }).limit(200),
      supabase.from("fleet_vehicles").select("id,plate,name,odometer").eq("status","active"),
      supabase.from("fleet_drivers").select("id,full_name").eq("status","active"),
    ]);
    setRows(t ?? []); setVehicles(v ?? []); setDrivers(d ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.vehicle_id) { toast.error(t("common.fillAll")); return; }
    const so = Number(form.start_odometer || 0), eo = Number(form.end_odometer || 0);
    const distance = eo > so ? eo - so : Number(form.distance || 0);
    const payload = { ...form, distance, cost: Number(form.cost || 0), start_odometer: form.start_odometer || null, end_odometer: form.end_odometer || null, driver_id: form.driver_id || null };
    const { error } = await supabase.from("fleet_trips").insert(payload);
    if (error) { toast.error(error.message); return; }
    if (eo > 0) await supabase.from("fleet_vehicles").update({ odometer: eo }).eq("id", form.vehicle_id);
    setOpen(false); setForm(empty); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("fleet_trips").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><RouteIcon className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.trips")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t("fleet.newTrip")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label>{t("fleet.vehicle")}</Label>
                <Select value={form.vehicle_id} onValueChange={(v) => { const veh = vehicles.find(x => x.id === v); setForm({ ...form, vehicle_id: v, start_odometer: veh?.odometer ?? null }); }}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate} {v.name ?? ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("fleet.driver")}</Label>
                <Select value={form.driver_id ?? "none"} onValueChange={(v) => setForm({ ...form, driver_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("common.date")}</Label><Input type="date" value={form.trip_date} onChange={(e) => setForm({ ...form, trip_date: e.target.value })} /></div>
              <div><Label>{t("fleet.purpose")}</Label><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></div>
              <div><Label>{t("fleet.from")}</Label><Input value={form.from_location} onChange={(e) => setForm({ ...form, from_location: e.target.value })} /></div>
              <div><Label>{t("fleet.to")}</Label><Input value={form.to_location} onChange={(e) => setForm({ ...form, to_location: e.target.value })} /></div>
              <div><Label>{t("fleet.startKm")}</Label><Input type="number" value={form.start_odometer ?? ""} onChange={(e) => setForm({ ...form, start_odometer: e.target.value })} /></div>
              <div><Label>{t("fleet.endKm")}</Label><Input type="number" value={form.end_odometer ?? ""} onChange={(e) => setForm({ ...form, end_odometer: e.target.value })} /></div>
              <div><Label>{t("fleet.distance")} (km)</Label><Input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} /></div>
              <div><Label>{t("fleet.cost")}</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>{t("common.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("fleet.vehicle")}</TableHead>
            <TableHead>{t("fleet.driver")}</TableHead>
            <TableHead>{t("fleet.from")}</TableHead>
            <TableHead>{t("fleet.to")}</TableHead>
            <TableHead>{t("fleet.distance")}</TableHead>
            <TableHead>{t("fleet.cost")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.trip_date}</TableCell>
                <TableCell className="font-mono">{r.fleet_vehicles?.plate}</TableCell>
                <TableCell>{r.fleet_drivers?.full_name ?? "—"}</TableCell>
                <TableCell>{r.from_location ?? "—"}</TableCell>
                <TableCell>{r.to_location ?? "—"}</TableCell>
                <TableCell>{Number(r.distance)} km</TableCell>
                <TableCell>{Number(r.cost).toLocaleString()}</TableCell>
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
