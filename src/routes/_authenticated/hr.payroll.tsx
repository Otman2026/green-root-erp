import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wallet, RefreshCw, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/hr/payroll")({ component: PayrollPage });

function PayrollPage() {
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase.from("hr_payroll")
      .select("*, hr_employees(full_name,code,base_salary)")
      .eq("period_year", year).eq("period_month", month)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, [year, month]);

  async function generate() {
    const { data: emps } = await supabase.from("hr_employees").select("id,base_salary").eq("status", "active");
    if (!emps?.length) { toast.error(t("hr.pay.noEmployees")); return; }
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const toD = new Date(year, month, 0).toISOString().slice(0, 10);

    const [{ data: bonuses }, { data: att }] = await Promise.all([
      supabase.from("hr_bonuses").select("employee_id,type,amount").gte("date", from).lte("date", toD),
      supabase.from("hr_attendance").select("employee_id,overtime").gte("date", from).lte("date", toD),
    ]);

    const bonusMap: Record<string, number> = {};
    const dedMap: Record<string, number> = {};
    (bonuses ?? []).forEach((b: any) => {
      if (b.type === "deduction" || b.type === "advance") dedMap[b.employee_id] = (dedMap[b.employee_id] ?? 0) + Number(b.amount);
      else bonusMap[b.employee_id] = (bonusMap[b.employee_id] ?? 0) + Number(b.amount);
    });
    const otMap: Record<string, number> = {};
    (att ?? []).forEach((a: any) => { otMap[a.employee_id] = (otMap[a.employee_id] ?? 0) + Number(a.overtime ?? 0); });

    const rows = emps.map((e: any) => {
      const base = Number(e.base_salary ?? 0);
      const bonus = bonusMap[e.id] ?? 0;
      const ded = dedMap[e.id] ?? 0;
      const ot = otMap[e.id] ?? 0;
      const otPay = (base / 200) * ot;
      const net = base + bonus + otPay - ded;
      return {
        employee_id: e.id, period_year: year, period_month: month,
        base_salary: base, bonuses: bonus, overtime: otPay,
        allowances: 0, deductions: ded, advances: 0, tax: 0, social: 0,
        net_pay: net, status: "draft",
      };
    });

    const { error } = await supabase.from("hr_payroll").upsert(rows, { onConflict: "employee_id,period_year,period_month" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved")); load();
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("hr_payroll").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const total = rows.reduce((s, r) => s + Number(r.net_pay ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><Wallet className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("hr.payroll")}</h1></div>
        <div className="flex items-center gap-2">
          <Label>{t("hr.pay.year")}</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24" />
          <Label>{t("hr.pay.month")}</Label>
          <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-20" />
          <Button onClick={generate}><RefreshCw className="h-4 w-4 me-1" />{t("hr.pay.generate")}</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t("hr.pay.totalNet")}</div>
        <div className="text-2xl font-bold">{total.toLocaleString()}</div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("hr.emp.fullName")}</TableHead>
              <TableHead>{t("hr.pay.base")}</TableHead>
              <TableHead>{t("hr.pay.bonuses")}</TableHead>
              <TableHead>{t("hr.pay.overtime")}</TableHead>
              <TableHead>{t("hr.pay.deductions")}</TableHead>
              <TableHead>{t("hr.pay.net")}</TableHead>
              <TableHead>{t("hr.pay.status")}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.hr_employees?.full_name}</TableCell>
                <TableCell>{Number(r.base_salary).toLocaleString()}</TableCell>
                <TableCell>{Number(r.bonuses).toLocaleString()}</TableCell>
                <TableCell>{Number(r.overtime).toLocaleString()}</TableCell>
                <TableCell>{Number(r.deductions).toLocaleString()}</TableCell>
                <TableCell className="font-bold">{Number(r.net_pay).toLocaleString()}</TableCell>
                <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{t(`hr.pay.st.${r.status}`)}</Badge></TableCell>
                <TableCell className="text-end">
                  {r.status !== "paid" && <Button size="sm" variant="ghost" onClick={() => markPaid(r.id)}><CheckCircle className="h-4 w-4 me-1" />{t("hr.pay.markPaid")}</Button>}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{t("hr.pay.noPayroll")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
