import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounting/reports")({ component: ReportsPage });

function ReportsPage() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [lines, setLines] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let query = (supabase as any).from("journal_lines")
        .select("debit,credit,accounts(id,code,name,type),journal_entries!inner(entry_date)");
      const { data } = await query;
      let list = data ?? [];
      if (from) list = list.filter((r: any) => r.journal_entries.entry_date >= from);
      if (to)   list = list.filter((r: any) => r.journal_entries.entry_date <= to);
      setLines(list);
    })();
  }, [from, to]);

  const trial = useMemo(() => {
    const map = new Map<string, any>();
    for (const l of lines) {
      const a = l.accounts; if (!a) continue;
      const cur = map.get(a.id) ?? { ...a, debit: 0, credit: 0 };
      cur.debit += Number(l.debit || 0);
      cur.credit += Number(l.credit || 0);
      map.set(a.id, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.code.localeCompare(b.code));
  }, [lines]);

  const trialTotals = useMemo(() => ({
    d: trial.reduce((s, r) => s + r.debit, 0),
    c: trial.reduce((s, r) => s + r.credit, 0),
  }), [trial]);

  const pnl = useMemo(() => {
    const rev = trial.filter((r) => r.type === "revenue");
    const exp = trial.filter((r) => r.type === "expense");
    const totalRev = rev.reduce((s, r) => s + (r.credit - r.debit), 0);
    const totalExp = exp.reduce((s, r) => s + (r.debit - r.credit), 0);
    return { rev, exp, totalRev, totalExp, profit: totalRev - totalExp };
  }, [trial]);

  const balance = useMemo(() => {
    const asset = trial.filter((r) => r.type === "asset");
    const liab  = trial.filter((r) => r.type === "liability");
    const eq    = trial.filter((r) => r.type === "equity");
    const A = asset.reduce((s, r) => s + (r.debit - r.credit), 0);
    const L = liab.reduce((s, r) => s + (r.credit - r.debit), 0);
    const E = eq.reduce((s, r) => s + (r.credit - r.debit), 0);
    return { asset, liab, eq, A, L, E, profit: pnl.profit };
  }, [trial, pnl.profit]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("acc.reports")}</h1>
      </div>

      <Card className="grid grid-cols-1 gap-3 p-3 md:grid-cols-4">
        <div><Label>{t("acc.from")}</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><Label>{t("acc.to")}</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </Card>

      <Tabs defaultValue="trial">
        <TabsList>
          <TabsTrigger value="trial">{t("acc.trialBalance")}</TabsTrigger>
          <TabsTrigger value="pnl">{t("acc.pnl")}</TabsTrigger>
          <TabsTrigger value="bs">{t("acc.balanceSheet")}</TabsTrigger>
          <TabsTrigger value="cf">{t("acc.cashflow")}</TabsTrigger>
        </TabsList>

        <TabsContent value="trial">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>{t("common.code")}</TableHead>
                <TableHead>{t("acc.account")}</TableHead>
                <TableHead>{t("agri.type")}</TableHead>
                <TableHead>{t("acc.debit")}</TableHead>
                <TableHead>{t("acc.credit")}</TableHead>
                <TableHead>{t("common.balance")}</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {trial.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.code}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{t(`acc.type.${r.type}`)}</TableCell>
                    <TableCell>{fmtMoney(r.debit)}</TableCell>
                    <TableCell>{fmtMoney(r.credit)}</TableCell>
                    <TableCell className="font-semibold">{fmtMoney(r.debit - r.credit)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/40 font-bold">
                  <TableCell colSpan={3}>{t("common.total")}</TableCell>
                  <TableCell>{fmtMoney(trialTotals.d)}</TableCell>
                  <TableCell>{fmtMoney(trialTotals.c)}</TableCell>
                  <TableCell>{fmtMoney(trialTotals.d - trialTotals.c)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <Card className="p-4 space-y-4">
            <div>
              <div className="mb-2 font-bold text-emerald-600">{t("accounting.revenue")}</div>
              <Table>
                <TableBody>
                  {pnl.rev.map((r) => (
                    <TableRow key={r.id}><TableCell className="font-mono w-24">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-end">{fmtMoney(r.credit - r.debit)}</TableCell></TableRow>
                  ))}
                  <TableRow className="font-bold"><TableCell colSpan={2}>{t("common.total")}</TableCell><TableCell className="text-end text-emerald-600">{fmtMoney(pnl.totalRev)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            <div>
              <div className="mb-2 font-bold text-rose-600">{t("accounting.expenses")}</div>
              <Table>
                <TableBody>
                  {pnl.exp.map((r) => (
                    <TableRow key={r.id}><TableCell className="font-mono w-24">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-end">{fmtMoney(r.debit - r.credit)}</TableCell></TableRow>
                  ))}
                  <TableRow className="font-bold"><TableCell colSpan={2}>{t("common.total")}</TableCell><TableCell className="text-end text-rose-600">{fmtMoney(pnl.totalExp)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>
            <div className={`rounded p-3 text-lg font-bold ${pnl.profit >= 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
              {t("accounting.profit")}: {fmtMoney(pnl.profit)}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="bs">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card className="p-4">
              <div className="mb-2 font-bold">{t("acc.assets")}</div>
              <Table>
                <TableBody>
                  {balance.asset.map((r) => <TableRow key={r.id}><TableCell className="font-mono w-24">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-end">{fmtMoney(r.debit - r.credit)}</TableCell></TableRow>)}
                  <TableRow className="font-bold"><TableCell colSpan={2}>{t("common.total")}</TableCell><TableCell className="text-end">{fmtMoney(balance.A)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </Card>
            <Card className="p-4">
              <div className="mb-2 font-bold">{t("acc.liabilities")} + {t("acc.equity")}</div>
              <Table>
                <TableBody>
                  {balance.liab.map((r) => <TableRow key={r.id}><TableCell className="font-mono w-24">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-end">{fmtMoney(r.credit - r.debit)}</TableCell></TableRow>)}
                  {balance.eq.map((r) => <TableRow key={r.id}><TableCell className="font-mono w-24">{r.code}</TableCell><TableCell>{r.name}</TableCell><TableCell className="text-end">{fmtMoney(r.credit - r.debit)}</TableCell></TableRow>)}
                  <TableRow><TableCell colSpan={2}>{t("accounting.profit")}</TableCell><TableCell className="text-end">{fmtMoney(balance.profit)}</TableCell></TableRow>
                  <TableRow className="font-bold"><TableCell colSpan={2}>{t("common.total")}</TableCell><TableCell className="text-end">{fmtMoney(balance.L + balance.E + balance.profit)}</TableCell></TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
