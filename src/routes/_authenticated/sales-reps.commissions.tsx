import { Card, Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge, Progress } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TrendingUp, RefreshCw, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/sales-reps/commissions")({ component: CommissionsPage });

function CommissionsPage() {
  const { t } = useI18n();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows, setRows] = useState<any[]>([]);

  async function load() {
    const { data } = await supabase.from("sales_commissions")
      .select("*, sales_reps(full_name,commission_rate,monthly_target)")
      .eq("period_year", year).eq("period_month", month)
      .order("commission_amount", { ascending: false });
    setRows(data ?? []);
  }
  useEffect(() => { load(); }, [year, month]);

  async function generate() {
    const { data: reps } = await supabase.from("sales_reps").select("id,commission_rate,monthly_target").eq("status", "active");
    if (!reps?.length) { toast.error(t("reps.noReps")); return; }
    const from = `${year}-${String(month).padStart(2, "0")}-01`;
    const toD = new Date(year, month, 0, 23, 59, 59).toISOString();

    const { data: sales } = await supabase
      .from("sales")
      .select("sales_rep_id,total")
      .gte("created_at", from).lte("created_at", toD)
      .not("sales_rep_id", "is", null);

    const totals: Record<string, number> = {};
    (sales ?? []).forEach((s: any) => {
      totals[s.sales_rep_id] = (totals[s.sales_rep_id] ?? 0) + Number(s.total ?? 0);
    });

    const rows = reps.map((r: any) => {
      const st = totals[r.id] ?? 0;
      const rate = Number(r.commission_rate ?? 0);
      const target = Number(r.monthly_target ?? 0);
      return {
        rep_id: r.id, period_year: year, period_month: month,
        sales_total: st,
        commission_rate: rate,
        commission_amount: st * rate / 100,
        target,
        achievement_pct: target > 0 ? Math.min(100, (st / target) * 100) : 0,
        status: "draft",
      };
    });

    const { error } = await supabase.from("sales_commissions").upsert(rows, { onConflict: "rep_id,period_year,period_month" });
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved")); load();
  }

  async function markPaid(id: string) {
    const { error } = await supabase.from("sales_commissions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  const totalCommission = rows.reduce((s, r) => s + Number(r.commission_amount ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2"><TrendingUp className="h-6 w-6" /><h1 className="text-2xl font-bold">{t("reps.commissions")}</h1></div>
        <div className="flex items-center gap-2">
          <Label>{t("hr.pay.year")}</Label>
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24" />
          <Label>{t("hr.pay.month")}</Label>
          <Input type="number" min={1} max={12} value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-20" />
          <Button onClick={generate}><RefreshCw className="h-4 w-4 me-1" />{t("hr.pay.generate")}</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="text-sm text-muted-foreground">{t("reps.totalCommission")}</div>
        <div className="text-2xl font-bold">{totalCommission.toLocaleString()}</div>
      </Card>

      <Card>
        <Table>
          <TableHeader><TableRow>
            <TableHead>{t("reps.rep")}</TableHead>
            <TableHead>{t("reps.salesTotal")}</TableHead>
            <TableHead>{t("reps.commissionRate")}</TableHead>
            <TableHead>{t("reps.commissionAmount")}</TableHead>
            <TableHead>{t("reps.achievement")}</TableHead>
            <TableHead>{t("hr.pay.status")}</TableHead>
            <TableHead></TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.sales_reps?.full_name}</TableCell>
                <TableCell>{Number(r.sales_total).toLocaleString()}</TableCell>
                <TableCell>{Number(r.commission_rate)}%</TableCell>
                <TableCell className="font-bold">{Number(r.commission_amount).toLocaleString()}</TableCell>
                <TableCell className="min-w-40">
                  <div className="flex items-center gap-2">
                    <Progress value={Number(r.achievement_pct)} className="h-2" />
                    <span className="text-xs">{Number(r.achievement_pct).toFixed(0)}%</span>
                  </div>
                </TableCell>
                <TableCell><Badge variant={r.status === "paid" ? "default" : "secondary"}>{t(`hr.pay.st.${r.status}`)}</Badge></TableCell>
                <TableCell className="text-end">
                  {r.status !== "paid" && <Button size="sm" variant="ghost" onClick={() => markPaid(r.id)}><CheckCircle className="h-4 w-4 me-1" />{t("hr.pay.markPaid")}</Button>}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">{t("hr.pay.noPayroll")}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
