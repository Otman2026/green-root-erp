import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, FileText, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounting/journal")({ component: JournalPage });

interface Entry { id: string; entry_no: string; entry_date: string; description: string|null; reference: string|null; status: string; }
interface Line { id?: string; account_id: string; debit: number; credit: number; description?: string|null; }
interface Account { id: string; code: string; name: string; is_group: boolean; }

function JournalPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [open, setOpen] = useState(false);
  const [viewing, setViewing] = useState<Entry | null>(null);
  const [viewLines, setViewLines] = useState<any[]>([]);
  const [form, setForm] = useState<{ entry_date: string; description: string; reference: string; lines: Line[] }>({
    entry_date: todayISO(), description: "", reference: "",
    lines: [{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }],
  });

  const load = async () => {
    const [e, a] = await Promise.all([
      supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }).limit(100),
      supabase.from("accounts").select("id,code,name,is_group").eq("is_active", true).order("code"),
    ]);
    setEntries((e.data ?? []) as Entry[]);
    setAccounts((a.data ?? []) as Account[]);
  };
  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const d = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const c = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return { debit: d, credit: c, balanced: Math.abs(d - c) < 0.01 && d > 0 };
  }, [form.lines]);

  const setLine = (i: number, patch: Partial<Line>) => {
    const next = [...form.lines];
    next[i] = { ...next[i], ...patch };
    // if debit set, clear credit and vice versa
    if (patch.debit !== undefined && Number(patch.debit) > 0) next[i].credit = 0;
    if (patch.credit !== undefined && Number(patch.credit) > 0) next[i].debit = 0;
    setForm({ ...form, lines: next });
  };
  const addLine = () => setForm({ ...form, lines: [...form.lines, { account_id: "", debit: 0, credit: 0 }] });
  const rmLine = (i: number) => setForm({ ...form, lines: form.lines.filter((_, k) => k !== i) });

  const save = async () => {
    if (!totals.balanced) return toast.error(t("acc.notBalanced"));
    const validLines = form.lines.filter((l) => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (validLines.length < 2) return toast.error(t("acc.needTwoLines"));
    const { data: entry, error } = await supabase.from("journal_entries").insert({
      entry_date: form.entry_date, description: form.description || null, reference: form.reference || null,
      status: "posted", source_type: "manual",
    }).select().single();
    if (error) return toast.error(error.message);
    const linesPayload = validLines.map((l, i) => ({
      entry_id: entry.id, account_id: l.account_id,
      debit: Number(l.debit) || 0, credit: Number(l.credit) || 0,
      description: l.description || null, line_no: i + 1,
    }));
    const { error: lerr } = await supabase.from("journal_lines").insert(linesPayload);
    if (lerr) return toast.error(lerr.message);
    toast.success("✓"); setOpen(false);
    setForm({ entry_date: todayISO(), description: "", reference: "", lines: [{ account_id: "", debit: 0, credit: 0 }, { account_id: "", debit: 0, credit: 0 }] });
    load();
  };

  const view = async (e: Entry) => {
    setViewing(e);
    const { data } = await supabase.from("journal_lines")
      .select("*, accounts(code,name)").eq("entry_id", e.id).order("line_no");
    setViewLines(data ?? []);
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", id);
    if (error) return toast.error(error.message); load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.journal")}</h1>
        <div className="ms-auto">
          <Button onClick={() => setOpen(true)}><Plus className="me-1 h-4 w-4" />{t("acc.newEntry")}</Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("acc.entryNo")}</TableHead>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("common.reason")}</TableHead>
            <TableHead>{t("acc.reference")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono font-medium">{e.entry_no}</TableCell>
                <TableCell>{fmtDate(e.entry_date)}</TableCell>
                <TableCell className="max-w-md truncate">{e.description}</TableCell>
                <TableCell>{e.reference}</TableCell>
                <TableCell><Badge variant={e.status === "posted" ? "default" : "outline"}>{e.status}</Badge></TableCell>
                <TableCell className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => view(e)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* New entry dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader><DialogTitle>{t("acc.newEntry")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>{t("common.date")}</Label><Input type="date" value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} /></div>
            <div><Label>{t("acc.reference")}</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
            <div className="col-span-3"><Label>{t("common.reason")}</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("acc.lines")}</Label>
              <Button size="sm" variant="outline" onClick={addLine}><Plus className="me-1 h-3 w-3" />{t("acc.addLine")}</Button>
            </div>
            <div className="max-h-72 overflow-auto rounded border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("acc.account")}</TableHead>
                  <TableHead>{t("acc.debit")}</TableHead>
                  <TableHead>{t("acc.credit")}</TableHead>
                  <TableHead>{t("common.notes")}</TableHead>
                  <TableHead></TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {form.lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="min-w-[220px]">
                        <Select value={l.account_id || "__x"} onValueChange={(v) => setLine(i, { account_id: v })}>
                          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {accounts.filter(a => !a.is_group).map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell><Input type="number" step="0.01" value={l.debit || ""} onChange={(e) => setLine(i, { debit: Number(e.target.value) })} className="w-28" /></TableCell>
                      <TableCell><Input type="number" step="0.01" value={l.credit || ""} onChange={(e) => setLine(i, { credit: Number(e.target.value) })} className="w-28" /></TableCell>
                      <TableCell><Input value={l.description ?? ""} onChange={(e) => setLine(i, { description: e.target.value })} /></TableCell>
                      <TableCell><Button size="icon" variant="ghost" onClick={() => rmLine(i)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className={`flex items-center justify-end gap-6 rounded p-2 text-sm ${totals.balanced ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              <div>{t("acc.debit")}: <span className="font-bold">{fmtMoney(totals.debit)}</span></div>
              <div>{t("acc.credit")}: <span className="font-bold">{fmtMoney(totals.credit)}</span></div>
              <div>{t("acc.difference")}: <span className="font-bold">{fmtMoney(totals.debit - totals.credit)}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={!totals.balanced}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View entry */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{viewing?.entry_no}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">{t("common.date")}:</span> {fmtDate(viewing.entry_date)}</div>
                <div><span className="text-muted-foreground">{t("acc.reference")}:</span> {viewing.reference}</div>
                <div><span className="text-muted-foreground">{t("common.status")}:</span> {viewing.status}</div>
                <div className="col-span-3"><span className="text-muted-foreground">{t("common.reason")}:</span> {viewing.description}</div>
              </div>
              <Table>
                <TableHeader><TableRow>
                  <TableHead>{t("acc.account")}</TableHead>
                  <TableHead>{t("acc.debit")}</TableHead>
                  <TableHead>{t("acc.credit")}</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {viewLines.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.accounts?.code} — {l.accounts?.name}</TableCell>
                      <TableCell>{Number(l.debit) > 0 ? fmtMoney(l.debit) : "—"}</TableCell>
                      <TableCell>{Number(l.credit) > 0 ? fmtMoney(l.credit) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
