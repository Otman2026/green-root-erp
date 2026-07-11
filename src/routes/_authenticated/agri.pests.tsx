import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Bug } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/agri/pests")({ component: PestsPage });

type PType = "insect"|"mite"|"worm"|"nematode"|"rodent"|"bird"|"mollusk"|"weed"|"other";
interface Pest {
  id: string; name_ar: string; name_fr: string|null; name_en: string|null;
  type: PType; scientific_name: string|null; description: string|null;
  life_cycle: string|null; damage: string|null; severity: number|null;
}
const empty: Partial<Pest> = { name_ar: "", type: "insect", severity: 3 };

function PestsPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Pest[]>([]);
  const [q, setQ] = useState("");
  const [typ, setTyp] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Pest>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("agri_pests").select("*").order("name_ar");
    if (error) toast.error(error.message); else setRows((data ?? []) as Pest[]);
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
      type: editing.type ?? "insect", scientific_name: editing.scientific_name || null,
      description: editing.description || null, life_cycle: editing.life_cycle || null,
      damage: editing.damage || null, severity: editing.severity ?? null,
    };
    const { error } = editing.id
      ? await supabase.from("agri_pests").update(payload).eq("id", editing.id)
      : await supabase.from("agri_pests").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("OK"); setOpen(false); setEditing(empty); load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("agri_pests").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const types = ["all","insect","mite","worm","nematode","rodent","bird","mollusk","weed","other"];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Bug className="w-6 h-6" />
        <h1 className="text-2xl font-bold">{t("agri.pests")}</h1>
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
            <TableHead>{t("agri.damage")}</TableHead><TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.name_ar}</TableCell>
                <TableCell>{r.name_fr}</TableCell>
                <TableCell><Badge>{r.type}</Badge></TableCell>
                <TableCell className="italic">{r.scientific_name}</TableCell>
                <TableCell>{r.severity != null ? "★".repeat(r.severity) : ""}</TableCell>
                <TableCell className="max-w-md truncate">{r.damage}</TableCell>
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
          <DialogHeader><DialogTitle>{t("agri.pests")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>AR</Label><Input value={editing.name_ar ?? ""} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} /></div>
            <div><Label>FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>EN</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>{t("agri.scientificName")}</Label><Input value={editing.scientific_name ?? ""} onChange={(e) => setEditing({ ...editing, scientific_name: e.target.value })} /></div>
            <div><Label>{t("agri.type")}</Label>
              <Select value={editing.type ?? "insect"} onValueChange={(v) => setEditing({ ...editing, type: v as PType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{types.filter(x => x !== "all").map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{t("agri.severity")} (1-5)</Label><Input type="number" min={1} max={5} value={editing.severity ?? 3} onChange={(e) => setEditing({ ...editing, severity: Number(e.target.value) })} /></div>
            <div className="col-span-2"><Label>{t("agri.lifeCycle")}</Label><Textarea value={editing.life_cycle ?? ""} onChange={(e) => setEditing({ ...editing, life_cycle: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("agri.damage")}</Label><Textarea value={editing.damage ?? ""} onChange={(e) => setEditing({ ...editing, damage: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
