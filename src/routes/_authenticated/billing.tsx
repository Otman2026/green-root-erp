import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CreditCard, Plus, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRoles } from "@/hooks/use-roles";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({ component: BillingPage });

function BillingPage() {
  const { t } = useI18n();
  const { isAdmin } = useRoles();
  const [plans, setPlans] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openPlan, setOpenPlan] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [openSub, setOpenSub] = useState(false);
  const [newSub, setNewSub] = useState<any>({ user_id: "", plan_id: "", billing_cycle: "monthly", status: "active" });
  const [users, setUsers] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: pl }, { data: sb }, { data: pr }] = await Promise.all([
      supabase.from("plans").select("*").order("sort_order"),
      supabase.from("subscriptions").select("*, plan:plan_id(name,code), profile:user_id(full_name,username)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name,username").order("full_name"),
    ]);
    setPlans(pl ?? []);
    setSubs(sb ?? []);
    setUsers(pr ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const savePlan = async () => {
    if (!editPlan?.code || !editPlan?.name) return toast.error(t("common.done"));
    const payload = {
      code: editPlan.code, name: editPlan.name, description: editPlan.description || null,
      price_monthly: Number(editPlan.price_monthly) || 0, price_yearly: Number(editPlan.price_yearly) || 0,
      currency: editPlan.currency || "MAD",
      features: (typeof editPlan.features === "string" ? editPlan.features.split("\n").filter(Boolean) : editPlan.features) ?? [],
      max_users: editPlan.max_users ? Number(editPlan.max_users) : null,
      is_active: editPlan.is_active ?? true,
      sort_order: Number(editPlan.sort_order) || 0,
    };
    const { error } = editPlan.id
      ? await supabase.from("plans").update(payload).eq("id", editPlan.id)
      : await supabase.from("plans").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(t("common.done"));
    setOpenPlan(false); setEditPlan(null); load();
  };

  const delPlan = async (id: string) => { if (!confirm("?")) return; await supabase.from("plans").delete().eq("id", id); load(); };

  const saveSub = async () => {
    if (!newSub.user_id || !newSub.plan_id) return toast.error(t("common.done"));
    const { error } = await supabase.from("subscriptions").insert(newSub);
    if (error) return toast.error(error.message);
    toast.success(t("common.done"));
    setOpenSub(false); setNewSub({ user_id: "", plan_id: "", billing_cycle: "monthly", status: "active" }); load();
  };

  const setSubStatus = async (id: string, status: string) => {
    await supabase.from("subscriptions").update({ status: status as any }).eq("id", id); load();
  };

  const statusColor = (s: string) =>
    s === "active" ? "default" : s === "trial" ? "secondary" : s === "past_due" ? "outline" : "destructive";

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><CreditCard className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("bill.title")}</h1></div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /></Button>
      </div>

      <Tabs defaultValue="plans">
        <TabsList>
          <TabsTrigger value="plans">{t("bill.plans")}</TabsTrigger>
          {isAdmin && <TabsTrigger value="subs">{t("bill.subs")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="plans" className="mt-4">
          <div className="mb-3 flex justify-end">
            {isAdmin && <Button size="sm" onClick={() => { setEditPlan({ is_active: true, currency: "MAD", features: "" }); setOpenPlan(true); }}><Plus className="h-4 w-4" /> {t("bill.newPlan")}</Button>}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((p) => (
              <Card key={p.id} className={"p-5 " + (p.is_active ? "" : "opacity-60")}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <Badge variant="outline">{p.code}</Badge>
                </div>
                {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{Number(p.price_monthly).toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{p.currency}/{t("bill.month")}</span>
                </div>
                <div className="text-xs text-muted-foreground">{t("bill.yearly")}: {Number(p.price_yearly).toLocaleString()} {p.currency}</div>
                <ul className="mt-4 space-y-1 text-sm">
                  {(Array.isArray(p.features) ? p.features : []).map((f: string, i: number) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /><span>{f}</span></li>
                  ))}
                </ul>
                {isAdmin && (
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditPlan({ ...p, features: (p.features ?? []).join("\n") }); setOpenPlan(true); }}>{t("common.edit") || "تعديل"}</Button>
                    <Button size="icon" variant="ghost" onClick={() => delPlan(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="subs" className="mt-4">
            <Card className="p-4">
              <div className="mb-3 flex justify-end">
                <Button size="sm" onClick={() => setOpenSub(true)}><Plus className="h-4 w-4" /> {t("bill.newSub")}</Button>
              </div>
              <div className="overflow-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>{t("bill.user")}</TableHead>
                    <TableHead>{t("bill.plan")}</TableHead>
                    <TableHead>{t("bill.cycle")}</TableHead>
                    <TableHead>{t("bill.status")}</TableHead>
                    <TableHead>{t("bill.periodEnd")}</TableHead>
                    <TableHead />
                  </TableRow></TableHeader>
                  <TableBody>
                    {subs.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm">{s.profile?.full_name || s.profile?.username || s.user_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{s.plan?.name || "—"}</TableCell>
                        <TableCell className="text-xs">{s.billing_cycle}</TableCell>
                        <TableCell><Badge variant={statusColor(s.status) as any}>{t(`bill.status.${s.status}`)}</Badge></TableCell>
                        <TableCell className="text-xs">{s.current_period_end ? fmtDate(s.current_period_end) : "—"}</TableCell>
                        <TableCell>
                          <Select value={s.status} onValueChange={(v) => setSubStatus(s.id, v)}>
                            <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["trial","active","past_due","cancelled","expired"].map((x) => <SelectItem key={x} value={x}>{t(`bill.status.${x}`)}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {subs.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground">{t("bill.emptySubs")}</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Plan editor */}
      <Dialog open={openPlan} onOpenChange={setOpenPlan}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editPlan?.id ? t("bill.editPlan") : t("bill.newPlan")}</DialogTitle></DialogHeader>
          {editPlan && (
            <div className="grid gap-3 md:grid-cols-2">
              <div><label className="text-xs text-muted-foreground">{t("bill.code")}</label><Input value={editPlan.code ?? ""} onChange={(e) => setEditPlan({ ...editPlan, code: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.name")}</label><Input value={editPlan.name ?? ""} onChange={(e) => setEditPlan({ ...editPlan, name: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">{t("bill.desc")}</label><Textarea value={editPlan.description ?? ""} onChange={(e) => setEditPlan({ ...editPlan, description: e.target.value })} rows={2} /></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.monthly")}</label><Input type="number" value={editPlan.price_monthly ?? 0} onChange={(e) => setEditPlan({ ...editPlan, price_monthly: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.yearly")}</label><Input type="number" value={editPlan.price_yearly ?? 0} onChange={(e) => setEditPlan({ ...editPlan, price_yearly: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.currency")}</label><Input value={editPlan.currency ?? "MAD"} onChange={(e) => setEditPlan({ ...editPlan, currency: e.target.value })} /></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.maxUsers")}</label><Input type="number" value={editPlan.max_users ?? ""} onChange={(e) => setEditPlan({ ...editPlan, max_users: e.target.value })} /></div>
              <div className="md:col-span-2"><label className="text-xs text-muted-foreground">{t("bill.features")}</label><Textarea rows={4} value={editPlan.features ?? ""} onChange={(e) => setEditPlan({ ...editPlan, features: e.target.value })} placeholder={"ميزة في كل سطر"} /></div>
              <div className="flex items-center gap-2"><Switch checked={!!editPlan.is_active} onCheckedChange={(v) => setEditPlan({ ...editPlan, is_active: v })} /><span className="text-sm">{t("bill.active")}</span></div>
              <div><label className="text-xs text-muted-foreground">{t("bill.sort")}</label><Input type="number" value={editPlan.sort_order ?? 0} onChange={(e) => setEditPlan({ ...editPlan, sort_order: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPlan(false)}>{t("xfer.cancel")}</Button>
            <Button onClick={savePlan}>{t("xfer.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New subscription */}
      <Dialog open={openSub} onOpenChange={setOpenSub}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("bill.newSub")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">{t("bill.user")}</label>
              <Select value={newSub.user_id} onValueChange={(v) => setNewSub({ ...newSub, user_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name || u.username}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("bill.plan")}</label>
              <Select value={newSub.plan_id} onValueChange={(v) => setNewSub({ ...newSub, plan_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{plans.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">{t("bill.cycle")}</label>
                <Select value={newSub.billing_cycle} onValueChange={(v) => setNewSub({ ...newSub, billing_cycle: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="monthly">{t("bill.month")}</SelectItem><SelectItem value="yearly">{t("bill.yearly")}</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{t("bill.status")}</label>
                <Select value={newSub.status} onValueChange={(v) => setNewSub({ ...newSub, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["trial","active","past_due","cancelled","expired"].map((x) => <SelectItem key={x} value={x}>{t(`bill.status.${x}`)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenSub(false)}>{t("xfer.cancel")}</Button>
            <Button onClick={saveSub}>{t("xfer.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
