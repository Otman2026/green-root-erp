import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/fleet/vehicles")({ component: VehiclesPage });

function VehiclesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const empty = { plate: "", name: "", vtype: "car", make: "", model: "", year: null, color: "", vin: "", status: "active", odometer: 0, fuel_type: "diesel", gps_device_id: "", insurance_expiry: "", license_expiry: "" };
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const { data } = await supabase.from("fleet_vehicles").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEdit(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEdit(r); setForm({ ...r }); setOpen(true); }

  async function save() {
    if (!form.plate) { toast.error(t("fleet.plateRequired")); return; }
    const payload = { ...form, year: form.year ? Number(form.year) : null, odometer: Number(form.odometer || 0), insurance_expiry: form.insurance_expiry || null, license_expiry: form.license_expiry || null };
    const q = edit
      ? supabase.from("fleet_vehicles").update(payload).eq("id", edit.id)
      : supabase.from("fleet_vehicles").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("fleet_vehicles").delete().eq("id", id);
    load();
  }

  const filtered = rows.filter((r) => !q || (r.plate + (r.name ?? "") + (r.make ?? "") + (r.model ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Truck className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.vehicles")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{edit ? t("fleet.editVehicle") : t("fleet.newVehicle")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>{t("fleet.plate")}</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
              <div><Label>{t("fleet.name")}</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div>
                <Label>{t("fleet.type")}</Label>
                <Select value={form.vtype} onValueChange={(v) => setForm({ ...form, vtype: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">{t("fleet.vt.car")}</SelectItem>
                    <SelectItem value="van">{t("fleet.vt.van")}</SelectItem>
                    <SelectItem value="truck">{t("fleet.vt.truck")}</SelectItem>
                    <SelectItem value="motorcycle">{t("fleet.vt.motorcycle")}</SelectItem>
                    <SelectItem value="tractor">{t("fleet.vt.tractor")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("fleet.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("hr.status.active")}</SelectItem>
                    <SelectItem value="maintenance">{t("fleet.st.maintenance")}</SelectItem>
                    <SelectItem value="inactive">{t("hr.status.suspended")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("fleet.make")}</Label><Input value={form.make ?? ""} onChange={(e) => setForm({ ...form, make: e.target.value })} /></div>
              <div><Label>{t("fleet.model")}</Label><Input value={form.model ?? ""} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
              <div><Label>{t("fleet.year")}</Label><Input type="number" value={form.year ?? ""} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
              <div><Label>{t("fleet.color")}</Label><Input value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
              <div><Label>{t("fleet.odometer")}</Label><Input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
              <div><Label>{t("fleet.fuelType")}</Label><Input value={form.fuel_type ?? ""} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} /></div>
              <div><Label>{t("fleet.gpsDevice")}</Label><Input value={form.gps_device_id ?? ""} onChange={(e) => setForm({ ...form, gps_device_id: e.target.value })} /></div>
              <div><Label>{t("fleet.vin")}</Label><Input value={form.vin ?? ""} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></div>
              <div><Label>{t("fleet.insuranceExpiry")}</Label><Input type="date" value={form.insurance_expiry ?? ""} onChange={(e) => setForm({ ...form, insurance_expiry: e.target.value })} /></div>
              <div><Label>{t("fleet.licenseExpiry")}</Label><Input type="date" value={form.license_expiry ?? ""} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>
      <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("fleet.plate")}</TableHead>
            <TableHead>{t("fleet.name")}</TableHead>
            <TableHead>{t("fleet.type")}</TableHead>
            <TableHead>{t("fleet.make")}/{t("fleet.model")}</TableHead>
            <TableHead>{t("fleet.odometer")}</TableHead>
            <TableHead>{t("fleet.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-medium">{r.plate}</TableCell>
                <TableCell>{r.name ?? "—"}</TableCell>
                <TableCell>{t(`fleet.vt.${r.vtype}`)}</TableCell>
                <TableCell>{[r.make, r.model].filter(Boolean).join(" ")}</TableCell>
                <TableCell>{Number(r.odometer).toLocaleString()} km</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
