import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/accounting/chart")({ component: ChartOfAccounts });

type AccType = "asset"|"liability"|"equity"|"revenue"|"expense";
interface Account {
  id: string; code: string; name: string; name_fr: string|null; name_en: string|null;
  type: AccType; parent_id: string|null; is_group: boolean; currency: string; is_active: boolean;
}
const empty: Partial<Account> = { code: "", name: "", type: "asset", is_group: false, currency: "MAD", is_active: true };

function ChartOfAccounts() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Account[]>([]);
  const [q, setQ] = useState("");
  const [typ, setTyp] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Account>>(empty);

  const load = async () => {
    const { data, error } = await supabase.from("accounts").select("*").order("code");
    if (error) toast.error(error.message); else setRows((data ?? []) as Account[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    const s = q.toLowerCase();
    const okQ = !s || r.code.includes(s) || r.name.toLowerCase().includes(s) || (r.name_fr ?? "").toLowerCase().includes(s);
    return okQ && (typ === "all" || r.type === typ);
  }), [rows, q, typ]);

  const save = async () => {
    if (!editing.code?.trim() || !editing.name?.trim()) return toast.error("Code + name");
    const payload: any = {
      code: editing.code, name: editing.name, name_fr: editing.name_fr || null, name_en: editing.name_en || null,
      type: editing.type, parent_id: editing.parent_id || null, is_group: !!editing.is_group,
      currency: editing.currency || "MAD", is_active: editing.is_active ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("accounts").update(payload).eq("id", editing.id)
      : await supabase.from("accounts").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("OK"); setOpen(false); setEditing(empty); load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("accounts").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  const types: (AccType|"all")[] = ["all","asset","liability","equity","revenue","expense"];
  const typeColor: Record<AccType, string> = {
    asset: "bg-blue-500", liability: "bg-orange-500", equity: "bg-purple-500",
    revenue: "bg-emerald-500", expense: "bg-rose-500",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.chart")}</h1>
        <div className="ms-auto">
          <Button onClick={() => { setEditing(empty); setOpen(true); }}>
            <Plus className="me-1 h-4 w-4" />{t("common.add")}
          </Button>
        </div>
      </div>

      <Card className="flex flex-wrap items-center gap-2 p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-2.5 start-2 h-4 w-4 opacity-60" />
          <Input className="ps-8" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("common.search")} />
        </div>
        <Select value={typ} onValueChange={setTyp}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {types.map((k) => <SelectItem key={k} value={k}>{k === "all" ? t("common.all") : t(`acc.type.${k}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.code")}</TableHead>
            <TableHead>{t("common.name")}</TableHead>
            <TableHead>FR</TableHead>
            <TableHead>{t("agri.type")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-medium">{r.code}</TableCell>
                <TableCell className={r.is_group ? "font-bold" : ""}>{r.name}</TableCell>
                <TableCell className="text-muted-foreground">{r.name_fr}</TableCell>
                <TableCell><Badge className={typeColor[r.type]}>{t(`acc.type.${r.type}`)}</Badge></TableCell>
                <TableCell>{r.is_active ? t("common.active") : t("common.inactive")}</TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>{t("acc.account")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("common.code")}</Label><Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} /></div>
            <div><Label>{t("agri.type")}</Label>
              <Select value={editing.type ?? "asset"} onValueChange={(v) => setEditing({ ...editing, type: v as AccType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["asset","liability","equity","revenue","expense"] as AccType[]).map((k) => <SelectItem key={k} value={k}>{t(`acc.type.${k}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label>{t("common.name")} (AR)</Label><Input value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><Label>FR</Label><Input value={editing.name_fr ?? ""} onChange={(e) => setEditing({ ...editing, name_fr: e.target.value })} /></div>
            <div><Label>EN</Label><Input value={editing.name_en ?? ""} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} /></div>
            <div><Label>{t("acc.parent")}</Label>
              <Select value={editing.parent_id ?? "__none"} onValueChange={(v) => setEditing({ ...editing, parent_id: v === "__none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">—</SelectItem>
                  {rows.filter(r => r.is_group).map((r) => <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2"><Checkbox checked={!!editing.is_group} onCheckedChange={(v) => setEditing({ ...editing, is_group: !!v })} />{t("acc.isGroup")}</label>
              <label className="flex items-center gap-2"><Checkbox checked={editing.is_active ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_active: !!v })} />{t("common.active")}</label>
            </div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
