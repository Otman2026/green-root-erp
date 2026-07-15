import { Button, Input, Card, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri/pesticides")({ component: Page });

interface Row {
  id: string; name_ar: string; name_fr: string | null; name_en: string | null;
  trade_name: string | null; active_ingredient: string; concentration: string | null;
  formulation: string | null; manufacturer: string | null; category: string | null;
  mode_of_action: string | null; toxicity_class: string | null;
  target_pests: string | null; target_diseases: string | null; target_weeds: string | null;
  dosage: string | null; application_method: string | null;
  pre_harvest_interval_days: number | null; re_entry_interval_hours: number | null;
  suitable_crops: string | null; alternatives: string | null; cautions: string | null;
  is_active: boolean;
}
const empty: Partial<Row> = { name_ar: "", active_ingredient: "", is_active: true };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_pesticides").select("*").order("name_ar");
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    if (!s) return true;
    return r.name_ar.toLowerCase().includes(s)
      || (r.name_fr ?? "").toLowerCase().includes(s)
      || (r.active_ingredient ?? "").toLowerCase().includes(s)
      || (r.category ?? "").toLowerCase().includes(s)
      || (r.target_pests ?? "").toLowerCase().includes(s)
      || (r.target_diseases ?? "").toLowerCase().includes(s)
      || (r.suitable_crops ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.name_ar?.trim() || !editing.active_ingredient?.trim()) return toast.error("الاسم والمادة الفعالة إلزاميان");
    const payload: any = {
      name_ar: editing.name_ar, name_fr: editing.name_fr || null, name_en: editing.name_en || null,
      trade_name: editing.trade_name || null, active_ingredient: editing.active_ingredient,
      concentration: editing.concentration || null, formulation: editing.formulation || null,
      manufacturer: editing.manufacturer || null, category: editing.category || null,
      mode_of_action: editing.mode_of_action || null, toxicity_class: editing.toxicity_class || null,
      target_pests: editing.target_pests || null, target_diseases: editing.target_diseases || null,
      target_weeds: editing.target_weeds || null, dosage: editing.dosage || null,
      application_method: editing.application_method || null,
      pre_harvest_interval_days: editing.pre_harvest_interval_days ?? null,
      re_entry_interval_hours: editing.re_entry_interval_hours ?? null,
      suitable_crops: editing.suitable_crops || null, alternatives: editing.alternatives || null,
      cautions: editing.cautions || null, is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("agri_pesticides").update(payload).eq("id", editing.id)
      : await supabase.from("agri_pesticides").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from("agri_pesticides").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6" />
        <h1 className="text-2xl font-bold">المبيدات</h1>
        <div className="ms-auto"><Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />إضافة</Button></div>
      </div>

      <Card className="p-3 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: اسم، مادة فعالة، آفة، محصول..." />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الاسم</TableHead><TableHead>المادة الفعالة</TableHead><TableHead>الفئة</TableHead>
            <TableHead>الجرعة</TableHead><TableHead>مدة الأمان</TableHead><TableHead>البدائل</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name_ar}</TableCell>
                <TableCell className="text-xs italic">{r.active_ingredient} {r.concentration && `(${r.concentration})`}</TableCell>
                <TableCell><Badge variant="outline">{r.category}</Badge></TableCell>
                <TableCell className="text-xs max-w-[160px] truncate">{r.dosage}</TableCell>
                <TableCell className="text-xs">{r.pre_harvest_interval_days ? `${r.pre_harvest_interval_days} يوم` : "-"}</TableCell>
                <TableCell className="text-xs max-w-[160px] truncate">{r.alternatives}</TableCell>
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
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>مبيد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الاسم AR *</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>Nom FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>اسم تجاري</Label><Input value={editing.trade_name ?? ""} onChange={(e) => setEditing({ ...editing, trade_name: e.target.value })} /></div>
            <div><Label>المصنع</Label><Input value={editing.manufacturer ?? ""} onChange={(e) => setEditing({ ...editing, manufacturer: e.target.value })} /></div>
            <div className="col-span-2"><Label>المادة الفعالة *</Label><Input value={editing.active_ingredient ?? ""} onChange={(e) => setEditing({ ...editing, active_ingredient: e.target.value })} /></div>
            <div><Label>التركيز</Label><Input value={editing.concentration ?? ""} onChange={(e) => setEditing({ ...editing, concentration: e.target.value })} /></div>
            <div><Label>الفئة</Label><Input value={editing.category ?? ""} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="fungicide / insecticide / herbicide..." /></div>
            <div><Label>طريقة التأثير</Label><Input value={editing.mode_of_action ?? ""} onChange={(e) => setEditing({ ...editing, mode_of_action: e.target.value })} /></div>
            <div><Label>درجة السمية</Label><Input value={editing.toxicity_class ?? ""} onChange={(e) => setEditing({ ...editing, toxicity_class: e.target.value })} /></div>
            <div className="col-span-2"><Label>يستهدف الآفات</Label><Input value={editing.target_pests ?? ""} onChange={(e) => setEditing({ ...editing, target_pests: e.target.value })} /></div>
            <div className="col-span-2"><Label>يستهدف الأمراض</Label><Input value={editing.target_diseases ?? ""} onChange={(e) => setEditing({ ...editing, target_diseases: e.target.value })} /></div>
            <div><Label>الجرعة</Label><Input value={editing.dosage ?? ""} onChange={(e) => setEditing({ ...editing, dosage: e.target.value })} /></div>
            <div><Label>طريقة التطبيق</Label><Input value={editing.application_method ?? ""} onChange={(e) => setEditing({ ...editing, application_method: e.target.value })} /></div>
            <div><Label>مدة الأمان (يوم)</Label><Input type="number" value={editing.pre_harvest_interval_days ?? ""} onChange={(e) => setEditing({ ...editing, pre_harvest_interval_days: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div><Label>إعادة الدخول (ساعة)</Label><Input type="number" value={editing.re_entry_interval_hours ?? ""} onChange={(e) => setEditing({ ...editing, re_entry_interval_hours: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div className="col-span-2"><Label>المحاصيل المناسبة</Label><Input value={editing.suitable_crops ?? ""} onChange={(e) => setEditing({ ...editing, suitable_crops: e.target.value })} /></div>
            <div className="col-span-2"><Label>البدائل</Label><Input value={editing.alternatives ?? ""} onChange={(e) => setEditing({ ...editing, alternatives: e.target.value })} /></div>
            <div className="col-span-2"><Label>الاحتياطات</Label><Textarea value={editing.cautions ?? ""} onChange={(e) => setEditing({ ...editing, cautions: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
