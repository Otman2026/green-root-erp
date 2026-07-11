import { Card } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { reportSupabaseErrors } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_authenticated/dashboards/finance")({ component: FinanceDashboard });

function FinanceDashboard() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ cash: 0, bank: 0, debtsC: 0, debtsS: 0, revenue: 0, expenses: 0 });
  const [cashflow, setCashflow] = useState<{ day: string; in: number; out: number }[]>([]);
  const [byBox, setByBox] = useState<{ name: string; balance: number }[]>([]);

  useEffect(() => {
    (async () => {
      const from = new Date(); from.setDate(from.getDate()-29); from.setHours(0,0,0,0);
      const [boxes, banks, dC, dS, moves, recs] = await Promise.all([
        supabase.from("cash_boxes").select("name,balance"),
        supabase.from("bank_accounts").select("name,balance"),
        supabase.from("customers").select("balance").gt("balance",0),
        supabase.from("suppliers").select("balance").gt("balance",0),
        supabase.from("cash_movements").select("amount,direction,created_at").gte("created_at", from.toISOString()),
        supabase.from("receipts").select("amount,direction,received_at").gte("received_at", from.toISOString()),
      ]);
      reportSupabaseErrors("المالية", boxes, banks, dC, dS, moves, recs);
      const cash = (boxes.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      const bank = (banks.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      const debtsC = (dC.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      const debtsS = (dS.data ?? []).reduce((s: number, r: any) => s + Number(r.balance ?? 0), 0);
      let revenue = 0, expenses = 0;
      const byDay: Record<string, { in: number; out: number }> = {};
      for (let i = 0; i < 30; i++) { const d = new Date(from); d.setDate(from.getDate()+i); byDay[d.toISOString().slice(5,10)] = { in: 0, out: 0 }; }
      (moves.data ?? []).concat((recs.data ?? []).map((r: any) => ({ ...r, created_at: r.received_at }))).forEach((m: any) => {
        const k = new Date(m.created_at).toISOString().slice(5,10);
        if (!byDay[k]) return;
        const amt = Number(m.amount ?? 0);
        if (m.direction === "in") { byDay[k].in += amt; revenue += amt; } else { byDay[k].out += amt; expenses += amt; }
      });
      setKpi({ cash, bank, debtsC, debtsS, revenue, expenses });
      setCashflow(Object.entries(byDay).map(([day, v]) => ({ day, ...v })));
      setByBox([...(boxes.data ?? []).map((b: any) => ({ name: b.name, balance: Number(b.balance ?? 0) })), ...(banks.data ?? []).map((b: any) => ({ name: b.name, balance: Number(b.balance ?? 0) }))]);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("dash.finance.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi label={t("dash.finance.cash")} value={fmtMoney(kpi.cash)} />
        <Kpi label={t("dash.finance.bank")} value={fmtMoney(kpi.bank)} />
        <Kpi label={t("dash.finance.net")} value={fmtMoney(kpi.cash + kpi.bank)} />
        <Kpi label={t("dash.finance.revenue30")} value={fmtMoney(kpi.revenue)} />
        <Kpi label={t("dash.finance.expenses30")} value={fmtMoney(kpi.expenses)} />
        <Kpi label={t("dash.finance.debts")} value={`+${fmtMoney(kpi.debtsC)} / -${fmtMoney(kpi.debtsS)}`} />
      </div>
      <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.finance.cashflow")}</h3>
        <div className="h-64"><ResponsiveContainer><LineChart data={cashflow}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="day" fontSize={11}/><YAxis fontSize={11}/><Tooltip/><Legend/><Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2}/><Line type="monotone" dataKey="out" stroke="#ef4444" strokeWidth={2}/></LineChart></ResponsiveContainer></div>
      </Card>
      <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.finance.accounts")}</h3>
        <div className="h-64"><ResponsiveContainer><BarChart data={byBox}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="name" fontSize={10}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="balance" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="card-elevated p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></Card>;
}
