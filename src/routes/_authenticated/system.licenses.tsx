import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/system/licenses")({
  component: LicensesPage,
});

function LicensesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [orgs, setOrgs] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [orgId, setOrgId] = useState("");
  const [planId, setPlanId] = useState("");

  const load = async () => {
    const [{ data: l }, { data: o }, { data: p }] = await Promise.all([
      supabase.from("licenses").select("*, organizations(name), plans(name, code)").order("created_at", { ascending: false }),
      supabase.from("organizations").select("id, name").order("name"),
      supabase.from("plans").select("id, name, code").eq("is_active", true).order("sort_order"),
    ]);
    setRows(l ?? []); setOrgs(o ?? []); setPlans(p ?? []);
  };
  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!orgId || !planId) return toast.error("اختر المؤسسة والخطة");
    const plan = plans.find((x) => x.id === planId);
    const days = plan?.code === "monthly" ? 30 : plan?.code === "semi" ? 180 : plan?.code === "trial" ? 15 : 365;
    const { data: key } = await supabase.rpc("generate_license_key");
    const { error } = await supabase.from("licenses").insert({
      organization_id: orgId,
      plan_id: planId,
      license_key: key,
      status: "active",
      is_trial: plan?.code === "trial",
      expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) toast.error(error.message);
    else { toast.success("تم إنشاء الترخيص"); load(); }
  };

  const extend = async (id: string, days: number) => {
    const row = rows.find((r) => r.id === id);
    const base = row?.expires_at ? new Date(row.expires_at) : new Date();
    const next = new Date(Math.max(base.getTime(), Date.now()) + days * 86400000).toISOString();
    const { error } = await supabase.from("licenses").update({ expires_at: next, status: "active" }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم التمديد"); load(); }
  };

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("licenses").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
          <Select value={orgId} onValueChange={setOrgId}>
            <SelectTrigger><SelectValue placeholder="المؤسسة" /></SelectTrigger>
            <SelectContent>{orgs.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={planId} onValueChange={setPlanId}>
            <SelectTrigger><SelectValue placeholder="الخطة" /></SelectTrigger>
            <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={generate}>إنشاء ترخيص</Button>
        </div>
      </Card>
      <Card className="p-4">
        <table className="w-full text-sm">
          <thead className="border-b text-right text-muted-foreground">
            <tr>
              <th className="py-2">المفتاح</th><th>المؤسسة</th><th>الخطة</th><th>الحالة</th><th>الانتهاء</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const expired = r.expires_at && new Date(r.expires_at) < new Date();
              return (
                <tr key={r.id} className="border-b">
                  <td className="py-2 font-mono text-xs">{r.license_key}</td>
                  <td>{r.organizations?.name}</td>
                  <td>{r.plans?.name} {r.is_trial && <Badge variant="outline" className="mx-1">Trial</Badge>}</td>
                  <td><Badge variant={r.status === "active" && !expired ? "default" : "destructive"}>{expired ? "منتهي" : r.status}</Badge></td>
                  <td className="text-xs">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => extend(r.id, 30)}>+30ي</Button>
                    <Button size="sm" variant="outline" onClick={() => extend(r.id, 365)}>+سنة</Button>
                    {r.status === "active"
                      ? <Button size="sm" variant="destructive" onClick={() => setStatus(r.id, "suspended")}>إيقاف</Button>
                      : <Button size="sm" onClick={() => setStatus(r.id, "active")}>تفعيل</Button>}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">لا توجد تراخيص</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
