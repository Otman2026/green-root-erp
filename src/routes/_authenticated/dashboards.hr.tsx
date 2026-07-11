import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { fmtMoney } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/dashboards/hr")({ component: HRDashboard });

const COLORS = ["hsl(var(--primary))", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function HRDashboard() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ employees: 0, present: 0, onLeave: 0, payroll: 0 });
  const [byDept, setByDept] = useState<{ name: string; value: number }[]>([]);
  const [attendance30, setAttendance30] = useState<{ day: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      const from = new Date(); from.setDate(from.getDate()-29); from.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      const [emps, atts, leaves, pay] = await Promise.all([
        supabase.from("hr_employees").select("id,department_id,hr_departments(name)"),
        supabase.from("hr_attendance").select("date").gte("date", from.toISOString().slice(0,10)),
        supabase.from("hr_leaves").select("id,start_date,end_date,status").eq("status","approved"),
        supabase.from("hr_payroll").select("net_pay").gte("period_start", new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10)),
      ]);
      const edata = emps.data ?? [];
      const todayStr = today.toISOString().slice(0,10);
      const presentToday = (atts.data ?? []).filter((a: any) => a.date === todayStr).length;
      const onLeave = (leaves.data ?? []).filter((l: any) => l.start_date <= todayStr && l.end_date >= todayStr).length;
      const payroll = (pay.data ?? []).reduce((s: number, r: any) => s + Number(r.net_pay ?? 0), 0);
      setKpi({ employees: edata.length, present: presentToday, onLeave, payroll });

      const dmap: Record<string, number> = {};
      edata.forEach((e: any) => { const n = e.hr_departments?.name ?? "—"; dmap[n] = (dmap[n] ?? 0) + 1; });
      setByDept(Object.entries(dmap).map(([name, value]) => ({ name, value })));

      const byDay: Record<string, number> = {};
      for (let i = 0; i < 30; i++) { const d = new Date(from); d.setDate(from.getDate()+i); byDay[d.toISOString().slice(5,10)] = 0; }
      (atts.data ?? []).forEach((a: any) => { const k = new Date(a.date).toISOString().slice(5,10); if (k in byDay) byDay[k]++; });
      setAttendance30(Object.entries(byDay).map(([day, count]) => ({ day, count })));
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">{t("dash.hr.title")}</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label={t("dash.hr.employees")} value={String(kpi.employees)} />
        <Kpi label={t("dash.hr.presentToday")} value={String(kpi.present)} />
        <Kpi label={t("dash.hr.onLeave")} value={String(kpi.onLeave)} />
        <Kpi label={t("dash.hr.payrollMonth")} value={fmtMoney(kpi.payroll)} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.hr.byDept")}</h3>
          <div className="h-64"><ResponsiveContainer><PieChart><Pie data={byDept} dataKey="value" nameKey="name" outerRadius={80} label>{byDept.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}</Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-4"><h3 className="mb-3 text-sm font-semibold">{t("dash.hr.attendance30")}</h3>
          <div className="h-64"><ResponsiveContainer><BarChart data={attendance30}><CartesianGrid strokeDasharray="3 3" opacity={0.2}/><XAxis dataKey="day" fontSize={10}/><YAxis fontSize={11}/><Tooltip/><Bar dataKey="count" fill="hsl(var(--primary))"/></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return <Card className="card-elevated p-4"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-2 text-xl font-bold">{value}</div></Card>;
}
