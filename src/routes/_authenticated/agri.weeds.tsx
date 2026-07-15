import { Button, Input, Card, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Wheat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri/weeds")({ component: Page });

interface Row {
  id: string; name_ar: string; name_fr: string | null; name_en: string | null;
  scientific_name: string | null; family: string | null; weed_type: string | null;
  life_cycle: string | null; description: string | null; identification: string | null;
  affected_crops: string | null; damage: string | null;
  control_cultural: string | null; control_mechanical: string | null;
  control_chemical: string | null; control_biological: string | null;
  is_active: boolean;
}
const empty: Partial<Row> = { name_ar: "", is_active: true };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_weeds").select("*").order("name_ar");
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    if (!s) return true;
    return r.name_ar.toLowerCase().includes(s)
      || (r.name_fr ?? "").toLowerCase().includes(s)
      || (r.scientific_name ?? "").toLowerCase().includes(s)
      || (r.weed_type ?? "").toLowerCase().includes(s)
      || (r.affected_crops ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.name_ar?.trim()) return toast.error("الاسم بالعربية إلزامي");
    const payload: any = {
      name_ar: editing.name_ar, name_fr: editing.name_fr || null, name_en: editing.name_en || null,
      scientific_name: editing.scientific_name || null, family: editing.family || null,
      weed_type: editing.weed_type || null, life_cycle: editing.life_cycle || null,
      description: editing.description || null, identification: editing.identification || null,
      affected_crops: editing.affected_crops || null, damage: editing.damage || null,
      control_cultural: editing.control_cultural || null,
      control_mechanical: editing.control_mechanical || null,
      control_chemical: editing.control_chemical || null,
      control_biological: editing.control_biological || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("agri_weeds").update(payload).eq("id", editing.id)
      : await supabase.from("agri_weeds").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from("agri_weeds").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Wheat className="w-6 h-6" />
        <h1 className="text-2xl font-bold">الأعشاب الضارة</h1>
        <div className="ms-auto"><Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />إضافة</Button></div>
      </div>

      <Card className="p-3 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: اسم، محصول متأثر..." />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الاسم</TableHead><TableHead>FR</TableHead><TableHead>علمي</TableHead>
            <TableHead>النوع</TableHead><TableHead>الدورة</TableHead>
            <TableHead>المحاصيل المتأثرة</TableHead><TableHead>مكافحة كيميائية</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name_ar}</TableCell>
                <TableCell>{r.name_fr}</TableCell>
                <TableCell className="italic text-xs">{r.scientific_name}</TableCell>
                <TableCell><Badge variant="outline">{r.weed_type}</Badge></TableCell>
                <TableCell className="text-xs">{r.life_cycle}</TableCell>
                <TableCell className="text-xs max-w-[160px] truncate">{r.affected_crops}</TableCell>
                <TableCell className="text-xs max-w-[180px] truncate">{r.control_chemical}</TableCell>
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
          <DialogHeader><DialogTitle>عشبة ضارة</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الاسم AR *</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>Nom FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>Name EN</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>علمي</Label><Input value={editing.scientific_name ?? ""} onChange={(e) => setEditing({ ...editing, scientific_name: e.target.value })} /></div>
            <div><Label>العائلة</Label><Input value={editing.family ?? ""} onChange={(e) => setEditing({ ...editing, family: e.target.value })} /></div>
            <div><Label>النوع</Label><Input value={editing.weed_type ?? ""} onChange={(e) => setEditing({ ...editing, weed_type: e.target.value })} placeholder="grass / broadleaf / sedge" /></div>
            <div><Label>الدورة</Label><Input value={editing.life_cycle ?? ""} onChange={(e) => setEditing({ ...editing, life_cycle: e.target.value })} placeholder="annual / perennial" /></div>
            <div className="col-span-2"><Label>المحاصيل المتأثرة</Label><Input value={editing.affected_crops ?? ""} onChange={(e) => setEditing({ ...editing, affected_crops: e.target.value })} /></div>
            <div className="col-span-2"><Label>التعريف</Label><Textarea rows={2} value={editing.identification ?? ""} onChange={(e) => setEditing({ ...editing, identification: e.target.value })} /></div>
            <div className="col-span-2"><Label>الأضرار</Label><Textarea rows={2} value={editing.damage ?? ""} onChange={(e) => setEditing({ ...editing, damage: e.target.value })} /></div>
            <div><Label>مكافحة زراعية</Label><Textarea rows={2} value={editing.control_cultural ?? ""} onChange={(e) => setEditing({ ...editing, control_cultural: e.target.value })} /></div>
            <div><Label>مكافحة ميكانيكية</Label><Textarea rows={2} value={editing.control_mechanical ?? ""} onChange={(e) => setEditing({ ...editing, control_mechanical: e.target.value })} /></div>
            <div><Label>مكافحة كيميائية</Label><Textarea rows={2} value={editing.control_chemical ?? ""} onChange={(e) => setEditing({ ...editing, control_chemical: e.target.value })} /></div>
            <div><Label>مكافحة حيوية</Label><Textarea rows={2} value={editing.control_biological ?? ""} onChange={(e) => setEditing({ ...editing, control_biological: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
