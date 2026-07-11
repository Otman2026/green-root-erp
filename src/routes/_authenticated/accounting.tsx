import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Wallet, TrendingUp, TrendingDown, CircleDollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney, fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/accounting")({ component: AccountingPage });

function AccountingPage() {
  const { t } = useI18n();
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [debtsC, setDebtsC] = useState(0);
  const [debtsS, setDebtsS] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [s, po, c, sup, rs, rr] = await Promise.all([
        supabase.from("sales").select("total").eq("type", "sale").neq("status", "void"),
        supabase.from("purchase_orders").select("total").in("status", ["received","invoiced","closed"]),
        supabase.from("customers").select("balance").gt("balance", 0),
        supabase.from("suppliers").select("balance").gt("balance", 0),
        supabase.from("sales").select("*").eq("type", "sale").neq("status", "void").order("created_at", { ascending: false }).limit(10),
        supabase.from("receipts").select("*").order("received_at", { ascending: false }).limit(10),
      ]);
      setRevenue((s.data ?? []).reduce((sum: number, r: any) => sum + Number(r.total ?? 0), 0));
      setExpenses((po.data ?? []).reduce((sum: number, r: any) => sum + Number(r.total ?? 0), 0));
      setDebtsC((c.data ?? []).reduce((sum: number, r: any) => sum + Number(r.balance ?? 0), 0));
      setDebtsS((sup.data ?? []).reduce((sum: number, r: any) => sum + Number(r.balance ?? 0), 0));
      setRecentSales((rs.data ?? []) as any); setRecentReceipts((rr.data ?? []) as any);
    })();
  }, []);

  const profit = revenue - expenses;

  const cards = [
    { icon: TrendingUp, tk: "accounting.revenue", val: revenue, color: "text-primary" },
    { icon: TrendingDown, tk: "accounting.expenses", val: expenses, color: "text-destructive" },
    { icon: Wallet, tk: "accounting.profit", val: profit, color: profit >= 0 ? "text-primary" : "text-destructive" },
    { icon: CircleDollarSign, tk: "accounting.debts.customers", val: debtsC, color: "text-destructive" },
    { icon: CircleDollarSign, tk: "accounting.debts.suppliers", val: debtsS, color: "text-destructive" },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Wallet className="h-6 w-6 text-primary" /> {t("accounting.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.tk} className="p-4">
              <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{t(c.tk)}</span><Icon className={`h-4 w-4 ${c.color}`} /></div>
              <div className={`mt-2 text-xl font-bold ${c.color}`}>{fmtMoney(c.val)}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">{t("sales.title")}</h3>
          <Table><TableHeader><TableRow><TableHead>{t("sales.invoiceNo")}</TableHead><TableHead>{t("common.date")}</TableHead><TableHead>{t("common.total")}</TableHead></TableRow></TableHeader>
            <TableBody>{recentSales.map((s) => <TableRow key={s.id}><TableCell className="font-mono">{s.invoice_no}</TableCell><TableCell className="text-xs">{fmtDateTime(s.created_at)}</TableCell><TableCell className="font-mono">{fmtMoney(s.total)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Card>
        <Card className="p-4">
          <h3 className="mb-2 font-semibold">{t("receipts.title")}</h3>
          <Table><TableHeader><TableRow><TableHead>{t("receipts.no")}</TableHead><TableHead>{t("common.type")}</TableHead><TableHead>{t("receipts.amount")}</TableHead></TableRow></TableHeader>
            <TableBody>{recentReceipts.map((r) => <TableRow key={r.id}><TableCell className="font-mono">{r.receipt_no}</TableCell><TableCell>{t(`receipts.${r.direction}`)}</TableCell><TableCell className="font-mono">{fmtMoney(r.amount)}</TableCell></TableRow>)}</TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
