import { Button, Input, Card, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/agri/diseases")({ component: DiseasesPage });

type DType = "fungal"|"bacterial"|"viral"|"physiological"|"nutrient_deficiency"|"climatic";
interface Disease {
  id: string; name_ar: string; name_fr: string|null; name_en: string|null;
  type: DType; scientific_name: string|null; description: string|null;
  symptoms: string|null; severity: number|null; prevention: string|null;
}
const empty: Partial<Disease> = { name_ar: "", type: "fungal", severity: 3 };

function DiseasesPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Disease[]>([]);
  const [q, setQ] = useState("");
  const [typ, setTyp] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Disease>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_diseases").select("*").order("name_ar");
    if (error) toast.error(error.message); else setRows((data ?? []) as Disease[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    const okQ = !s || r.name_ar.toLowerCase().includes(s)
      || (r.name_fr ?? "").toLowerCase().includes(s)
      || (r.name_en ?? "").toLowerCase().includes(s)
      || (r.scientific_name ?? "").toLowerCase().includes(s);
    return okQ && (typ === "all" || r.type === typ);
  }), [rows, q, typ]);

  const save = async () => {
    if (!editing.name_ar?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      name_ar: editing.name_ar, name_fr: editing.name_fr || null, name_en: editing.name_en || null,
      type: editing.type ?? "fungal", scientific_name: editing.scientific_name || null,
      description: editing.description || null, symptoms: editing.symptoms || null,
      severity: editing.severity ?? null, prevention: editing.prevention || null,
    };
    const { error } = editing.id
      ? await supabase.from("agri_diseases").update(payload).eq("id", editing.id)
      : await supabase.from("agri_diseases").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("OK"); setOpen(false); setEditing(empty); load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("agri_diseases").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const types = ["all","fungal","bacterial","viral","physiological","nutrient_deficiency","climatic"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.diseases")}</h1>
        <div className="ms-auto">
          <Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />{t("common.add")}</Button>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="AR / FR / EN / Latin" />
        </div>
        <Select value={typ} onValueChange={setTyp}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{types.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الاسم</TableHead><TableHead>FR</TableHead>
            <TableHead>{t("agri.type")}</TableHead>
            <TableHead>{t("agri.scientificName")}</TableHead>
            <TableHead>{t("agri.severity")}</TableHead>
            <TableHead>{t("agri.symptoms")}</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium"><Link to="/agri/diseases/$id" params={{ id: r.id }} className="hover:underline text-primary">{r.name_ar}</Link></TableCell>
                <TableCell>{r.name_fr}</TableCell>
                <TableCell><Badge>{r.type}</Badge></TableCell>
                <TableCell className="italic">{r.scientific_name}</TableCell>
                <TableCell>{r.severity != null ? "★".repeat(r.severity) : ""}</TableCell>
                <TableCell className="max-w-md truncate">{r.symptoms}</TableCell>
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
          <DialogHeader><DialogTitle>{t("agri.diseases")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>AR</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>EN</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>{t("agri.scientificName")}</Label><Input value={editing.scientific_name ?? ""} onChange={(e) => setEditing({ ...editing, scientific_name: e.target.value })} /></div>
            <div><Label>{t("agri.type")}</Label>
              <Select value={editing.type ?? "fungal"} onValueChange={(v) => setEditing({ ...editing, type: v as DType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{types.filter(x => x !== "all").map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("agri.severity")} (1-5)</Label><Input type="number" min={1} max={5} value={editing.severity ?? 3} onChange={(e) => setEditing({ ...editing, severity: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>{t("agri.symptoms")}</Label><Textarea value={editing.symptoms ?? ""} onChange={(e) => setEditing({ ...editing, symptoms: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("agri.prevention")}</Label><Textarea value={editing.prevention ?? ""} onChange={(e) => setEditing({ ...editing, prevention: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
