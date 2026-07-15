import { Button, Input, Card, Label, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Receipt, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDate, todayISO } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/checks")({ component: ChecksPage });

type Dir = "in"|"out";
type Status = "pending"|"deposited"|"cleared"|"bounced"|"cancelled";
interface Chk {
  id: string; check_no: string; direction: Dir; amount: number;
  bank_name: string|null; party_name: string|null;
  issue_date: string; due_date: string|null; status: Status; notes: string|null;
}
const empty: Partial<Chk> = { check_no: "", direction: "in", amount: 0, issue_date: todayISO(), status: "pending" };

function ChecksPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<Chk[]>([]);
  const [tab, setTab] = useState<"all"|Status>("all");
  const [dir, setDir] = useState<"all"|Dir>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Chk>>(empty);

  const load = async () => {
    const { data } = await supabase.from("checks").select("*").order("due_date", { ascending: true });
    setRows((data ?? []) as Chk[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => {
    if (tab !== "all" && r.status !== tab) return false;
    if (dir !== "all" && r.direction !== dir) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!r.check_no.toLowerCase().includes(s) && !(r.party_name ?? "").toLowerCase().includes(s) && !(r.bank_name ?? "").toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, tab, dir, q]);
  const stats = useMemo(() => {
    const pend = rows.filter((r) => r.status === "pending");
    return {
      pendingIn:  pend.filter((r) => r.direction === "in").reduce((s, r) => s + Number(r.amount), 0),
      pendingOut: pend.filter((r) => r.direction === "out").reduce((s, r) => s + Number(r.amount), 0),
      total: rows.length,
    };
  }, [rows]);

  const save = async () => {
    if (!editing.check_no?.trim() || !editing.amount) return;
    const payload: any = {
      check_no: editing.check_no, direction: editing.direction, amount: Number(editing.amount),
      bank_name: editing.bank_name || null, party_name: editing.party_name || null,
      issue_date: editing.issue_date, due_date: editing.due_date || null,
      status: editing.status ?? "pending", notes: editing.notes || null,
    };
    const { error } = editing.id
      ? await supabase.from("checks").update(payload).eq("id", editing.id)
      : await supabase.from("checks").insert(payload);
    if (error) return toast.error(error.message);
    setOpen(false); setEditing(empty); load();
  };
  const changeStatus = async (id: string, status: Status) => {
    await supabase.from("checks").update({ status, status_date: todayISO() }).eq("id", id); load();
  };
  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("checks").delete().eq("id", id); load();
  };

  const statusColor: Record<Status, string> = {
    pending: "bg-amber-500", deposited: "bg-blue-500",
    cleared: "bg-emerald-500", bounced: "bg-rose-500", cancelled: "bg-gray-500",
  };
  const tabs: ("all"|Status)[] = ["all","pending","deposited","cleared","bounced","cancelled"];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Receipt className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.checks")}</h1>
        <div className="ms-auto"><Button onClick={() => { setEditing(empty); setOpen(true); }}><Plus className="me-1 h-4 w-4" />{t("common.add")}</Button></div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t("acc.pendingIn")}</div><div className="mt-1 text-xl font-bold text-emerald-600">{fmtMoney(stats.pendingIn)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t("acc.pendingOut")}</div><div className="mt-1 text-xl font-bold text-rose-600">{fmtMoney(stats.pendingOut)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted-foreground">{t("common.total")}</div><div className="mt-1 text-xl font-bold">{stats.total}</div></Card>
      </div>

      <Card className="flex flex-wrap gap-1 p-2">
        {tabs.map((s) => (
          <Button key={s} size="sm" variant={tab === s ? "default" : "ghost"} onClick={() => setTab(s)}>
            {s === "all" ? t("common.all") : t(`acc.status.${s}`)}
          </Button>
        ))}
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("acc.checkNo")}</TableHead>
            <TableHead>{t("acc.direction")}</TableHead>
            <TableHead>{t("acc.party")}</TableHead>
            <TableHead>{t("acc.bankName")}</TableHead>
            <TableHead>{t("acc.dueDate")}</TableHead>
            <TableHead>{t("receipts.amount")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono font-medium">{r.check_no}</TableCell>
                <TableCell>{r.direction === "in" ? <Badge className="bg-emerald-500">{t("receipts.in")}</Badge> : <Badge className="bg-rose-500">{t("receipts.out")}</Badge>}</TableCell>
                <TableCell>{r.party_name}</TableCell>
                <TableCell>{r.bank_name}</TableCell>
                <TableCell>{r.due_date ? fmtDate(r.due_date) : "—"}</TableCell>
                <TableCell className="font-semibold">{fmtMoney(r.amount)}</TableCell>
                <TableCell>
                  <Select value={r.status} onValueChange={(v) => changeStatus(r.id, v as Status)}>
                    <SelectTrigger className="h-8 w-32"><Badge className={statusColor[r.status]}>{t(`acc.status.${r.status}`)}</Badge></SelectTrigger>
                    <SelectContent>{(["pending","deposited","cleared","bounced","cancelled"] as Status[]).map((s) => <SelectItem key={s} value={s}>{t(`acc.status.${s}`)}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{t("acc.check")}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{t("acc.checkNo")}</Label><Input value={editing.check_no ?? ""} onChange={(e) => setEditing({ ...editing, check_no: e.target.value })} /></div>
            <div><Label>{t("acc.direction")}</Label>
              <Select value={editing.direction ?? "in"} onValueChange={(v) => setEditing({ ...editing, direction: v as Dir })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="in">{t("receipts.in")}</SelectItem><SelectItem value="out">{t("receipts.out")}</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>{t("receipts.amount")}</Label><Input type="number" step="0.01" value={editing.amount ?? 0} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} /></div>
            <div><Label>{t("acc.bankName")}</Label><Input value={editing.bank_name ?? ""} onChange={(e) => setEditing({ ...editing, bank_name: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("acc.party")}</Label><Input value={editing.party_name ?? ""} onChange={(e) => setEditing({ ...editing, party_name: e.target.value })} /></div>
            <div><Label>{t("acc.issueDate")}</Label><Input type="date" value={editing.issue_date ?? todayISO()} onChange={(e) => setEditing({ ...editing, issue_date: e.target.value })} /></div>
            <div><Label>{t("acc.dueDate")}</Label><Input type="date" value={editing.due_date ?? ""} onChange={(e) => setEditing({ ...editing, due_date: e.target.value })} /></div>
            <div className="col-span-2"><Label>{t("common.notes")}</Label><Input value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
