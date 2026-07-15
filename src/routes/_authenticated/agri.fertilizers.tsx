import { Button, Input, Card, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri/fertilizers")({ component: FertPage });

interface Row {
  id: string; name_ar: string; name_fr: string | null; name_en: string | null;
  brand: string | null; manufacturer: string | null; type: string | null;
  n_percent: number | null; p_percent: number | null; k_percent: number | null;
  micro_nutrients: string | null; composition: string | null; dosage: string | null;
  application_method: string | null; suitable_crops: string | null; suitable_stages: string | null;
  cautions: string | null; is_active: boolean;
}

const empty: Partial<Row> = { name_ar: "", is_active: true };

function FertPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_fertilizers").select("*").order("name_ar");
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    if (!s) return true;
    return r.name_ar.toLowerCase().includes(s)
      || (r.name_fr ?? "").toLowerCase().includes(s)
      || (r.name_en ?? "").toLowerCase().includes(s)
      || (r.type ?? "").toLowerCase().includes(s)
      || (r.suitable_crops ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.name_ar?.trim()) return toast.error("الاسم بالعربية إلزامي");
    const payload: any = {
      name_ar: editing.name_ar, name_fr: editing.name_fr || null, name_en: editing.name_en || null,
      brand: editing.brand || null, manufacturer: editing.manufacturer || null, type: editing.type || null,
      n_percent: editing.n_percent ?? null, p_percent: editing.p_percent ?? null, k_percent: editing.k_percent ?? null,
      micro_nutrients: editing.micro_nutrients || null, composition: editing.composition || null,
      dosage: editing.dosage || null, application_method: editing.application_method || null,
      suitable_crops: editing.suitable_crops || null, suitable_stages: editing.suitable_stages || null,
      cautions: editing.cautions || null, is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("agri_fertilizers").update(payload).eq("id", editing.id)
      : await supabase.from("agri_fertilizers").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from("agri_fertilizers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="w-6 h-6" />
        <h1 className="text-2xl font-bold">الأسمدة</h1>
        <div className="ms-auto"><Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />إضافة</Button></div>
      </div>

      <Card className="p-3 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: اسم، نوع، محصول..." />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الاسم</TableHead><TableHead>FR</TableHead><TableHead>النوع</TableHead>
            <TableHead>N-P-K</TableHead><TableHead>الجرعة</TableHead><TableHead>المحاصيل</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name_ar}</TableCell>
                <TableCell>{r.name_fr}</TableCell>
                <TableCell><Badge variant="outline">{r.type}</Badge></TableCell>
                <TableCell className="text-xs">{r.n_percent ?? 0}-{r.p_percent ?? 0}-{r.k_percent ?? 0}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{r.dosage}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{r.suitable_crops}</TableCell>
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
          <DialogHeader><DialogTitle>سماد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الاسم AR *</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>Nom FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>Name EN</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>النوع</Label><Input value={editing.type ?? ""} onChange={(e) => setEditing({ ...editing, type: e.target.value })} placeholder="simple-N / compound-NPK / organic..." /></div>
            <div><Label>N %</Label><Input type="number" step="0.1" value={editing.n_percent ?? ""} onChange={(e) => setEditing({ ...editing, n_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div><Label>P %</Label><Input type="number" step="0.1" value={editing.p_percent ?? ""} onChange={(e) => setEditing({ ...editing, p_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div><Label>K %</Label><Input type="number" step="0.1" value={editing.k_percent ?? ""} onChange={(e) => setEditing({ ...editing, k_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div><Label>عناصر صغرى</Label><Input value={editing.micro_nutrients ?? ""} onChange={(e) => setEditing({ ...editing, micro_nutrients: e.target.value })} /></div>
            <div className="col-span-2"><Label>التركيبة</Label><Input value={editing.composition ?? ""} onChange={(e) => setEditing({ ...editing, composition: e.target.value })} /></div>
            <div><Label>الجرعة</Label><Input value={editing.dosage ?? ""} onChange={(e) => setEditing({ ...editing, dosage: e.target.value })} /></div>
            <div><Label>طريقة التطبيق</Label><Input value={editing.application_method ?? ""} onChange={(e) => setEditing({ ...editing, application_method: e.target.value })} /></div>
            <div className="col-span-2"><Label>المحاصيل المناسبة</Label><Input value={editing.suitable_crops ?? ""} onChange={(e) => setEditing({ ...editing, suitable_crops: e.target.value })} /></div>
            <div className="col-span-2"><Label>المراحل المناسبة</Label><Input value={editing.suitable_stages ?? ""} onChange={(e) => setEditing({ ...editing, suitable_stages: e.target.value })} /></div>
            <div className="col-span-2"><Label>الاحتياطات</Label><Textarea value={editing.cautions ?? ""} onChange={(e) => setEditing({ ...editing, cautions: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
