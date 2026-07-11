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
import { Plus, Pencil, Trash2, UserCog } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sales-reps/list")({ component: RepsPage });

function RepsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ full_name: "", code: "", phone: "", email: "", commission_rate: 0, monthly_target: 0, status: "active" });

  async function load() {
    const { data } = await (supabase as any).from("sales_reps").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEdit(null); setForm({ full_name: "", code: "", phone: "", email: "", commission_rate: 0, monthly_target: 0, status: "active" }); setOpen(true); }
  function openEdit(r: any) { setEdit(r); setForm({ ...r }); setOpen(true); }

  async function save() {
    if (!form.full_name) { toast.error(t("reps.nameRequired")); return; }
    const payload = { ...form, commission_rate: Number(form.commission_rate || 0), monthly_target: Number(form.monthly_target || 0) };
    const q = edit
      ? (supabase as any).from("sales_reps").update(payload).eq("id", edit.id)
      : (supabase as any).from("sales_reps").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await (supabase as any).from("sales_reps").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.deleted")); load();
  }

  const filtered = rows.filter((r) => !q || (r.full_name + (r.code ?? "") + (r.phone ?? "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><UserCog className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("reps.list")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit ? t("reps.edit") : t("reps.new")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>{t("reps.fullName")}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div><Label>{t("reps.code")}</Label><Input value={form.code ?? ""} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
              <div><Label>{t("reps.phone")}</Label><Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>{t("reps.email")}</Label><Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>{t("reps.commissionRate")} (%)</Label><Input type="number" step="0.01" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} /></div>
              <div><Label>{t("reps.monthlyTarget")}</Label><Input type="number" value={form.monthly_target} onChange={(e) => setForm({ ...form, monthly_target: e.target.value })} /></div>
              <div>
                <Label>{t("reps.status")}</Label>
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

      <Input placeholder={t("common.search")} value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("reps.code")}</TableHead>
            <TableHead>{t("reps.fullName")}</TableHead>
            <TableHead>{t("reps.phone")}</TableHead>
            <TableHead>{t("reps.commissionRate")}</TableHead>
            <TableHead>{t("reps.monthlyTarget")}</TableHead>
            <TableHead>{t("reps.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.code ?? "—"}</TableCell>
                <TableCell className="font-medium">{r.full_name}</TableCell>
                <TableCell>{r.phone ?? "—"}</TableCell>
                <TableCell>{Number(r.commission_rate)}%</TableCell>
                <TableCell>{Number(r.monthly_target).toLocaleString()}</TableCell>
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
