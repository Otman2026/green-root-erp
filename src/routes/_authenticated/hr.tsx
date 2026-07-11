import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, CalendarCheck, CalendarX, Wallet, FileText, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr")({ component: HRHub });

function HRHub() {
  const { t } = useI18n();
  const [kpi, setKpi] = useState({ employees: 0, present: 0, leaves: 0, payroll: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0, 10);
      const now = new Date();
      const [emp, att, lv, pay] = await Promise.all([
        (supabase as any).from("hr_employees").select("id", { count: "exact", head: true }).eq("status", "active"),
        (supabase as any).from("hr_attendance").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "present"),
        (supabase as any).from("hr_leaves").select("id", { count: "exact", head: true }).eq("status", "pending"),
        (supabase as any).from("hr_payroll").select("net_pay").eq("period_year", now.getFullYear()).eq("period_month", now.getMonth() + 1),
      ]);
      setKpi({
        employees: emp.count ?? 0,
        present: att.count ?? 0,
        leaves: lv.count ?? 0,
        payroll: (pay.data ?? []).reduce((s: number, r: any) => s + Number(r.net_pay ?? 0), 0),
      });
    })();
  }, []);

  const cards = [
    { to: "/hr/employees",  icon: Users,         label: t("hr.employees") },
    { to: "/hr/attendance", icon: CalendarCheck, label: t("hr.attendance") },
    { to: "/hr/leaves",     icon: CalendarX,     label: t("hr.leaves") },
    { to: "/hr/payroll",    icon: Wallet,        label: t("hr.payroll") },
    { to: "/hr/documents",  icon: FileText,      label: t("hr.documents") },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Briefcase className="h-6 w-6" />
        <h1 className="text-2xl font-bold">{t("hr.title")}</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label={t("hr.kpi.employees")} value={String(kpi.employees)} icon={Users} />
        <Kpi label={t("hr.kpi.presentToday")} value={String(kpi.present)} icon={CalendarCheck} />
        <Kpi label={t("hr.kpi.pendingLeaves")} value={String(kpi.leaves)} icon={CalendarX} />
        <Kpi label={t("hr.kpi.monthPayroll")} value={kpi.payroll.toLocaleString()} icon={Wallet} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
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

function Kpi({ label, value, icon: Icon }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-2 text-xl font-bold">{value}</div>
    </Card>
  );
}
