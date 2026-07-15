import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr/employees")({ component: EmployeesPage });

function EmployeesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    full_name: "", code: "", phone: "", email: "", national_id: "",
    hire_date: new Date().toISOString().slice(0, 10),
    base_salary: 0, status: "active", department_id: null, position_id: null,
  });

  async function load() {
    const [{ data: e }, { data: d }, { data: p }] = await Promise.all([
      supabase.from("hr_employees").select("*, hr_departments(name), hr_positions(title)").order("created_at", { ascending: false }),
      supabase.from("hr_departments").select("*").order("name"),
      supabase.from("hr_positions").select("*").order("title"),
    ]);
    setRows(e ?? []); setDepts(d ?? []); setPositions(p ?? []);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEdit(null);
    setForm({ full_name: "", code: "", phone: "", email: "", national_id: "", hire_date: new Date().toISOString().slice(0, 10), base_salary: 0, status: "active", department_id: null, position_id: null });
    setOpen(true);
  }
  function openEdit(r: any) {
    setEdit(r);
    // strip joined relations that aren't columns on hr_employees
    const { hr_departments, hr_positions, ...clean } = r;
    setForm(clean);
    setOpen(true);
  }

  async function save() {
    if (!form.full_name) { toast.error(t("hr.emp.nameRequired")); return; }
    const { hr_departments, hr_positions, id, created_at, updated_at, ...rest } = form;
    const payload = { ...rest, base_salary: Number(form.base_salary || 0) };
    if (edit) {
      const { error } = await supabase.from("hr_employees").update(payload).eq("id", edit.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("hr_employees").insert(payload);
      if (error) { toast.error(error.message); return; }
    }
    setOpen(false); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("hr_employees").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.deleted")); load();
  }

  const filtered = rows.filter((r) => !q || (r.full_name + r.code + (r.phone ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Users className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("hr.employees")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{edit ? t("hr.emp.edit") : t("hr.emp.new")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>{t("hr.emp.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>{t("hr.emp.code")}</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>{t("hr.emp.phone")}</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>{t("hr.emp.email")}</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>{t("hr.emp.nationalId")}</Label><Input value={form.national_id ?? ""} onChange={(e) => setForm({ ...form, national_id: e.target.value })} /></div>
              <div><Label>{t("hr.emp.hireDate")}</Label><Input type="date" value={form.hire_date ?? ""} onChange={(e) => setForm({ ...form, hire_date: e.target.value })} /></div>
              <div><Label>{t("hr.emp.baseSalary")}</Label><Input type="number" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} /></div>
              <div>
                <Label>{t("hr.emp.status")}</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("hr.status.active")}</SelectItem>
                    <SelectItem value="suspended">{t("hr.status.suspended")}</SelectItem>
                    <SelectItem value="terminated">{t("hr.status.terminated")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("hr.emp.department")}</Label>
                <Select value={form.department_id ?? "none"} onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("hr.emp.position")}</Label>
                <Select value={form.position_id ?? "none"} onValueChange={(v) => setForm({ ...form, position_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {positions.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("hr.emp.code")}</TableHead>
              <TableHead>{t("hr.emp.fullName")}</TableHead>
              <TableHead>{t("hr.emp.department")}</TableHead>
              <TableHead>{t("hr.emp.position")}</TableHead>
              <TableHead>{t("hr.emp.phone")}</TableHead>
              <TableHead>{t("hr.emp.baseSalary")}</TableHead>
              <TableHead>{t("hr.emp.status")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.code}</TableCell>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.hr_departments?.name ?? "—"}</TableCell>
                <TableCell>{r.hr_positions?.title ?? "—"}</TableCell>
                <TableCell>{r.phone ?? "—"}</TableCell>
                <TableCell>{Number(r.base_salary).toLocaleString()}</TableCell>
                <TableCell>{t(`hr.status.${r.status}`)}</TableCell>
                <TableCell className="text-end">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
