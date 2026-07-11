import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounting/ledger")({ component: LedgerPage });

interface Account { id: string; code: string; name: string; is_group: boolean; }

function LedgerPage() {
  const { t } = useI18n();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accId, setAccId] = useState<string>("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (supabase as any).from("accounts").select("id,code,name,is_group").eq("is_active", true).order("code")
      .then(({ data }: any) => setAccounts((data ?? []).filter((a: Account) => !a.is_group)));
  }, []);

  useEffect(() => {
    if (!accId) { setRows([]); return; }
    let q = (supabase as any).from("journal_lines")
      .select("*, journal_entries!inner(entry_no,entry_date,description,reference)")
      .eq("account_id", accId).order("journal_entries(entry_date)", { ascending: true });
    q.then(({ data }: any) => {
      let list = data ?? [];
      if (from) list = list.filter((r: any) => r.journal_entries.entry_date >= from);
      if (to)   list = list.filter((r: any) => r.journal_entries.entry_date <= to);
      setRows(list);
    });
  }, [accId, from, to]);

  const withBalance = useMemo(() => {
    let bal = 0;
    return rows.map((r: any) => {
      bal += Number(r.debit || 0) - Number(r.credit || 0);
      return { ...r, running: bal };
    });
  }, [rows]);

  const totals = useMemo(() => ({
    d: rows.reduce((s, r) => s + Number(r.debit || 0), 0),
    c: rows.reduce((s, r) => s + Number(r.credit || 0), 0),
  }), [rows]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ScrollText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.ledger")}</h1>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <Label>{t("acc.account")}</Label>
          <Select value={accId} onValueChange={setAccId}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{t("acc.from")}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>{t("acc.to")}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("common.date")}</TableHead>
            <TableHead>{t("acc.entryNo")}</TableHead>
            <TableHead>{t("common.reason")}</TableHead>
            <TableHead>{t("acc.debit")}</TableHead>
            <TableHead>{t("acc.credit")}</TableHead>
            <TableHead>{t("common.balance")}</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {withBalance.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell>{fmtDate(r.journal_entries.entry_date)}</TableCell>
                <TableCell className="font-mono">{r.journal_entries.entry_no}</TableCell>
                <TableCell className="max-w-md truncate">{r.description || r.journal_entries.description}</TableCell>
                <TableCell>{Number(r.debit) > 0 ? fmtMoney(r.debit) : ""}</TableCell>
                <TableCell>{Number(r.credit) > 0 ? fmtMoney(r.credit) : ""}</TableCell>
                <TableCell className="font-semibold">{fmtMoney(r.running)}</TableCell>
              </TableRow>
            ))}
            {rows.length > 0 && (
              <TableRow className="bg-muted/40 font-bold">
                <TableCell colSpan={3}>{t("common.total")}</TableCell>
                <TableCell>{fmtMoney(totals.d)}</TableCell>
                <TableCell>{fmtMoney(totals.c)}</TableCell>
                <TableCell>{fmtMoney(totals.d - totals.c)}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
