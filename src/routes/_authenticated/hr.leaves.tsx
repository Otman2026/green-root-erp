import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, CalendarX, Check, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr/leaves")({ component: LeavesPage });

function LeavesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ employee_id: "", leave_type: "annual", from_date: "", to_date: "", reason: "" });

  async function load() {
    const [{ data: l }, { data: e }] = await Promise.all([
      supabase.from("hr_leaves").select("*, hr_employees(full_name)").order("created_at", { ascending: false }),
      supabase.from("hr_employees").select("id,full_name").eq("status", "active").order("full_name"),
    ]);
    setRows(l ?? []); setEmployees(e ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.employee_id || !form.from_date || !form.to_date) { toast.error(t("common.fillAll")); return; }
    const days = Math.max(1, Math.round((new Date(form.to_date).getTime() - new Date(form.from_date).getTime()) / 86400000) + 1);
    const { error } = await supabase.from("hr_leaves").insert({ ...form, days, status: "pending" });
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved")); load();
  }

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("hr_leaves").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><CalendarX className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("hr.leaves")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("hr.lv.new")}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t("hr.emp.fullName")}</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t("hr.lv.type")}</Label>
                <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">{t("hr.lv.annual")}</SelectItem>
                    <SelectItem value="sick">{t("hr.lv.sick")}</SelectItem>
                    <SelectItem value="unpaid">{t("hr.lv.unpaid")}</SelectItem>
                    <SelectItem value="other">{t("hr.lv.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>{t("hr.lv.from")}</Label><Input type="date" value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} /></div>
                <div><Label>{t("hr.lv.to")}</Label><Input type="date" value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} /></div>
              </div>
              <div><Label>{t("hr.lv.reason")}</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("hr.emp.fullName")}</TableHead>
              <TableHead>{t("hr.lv.type")}</TableHead>
              <TableHead>{t("hr.lv.from")}</TableHead>
              <TableHead>{t("hr.lv.to")}</TableHead>
              <TableHead>{t("hr.lv.days")}</TableHead>
              <TableHead>{t("hr.lv.status")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                <TableCell>{t(`hr.lv.${r.leave_type}`)}</TableCell>
                <TableCell>{r.from_date}</TableCell>
                <TableCell>{r.to_date}</TableCell>
                <TableCell>{r.days}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>
                    {t(`hr.lv.st.${r.status}`)}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  {r.status === "pending" && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "approved")}><Check className="h-4 w-4 text-emerald-500" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setStatus(r.id, "rejected")}><X className="h-4 w-4 text-rose-500" /></Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
