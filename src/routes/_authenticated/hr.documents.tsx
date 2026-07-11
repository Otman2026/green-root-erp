import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, FileText, Trash2, ExternalLink } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr/documents")({ component: DocumentsPage });

function DocumentsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ employee_id: "", title: "", doc_type: "", file_url: "", expiry_date: "", notes: "" });

  async function load() {
    const [{ data: d }, { data: e }] = await Promise.all([
      supabase.from("hr_documents").select("*, hr_employees(full_name)").order("created_at", { ascending: false }),
      supabase.from("hr_employees").select("id,full_name").order("full_name"),
    ]);
    setRows(d ?? []); setEmployees(e ?? []);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    if (!form.employee_id || !form.title) { toast.error(t("common.fillAll")); return; }
    const { error } = await supabase.from("hr_documents").insert({ ...form, expiry_date: form.expiry_date || null });
    if (error) { toast.error(error.message); return; }
    setOpen(false); toast.success(t("common.saved")); load();
  }
  async function del(id: string) {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("hr_documents").delete().eq("id", id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><FileText className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("hr.documents")}</h1></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-1" />{t("common.add")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("hr.doc.new")}</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>{t("hr.emp.fullName")}</Label>
                <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>{t("hr.doc.title")}</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>{t("hr.doc.type")}</Label><Input value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })} /></div>
              <div><Label>{t("hr.doc.url")}</Label><Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." /></div>
              <div><Label>{t("hr.doc.expiry")}</Label><Input type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} /></div>
              <div><Label>{t("hr.doc.notes")}</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
              <TableHead>{t("hr.doc.title")}</TableHead>
              <TableHead>{t("hr.doc.type")}</TableHead>
              <TableHead>{t("hr.doc.expiry")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell>{r.doc_type ?? "—"}</TableCell>
                <TableCell>{r.expiry_date ?? "—"}</TableCell>
                <TableCell className="text-end">
                  {r.file_url && <Button size="icon" variant="ghost" asChild><a href={r.file_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
                  <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">{t("common.noData")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
