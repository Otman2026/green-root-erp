import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Sprout } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/agri/plants")({ component: PlantsPage });

interface Plant {
  id: string; scientific_name: string | null;
  common_name_ar: string; common_name_fr: string | null; common_name_en: string | null;
  category_id: string | null; family: string | null; cycle: string | null; season: string | null;
  climate: string | null; soil: string | null; water_needs: string | null;
  description: string | null; image_url: string | null; is_active: boolean;
}
interface Cat { id: string; name_ar: string; kind: string }

const empty: Partial<Plant> = { common_name_ar: "", is_active: true };

function PlantsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Plant[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Plant>>(empty);

  const load = async () => {
    const [p, c] = await Promise.all([
      supabase.from("agri_plants").select("*").order("common_name_ar"),
      supabase.from("agri_plant_categories").select("id,name_ar,kind").order("sort"),
    ]);
    if (p.error) toast.error(p.error.message); else setRows((p.data ?? []) as Plant[]);
    if (!c.error) setCats((c.data ?? []) as Cat[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    const okQ = !s || r.common_name_ar.toLowerCase().includes(s)
      || (r.common_name_fr ?? "").toLowerCase().includes(s)
      || (r.common_name_en ?? "").toLowerCase().includes(s)
      || (r.scientific_name ?? "").toLowerCase().includes(s);
    const cat = cats.find((c) => c.id === r.category_id);
    const okK = kind === "all" || (cat && cat.kind === kind);
    return okQ && okK;
  }), [rows, cats, q, kind]);

  const save = async () => {
    if (!editing.common_name_ar?.trim()) return toast.error(t("common.name"));
    const payload: any = {
      common_name_ar: editing.common_name_ar,
      common_name_fr: editing.common_name_fr || null,
      common_name_en: editing.common_name_en || null,
      scientific_name: editing.scientific_name || null,
      category_id: editing.category_id || null,
      family: editing.family || null,
      cycle: editing.cycle || null, season: editing.season || null,
      climate: editing.climate || null, soil: editing.soil || null,
      water_needs: editing.water_needs || null,
      description: editing.description || null,
      is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("agri_plants").update(payload).eq("id", editing.id)
      : await supabase.from("agri_plants").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("OK"); setOpen(false); setEditing(empty); load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("agri_plants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const kinds = ["all","crop","fruit_tree","vegetable","grain","herb","industrial","fodder","forest","ornamental"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Sprout className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.plants")}</h1>
        <div className="ms-auto flex gap-2">
          <Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="w-4 h-4 me-1" />{t("common.add")}</Button>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-2.5 start-2 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder="AR / FR / EN / Latin" />
        </div>
        <Select value={kind} onValueChange={setKind}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{kinds.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>الاسم</TableHead><TableHead>FR</TableHead><TableHead>{t("agri.scientificName")}</TableHead>
            <TableHead>{t("agri.family")}</TableHead><TableHead>{t("agri.cycle")}</TableHead>
            <TableHead>{t("agri.season")}</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.common_name_ar}</TableCell>
                <TableCell>{r.common_name_fr}</TableCell>
                <TableCell className="italic">{r.scientific_name}</TableCell>
                <TableCell>{r.family}</TableCell>
                <TableCell><Badge variant="outline">{r.cycle}</Badge></TableCell>
                <TableCell>{r.season}</TableCell>
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
          <DialogHeader><DialogTitle>{t("agri.plants")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>اسم AR</Label><Input value={editing.common_name_ar ?? ""} onChange={(e) => setEditing({ ...editing, common_name_ar: e.target.value })} /></div>
            <div><Label>Nom FR</Label><Input value={editing.common_name_fr ?? ""} onChange={(e) => setEditing({ ...editing, common_name_fr: e.target.value })} /></div>
            <div><Label>Name EN</Label><Input value={editing.common_name_en ?? ""} onChange={(e) => setEditing({ ...editing, common_name_en: e.target.value })} /></div>
            <div><Label>{t("agri.scientificName")}</Label><Input value={editing.scientific_name ?? ""} onChange={(e) => setEditing({ ...editing, scientific_name: e.target.value })} /></div>
            <div><Label>{t("agri.category")}</Label>
              <Select value={editing.category_id ?? ""} onValueChange={(v) => setEditing({ ...editing, category_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("agri.family")}</Label><Input value={editing.family ?? ""} onChange={(e) => setEditing({ ...editing, family: e.target.value })} /></div>
            <div><Label>{t("agri.cycle")}</Label><Input value={editing.cycle ?? ""} onChange={(e) => setEditing({ ...editing, cycle: e.target.value })} /></div>
            <div><Label>{t("agri.season")}</Label><Input value={editing.season ?? ""} onChange={(e) => setEditing({ ...editing, season: e.target.value })} /></div>
            <div className="col-span-2"><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
