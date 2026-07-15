import { Button, Input, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Gift, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/loyalty")({ component: LoyaltyPage });

function LoyaltyPage() {
  const { t } = useI18n();
  const [rules, setRules] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [rule, setRule] = useState<any>({ name: "", points_per_amount: 1, amount_unit: 100, redemption_value: 1, min_redeem_points: 0 });
  const [coupon, setCoupon] = useState<any>({ code: "", discount_type: "percent", value: 10, is_active: true });

  const load = async () => {
    const [r, c] = await Promise.all([
      supabase.from("loyalty_rules").select("*").order("created_at", { ascending: false }),
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
    ]);
    setRules((r.data ?? []) as any); setCoupons((c.data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const saveRule = async () => {
    if (!rule.name) return toast.error(t("common.name"));
    const payload = {
      name: rule.name,
      points_per_amount: Number(rule.points_per_amount) || 0,
      amount_unit: Number(rule.amount_unit) || 1,
      redemption_value: Number(rule.redemption_value) || 0,
      min_redeem_points: Number(rule.min_redeem_points) || 0,
      is_active: rule.is_active ?? true,
    };
    const res = rule.id ? await supabase.from("loyalty_rules").update(payload).eq("id", rule.id) : await supabase.from("loyalty_rules").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("auth.success")); setRuleOpen(false); setRule({ name: "", points_per_amount: 1, amount_unit: 100, redemption_value: 1, min_redeem_points: 0, is_active: true }); load();
  };
  const delRule = async (id: string) => { if (!confirm(t("common.confirmDelete"))) return; await supabase.from("loyalty_rules").delete().eq("id", id); load(); };

  const saveCoupon = async () => {
    if (!coupon.code) return toast.error("code");
    const payload = {
      code: coupon.code,
      discount_type: coupon.discount_type,
      value: Number(coupon.value) || 0,
      valid_from: coupon.valid_from || null,
      valid_to: coupon.valid_to || null,
      usage_limit: coupon.usage_limit ?? null,
      min_total: coupon.min_total ?? null,
      is_active: coupon.is_active ?? true,
      description: coupon.description || null,
    };
    const res = coupon.id ? await supabase.from("coupons").update(payload).eq("id", coupon.id) : await supabase.from("coupons").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("auth.success")); setCouponOpen(false); setCoupon({ code: "", discount_type: "percent", value: 10, is_active: true }); load();
  };
  const delCoupon = async (id: string) => { if (!confirm(t("common.confirmDelete"))) return; await supabase.from("coupons").delete().eq("id", id); load(); };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <h1 className="flex items-center gap-2 text-2xl font-bold"><Gift className="h-6 w-6 text-primary" /> {t("loyalty.title")}</h1>
      <Tabs defaultValue="coupons">
        <TabsList>
          <TabsTrigger value="coupons">{t("loyalty.coupons")}</TabsTrigger>
          <TabsTrigger value="rules">{t("loyalty.rules")}</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons">
          <div className="mb-3 flex justify-end"><Button onClick={() => setCouponOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("loyalty.newCoupon")}</Button></div>
          <Card><Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>{t("common.type")}</TableHead><TableHead>Value</TableHead><TableHead>Used</TableHead><TableHead>Valid</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {coupons.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              : coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{c.discount_type}</TableCell>
                  <TableCell className="font-mono">{c.value}{c.discount_type === "percent" ? "%" : ""}</TableCell>
                  <TableCell>{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</TableCell>
                  <TableCell className="text-xs">{fmtDate(c.valid_from)} → {fmtDate(c.valid_to)}</TableCell>
                  <TableCell><Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? t("common.active") : t("common.inactive")}</Badge></TableCell>
                  <TableCell className="text-end">
                    <Button size="icon" variant="ghost" onClick={() => { setCoupon(c); setCouponOpen(true); }}>✎</Button>
                    <Button size="icon" variant="ghost" onClick={() => delCoupon(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="rules">
          <div className="mb-3 flex justify-end"><Button onClick={() => setRuleOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("loyalty.newRule")}</Button></div>
          <Card><Table>
            <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>Points/Amount</TableHead><TableHead>Unit</TableHead><TableHead>Redemption</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {rules.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
              : rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell className="font-mono">{r.points_per_amount}</TableCell>
                  <TableCell className="font-mono">{r.amount_unit}</TableCell>
                  <TableCell className="font-mono">{r.redemption_value}</TableCell>
                  <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? t("common.active") : t("common.inactive")}</Badge></TableCell>
                  <TableCell className="text-end">
                    <Button size="icon" variant="ghost" onClick={() => { setRule(r); setRuleOpen(true); }}>✎</Button>
                    <Button size="icon" variant="ghost" onClick={() => delRule(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>

      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("loyalty.newCoupon")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input value={coupon.code ?? ""} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} /></div>
            <div className="grid grid-cols-2 gap-3">
          <DialogHeader><DialogTitle>{coupon.id ? t("common.edit") : t("loyalty.newCoupon")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input value={coupon.code ?? ""} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>{t("common.type")}</Label>
                <Select value={coupon.discount_type} onValueChange={(v) => setCoupon({ ...coupon, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="percent">%</SelectItem><SelectItem value="amount">Fixed</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Value</Label><Input type="number" step="any" value={coupon.value ?? 0} onChange={(e) => setCoupon({ ...coupon, value: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Valid from</Label><Input type="date" value={coupon.valid_from?.slice(0,10) ?? ""} onChange={(e) => setCoupon({ ...coupon, valid_from: e.target.value || null })} /></div>
              <div className="space-y-1.5"><Label>Valid to</Label><Input type="date" value={coupon.valid_to?.slice(0,10) ?? ""} onChange={(e) => setCoupon({ ...coupon, valid_to: e.target.value || null })} /></div>
              <div className="space-y-1.5"><Label>Usage limit</Label><Input type="number" value={coupon.usage_limit ?? ""} onChange={(e) => setCoupon({ ...coupon, usage_limit: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="space-y-1.5"><Label>Min total</Label><Input type="number" step="any" value={coupon.min_total ?? ""} onChange={(e) => setCoupon({ ...coupon, min_total: e.target.value ? Number(e.target.value) : null })} /></div>
              <div className="space-y-1.5"><Label>{t("common.status")}</Label>
                <Select value={(coupon.is_active ?? true) ? "active" : "inactive"} onValueChange={(v) => setCoupon({ ...coupon, is_active: v === "active" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">{t("common.active")}</SelectItem><SelectItem value="inactive">{t("common.inactive")}</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCouponOpen(false)}>{t("common.cancel")}</Button><Button onClick={saveCoupon}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{rule.id ? t("common.edit") : t("loyalty.newRule")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("common.name")} *</Label><Input value={rule.name} onChange={(e) => setRule({ ...rule, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Points earned</Label><Input type="number" step="any" value={rule.points_per_amount} onChange={(e) => setRule({ ...rule, points_per_amount: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Per amount</Label><Input type="number" step="any" value={rule.amount_unit} onChange={(e) => setRule({ ...rule, amount_unit: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Redemption value</Label><Input type="number" step="any" value={rule.redemption_value} onChange={(e) => setRule({ ...rule, redemption_value: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Min redeem</Label><Input type="number" step="any" value={rule.min_redeem_points} onChange={(e) => setRule({ ...rule, min_redeem_points: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setRuleOpen(false)}>{t("common.cancel")}</Button><Button onClick={saveRule}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
