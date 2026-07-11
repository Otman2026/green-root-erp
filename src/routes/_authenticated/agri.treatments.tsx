import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/agri/treatments")({ component: TreatmentsPage });

type Target = "disease"|"pest"|"deficiency";
type Method = "chemical"|"biological"|"cultural"|"mechanical"|"organic";
interface Treatment {
  id: string; target_type: Target; target_id: string | null;
  method: Method; title: string; description: string | null;
  active_ingredient: string | null; dosage: string | null;
  frequency: string | null; safety_period: string | null; notes: string | null;
}
const empty: Partial<Treatment> = { title: "", target_type: "disease", method: "chemical" };

function TreatmentsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Treatment[]>([]);
  const [q, setQ] = useState("");
  const [tgt, setTgt] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Treatment>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_treatments").select("*").order("title");
    if (error) toast.error(error.message); else setRows((data ?? []) as Treatment[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    const okQ = !s || r.title.toLowerCase().includes(s) || (r.active_ingredient ?? "").toLowerCase().includes(s);
    return okQ && (tgt === "all" || r.target_type === tgt);
  }), [rows, q, tgt]);

  const save = async () => {
    if (!editing.title?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      target_type: editing.target_type ?? "disease",
      target_id: editing.target_id || null,
      method: editing.method ?? "chemical",
      title: editing.title, description: editing.description || null,
      active_ingredient: editing.active_ingredient || null,
      dosage: editing.dosage || null, frequency: editing.frequency || null,
      safety_period: editing.safety_period || null, notes: editing.notes || null,
    };
    const { error } = editing.id
      ? await supabase.from("agri_treatments").update(payload).eq("id", editing.id)
      : await supabase.from("agri_treatments").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("OK"); setOpen(false); setEditing(empty); load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("agri_treatments").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const targets = ["all","disease","pest","deficiency"];
  const methods: Method[] = ["chemical","biological","cultural","mechanical","organic"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.treatments")}</h1>
        <div className="ms-auto">
          <Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />{t("common.add")}</Button>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={tgt} onValueChange={setTgt}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{targets.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>Target</TableHead><TableHead>{t("agri.method")}</TableHead>
            <TableHead>{t("agri.activeIngredient")}</TableHead>
            <TableHead>{t("agri.dosage")}</TableHead>
            <TableHead>{t("agri.safetyPeriod")}</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.title}</TableCell>
                <TableCell><Badge variant="outline">{r.target_type}</Badge></TableCell>
                <TableCell><Badge>{r.method}</Badge></TableCell>
                <TableCell>{r.active_ingredient}</TableCell>
                <TableCell>{r.dosage}</TableCell>
                <TableCell>{r.safety_period}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("agri.treatments")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>{t("common.name")}</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
            <div><Label>Target</Label>
              <Select value={editing.target_type ?? "disease"} onValueChange={(v) => setEditing({ ...editing, target_type: v as Target })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{targets.filter(x => x !== "all").map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("agri.method")}</Label>
              <Select value={editing.method ?? "chemical"} onValueChange={(v) => setEditing({ ...editing, method: v as Method })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{methods.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("agri.activeIngredient")}</Label><Input value={editing.active_ingredient ?? ""} onChange={(e) => setEditing({ ...editing, active_ingredient: e.target.value })} /></div>
            <div><Label>{t("agri.dosage")}</Label><Input value={editing.dosage ?? ""} onChange={(e) => setEditing({ ...editing, dosage: e.target.value })} /></div>
            <div><Label>{t("agri.frequency")}</Label><Input value={editing.frequency ?? ""} onChange={(e) => setEditing({ ...editing, frequency: e.target.value })} /></div>
            <div><Label>{t("agri.safetyPeriod")}</Label><Input value={editing.safety_period ?? ""} onChange={(e) => setEditing({ ...editing, safety_period: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
