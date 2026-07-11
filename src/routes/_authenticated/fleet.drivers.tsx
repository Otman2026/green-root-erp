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
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/fleet/drivers")({ component: DriversPage });

function DriversPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const empty = { full_name: "", phone: "", license_no: "", license_expiry: "", status: "active", employee_id: null };
  const [form, setForm] = useState<any>(empty);

  async function load() {
    const [{ data: d }, { data: e }] = await Promise.all([
      supabase.from("fleet_drivers").select("*, hr_employees(full_name)").order("created_at", { ascending: false }),
      supabase.from("hr_employees").select("id,full_name").order("full_name"),
    ]);
    setRows(d ?? []); setEmployees(e ?? []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEdit(null); setForm(empty); setOpen(true); }
  function openEdit(r: any) { setEdit(r); setForm({ ...r }); setOpen(true); }

  async function save() {
    if (!form.full_name) { toast.error(t("common.fillAll")); return; }
    const payload = { ...form, license_expiry: form.license_expiry || null };
    const q = edit
      ? supabase.from("fleet_drivers").update(payload).eq("id", edit.id)
      : supabase.from("fleet_drivers").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("fleet_drivers").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Users className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("fleet.drivers")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit ? t("fleet.editDriver") : t("fleet.newDriver")}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>{t("hr.emp.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>{t("hr.emp.phone")}</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("fleet.licenseNo")}</Label><Input value={form.license_no ?? ""} onChange={(e) => setForm({ ...form, license_no: e.target.value })} /></div>
                <div><Label>{t("fleet.licenseExpiry")}</Label><Input type="date" value={form.license_expiry ?? ""} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} /></div>
              </div>
              <div>
                <Label>{t("fleet.linkedEmployee")}</Label>
                <Select value={form.employee_id ?? "none"} onValueChange={(v) => setForm({ ...form, employee_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("fleet.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("hr.status.active")}</SelectItem>
                    <SelectItem value="inactive">{t("hr.status.suspended")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("hr.emp.fullName")}</TableHead>
            <TableHead>{t("hr.emp.phone")}</TableHead>
            <TableHead>{t("fleet.licenseNo")}</TableHead>
            <TableHead>{t("fleet.licenseExpiry")}</TableHead>
            <TableHead>{t("fleet.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.phone ?? "—"}</TableCell>
                <TableCell>{r.license_no ?? "—"}</TableCell>
                <TableCell>{r.license_expiry ?? "—"}</TableCell>
                <TableCell>{r.status}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
