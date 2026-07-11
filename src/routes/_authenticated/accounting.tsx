import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet, BookOpen, FileText, ScrollText, Banknote,
  PiggyBank, Building, Receipt, TrendingUp, BarChart3, Percent, CalendarRange,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/accounting")({ component: AccountingHub });

function AccountingHub() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ revenue: 0, expenses: 0, cash: 0, bank: 0 });

  useEffect(() => {
    (async () => {
      const [rev, exp, cash, bank] = await Promise.all([
        (supabase as any).from("journal_lines").select("credit,accounts!inner(type)").eq("accounts.type","revenue"),
        (supabase as any).from("journal_lines").select("debit,accounts!inner(type)").eq("accounts.type","expense"),
        (supabase as any).from("cash_boxes").select("balance"),
        (supabase as any).from("bank_accounts").select("balance"),
      ]);
      reportSupabaseErrors("المحاسبة", rev, exp, cash, bank);
      setKpi({
        revenue: (rev.data ?? []).reduce((s: number, r: any) => s + Number(r.credit ?? 0), 0),
        expenses: (exp.data ?? []).reduce((s: number, r: any) => s + Number(r.debit ?? 0), 0),
        cash: (cash.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0),
        bank: (bank.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0),
      });
    })();
  }, []);

  const cards = [
    { to: "/accounting/chart",   icon: BookOpen,     label: t("acc.chart") },
    { to: "/accounting/journal", icon: FileText,     label: t("acc.journal") },
    { to: "/accounting/ledger",  icon: ScrollText,   label: t("acc.ledger") },
    { to: "/accounting/reports", icon: BarChart3,    label: t("acc.reports") },
    { to: "/accounting/taxes",   icon: Percent,      label: t("acc.taxes") },
    { to: "/accounting/periods", icon: CalendarRange, label: t("acc.periods") },
    { to: "/cash-boxes",         icon: PiggyBank,    label: t("acc.cashBoxes") },
    { to: "/banks",              icon: Building,     label: t("acc.banks") },
    { to: "/checks",             icon: Receipt,      label: t("acc.checks") },
  ];

  const profit = kpi.revenue - kpi.expenses;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("accounting.title")}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("accounting.revenue")}  value={fmtMoney(kpi.revenue)} icon={TrendingUp} tint="text-emerald-500" />
        <Kpi label={t("accounting.expenses")} value={fmtMoney(kpi.expenses)} icon={TrendingUp} tint="text-rose-500" />
        <Kpi label={t("accounting.profit")}   value={fmtMoney(profit)} icon={Wallet} tint={profit >= 0 ? "text-emerald-500" : "text-rose-500"} />
        <Kpi label={t("acc.cashAndBank")}     value={fmtMoney(kpi.cash + kpi.bank)} icon={Banknote} tint="text-primary" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.to} to={c.to}>
            <Card className="flex cursor-pointer flex-col items-center gap-2 p-5 transition hover:shadow-md">
              <c.icon className="h-8 w-8 text-primary" />
              <div className="text-sm font-medium">{c.label}</div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, tint }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${tint}`} />
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </Card>
  );
}
