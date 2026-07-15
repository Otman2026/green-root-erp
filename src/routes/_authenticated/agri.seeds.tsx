import { Button, Input, Card, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/agri/seeds")({ component: Page });

interface Row {
  id: string; variety_name: string; crop_name: string; company: string | null;
  country_of_origin: string | null; seed_type: string | null; planting_season: string | null;
  planting_method: string | null; density: string | null; germination_rate_percent: number | null;
  purity_percent: number | null; cycle_days: number | null; expected_yield: string | null;
  disease_resistance: string | null; climate_zones: string | null; packaging_size: string | null;
  description: string | null; is_active: boolean;
}
const empty: Partial<Row> = { variety_name: "", crop_name: "", is_active: true };

function Page() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Row>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_seeds").select("*").order("crop_name");
    if (error) toast.error(error.message); else setRows((data ?? []) as Row[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    if (!s) return true;
    return r.variety_name.toLowerCase().includes(s)
      || r.crop_name.toLowerCase().includes(s)
      || (r.company ?? "").toLowerCase().includes(s)
      || (r.country_of_origin ?? "").toLowerCase().includes(s)
      || (r.seed_type ?? "").toLowerCase().includes(s);
  }), [rows, q]);

  const save = async () => {
    if (!editing.variety_name?.trim() || !editing.crop_name?.trim()) return toast.error("الصنف والمحصول إلزاميان");
    const payload: any = {
      variety_name: editing.variety_name, crop_name: editing.crop_name,
      company: editing.company || null, country_of_origin: editing.country_of_origin || null,
      seed_type: editing.seed_type || null, planting_season: editing.planting_season || null,
      planting_method: editing.planting_method || null, density: editing.density || null,
      germination_rate_percent: editing.germination_rate_percent ?? null,
      purity_percent: editing.purity_percent ?? null,
      cycle_days: editing.cycle_days ?? null,
      expected_yield: editing.expected_yield || null,
      disease_resistance: editing.disease_resistance || null,
      climate_zones: editing.climate_zones || null,
      packaging_size: editing.packaging_size || null,
      description: editing.description || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("agri_seeds").update(payload).eq("id", editing.id)
      : await supabase.from("agri_seeds").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ"); setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm("تأكيد الحذف؟")) return;
    const { error } = await supabase.from("agri_seeds").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Sprout className="w-6 h-6" />
        <h1 className="text-2xl font-bold">البذور والأصناف</h1>
        <div className="ms-auto"><Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />إضافة</Button></div>
      </div>

      <Card className="p-3 flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: صنف، محصول، شركة..." />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الصنف</TableHead><TableHead>المحصول</TableHead><TableHead>الشركة</TableHead>
            <TableHead>البلد</TableHead><TableHead>النوع</TableHead><TableHead>الموسم</TableHead>
            <TableHead>الدورة</TableHead><TableHead>الإنتاج المتوقع</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.variety_name}</TableCell>
                <TableCell>{r.crop_name}</TableCell>
                <TableCell>{r.company}</TableCell>
                <TableCell>{r.country_of_origin}</TableCell>
                <TableCell><Badge variant="outline">{r.seed_type}</Badge></TableCell>
                <TableCell className="text-xs">{r.planting_season}</TableCell>
                <TableCell className="text-xs">{r.cycle_days ? `${r.cycle_days} يوم` : "-"}</TableCell>
                <TableCell className="text-xs max-w-[140px] truncate">{r.expected_yield}</TableCell>
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
          <DialogHeader><DialogTitle>بذور / صنف</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الصنف *</Label><Input value={editing.variety_name ?? ""} onChange={(e) => setEditing({ ...editing, variety_name: e.target.value })} /></div>
            <div><Label>المحصول *</Label><Input value={editing.crop_name ?? ""} onChange={(e) => setEditing({ ...editing, crop_name: e.target.value })} /></div>
            <div><Label>الشركة</Label><Input value={editing.company ?? ""} onChange={(e) => setEditing({ ...editing, company: e.target.value })} /></div>
            <div><Label>البلد</Label><Input value={editing.country_of_origin ?? ""} onChange={(e) => setEditing({ ...editing, country_of_origin: e.target.value })} /></div>
            <div><Label>نوع البذور</Label><Input value={editing.seed_type ?? ""} onChange={(e) => setEditing({ ...editing, seed_type: e.target.value })} placeholder="hybrid F1 / open-pollinated..." /></div>
            <div><Label>موسم الزراعة</Label><Input value={editing.planting_season ?? ""} onChange={(e) => setEditing({ ...editing, planting_season: e.target.value })} /></div>
            <div><Label>طريقة الزراعة</Label><Input value={editing.planting_method ?? ""} onChange={(e) => setEditing({ ...editing, planting_method: e.target.value })} /></div>
            <div><Label>الكثافة</Label><Input value={editing.density ?? ""} onChange={(e) => setEditing({ ...editing, density: e.target.value })} /></div>
            <div><Label>نسبة الإنبات %</Label><Input type="number" step="0.1" value={editing.germination_rate_percent ?? ""} onChange={(e) => setEditing({ ...editing, germination_rate_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div><Label>النقاء %</Label><Input type="number" step="0.1" value={editing.purity_percent ?? ""} onChange={(e) => setEditing({ ...editing, purity_percent: e.target.value ? parseFloat(e.target.value) : null })} /></div>
            <div><Label>الدورة (يوم)</Label><Input type="number" value={editing.cycle_days ?? ""} onChange={(e) => setEditing({ ...editing, cycle_days: e.target.value ? parseInt(e.target.value) : null })} /></div>
            <div><Label>الإنتاج المتوقع</Label><Input value={editing.expected_yield ?? ""} onChange={(e) => setEditing({ ...editing, expected_yield: e.target.value })} /></div>
            <div className="col-span-2"><Label>مقاومة الأمراض</Label><Input value={editing.disease_resistance ?? ""} onChange={(e) => setEditing({ ...editing, disease_resistance: e.target.value })} /></div>
            <div><Label>المناطق المناخية</Label><Input value={editing.climate_zones ?? ""} onChange={(e) => setEditing({ ...editing, climate_zones: e.target.value })} /></div>
            <div><Label>حجم العبوة</Label><Input value={editing.packaging_size ?? ""} onChange={(e) => setEditing({ ...editing, packaging_size: e.target.value })} /></div>
            <div className="col-span-2"><Label>الوصف</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
