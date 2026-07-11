import { Button, Input, Card, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Tags, Trash2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pricing")({ component: PricingPage });

function PricingPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [itemOpen, setItemOpen] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState<any>({ name: "", customer_type: "retail" });
  const [item, setItem] = useState<any>({ product_id: "", min_qty: 1, unit_price: 0, discount_percent: 0 });

  const load = async () => {
    const [pl, pr] = await Promise.all([
      supabase.from("price_lists").select("*").order("created_at", { ascending: false }),
      supabase.from("products").select("id,name,selling_price"),
    ]);
    setRows((pl.data ?? []) as any); setProducts((pr.data ?? []) as any);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.name) return toast.error(t("common.name"));
    const res = form.id ? await supabase.from("price_lists").update(form).eq("id", form.id) : await supabase.from("price_lists").insert(form);
    if (res.error) return toast.error(res.error.message);
    toast.success(t("auth.success")); setOpen(false); setForm({ name: "", customer_type: "retail" }); load();
  };
  const del = async (id: string) => { if (!confirm(t("common.confirmDelete"))) return; await supabase.from("price_lists").delete().eq("id", id); load(); };

  const view = async (pl: any) => {
    setDetail(pl);
    const { data } = await supabase.from("price_list_items").select("*, products(name)").eq("price_list_id", pl.id);
    setItems((data ?? []) as any);
  };

  const addItem = async () => {
    if (!item.product_id || !detail) return;
    const { error } = await supabase.from("price_list_items").insert({ ...item, price_list_id: detail.id });
    if (error) return toast.error(error.message);
    setItem({ product_id: "", min_qty: 1, unit_price: 0, discount_percent: 0 }); setItemOpen(false); view(detail);
  };
  const delItem = async (id: string) => { await supabase.from("price_list_items").delete().eq("id", id); if (detail) view(detail); };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold"><Tags className="h-6 w-6 text-primary" /> {t("pricing.title")}</h1>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("pricing.new")}</Button>
      </div>

      <Card><Table>
        <TableHeader><TableRow><TableHead>{t("common.name")}</TableHead><TableHead>{t("common.type")}</TableHead><TableHead>{t("common.status")}</TableHead><TableHead className="text-end">{t("common.actions")}</TableHead></TableRow></TableHeader>
        <TableBody>
          {rows.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
          : rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell>{r.customer_type ? t(`customers.type.${r.customer_type}`) : "—"}</TableCell>
              <TableCell><Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? t("common.active") : t("common.inactive")}</Badge></TableCell>
              <TableCell className="text-end">
                <Button size="icon" variant="ghost" onClick={() => view(r)}><Eye className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table></Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("pricing.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("common.name")} *</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>{t("common.type")}</Label>
              <Select value={form.customer_type ?? "retail"} onValueChange={(v) => setForm({ ...form, customer_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{(["retail","wholesale","semi_wholesale","vip"] as const).map((v) => <SelectItem key={v} value={v}>{t(`customers.type.${v}`)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Valid from</Label><Input type="date" value={form.valid_from ?? ""} onChange={(e) => setForm({ ...form, valid_from: e.target.value || null })} /></div>
              <div className="space-y-1.5"><Label>Valid to</Label><Input type="date" value={form.valid_to ?? ""} onChange={(e) => setForm({ ...form, valid_to: e.target.value || null })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button><Button onClick={save}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{detail?.name} — {t("pricing.items")}</DialogTitle></DialogHeader>
          <div className="mb-2 flex justify-end"><Button size="sm" onClick={() => setItemOpen(true)}><Plus className="me-1 h-4 w-4" /> {t("common.add")}</Button></div>
          <Table><TableHeader><TableRow><TableHead>{t("nav.products")}</TableHead><TableHead>Min Qty</TableHead><TableHead>{t("common.price")}</TableHead><TableHead>Discount %</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>{items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            : items.map((i) => <TableRow key={i.id}><TableCell>{i.products?.name ?? "—"}</TableCell><TableCell>{i.min_qty}</TableCell><TableCell className="font-mono">{fmtMoney(i.unit_price)}</TableCell><TableCell>{i.discount_percent}%</TableCell><TableCell><Button size="icon" variant="ghost" onClick={() => delItem(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell></TableRow>)}</TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.add")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>{t("nav.products")}</Label>
              <Select value={item.product_id} onValueChange={(v) => setItem({ ...item, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label>Min Qty</Label><Input type="number" step="any" value={item.min_qty} onChange={(e) => setItem({ ...item, min_qty: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>{t("common.price")}</Label><Input type="number" step="any" value={item.unit_price} onChange={(e) => setItem({ ...item, unit_price: Number(e.target.value) })} /></div>
              <div className="space-y-1.5"><Label>Discount %</Label><Input type="number" step="any" value={item.discount_percent} onChange={(e) => setItem({ ...item, discount_percent: Number(e.target.value) })} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setItemOpen(false)}>{t("common.cancel")}</Button><Button onClick={addItem}>{t("common.save")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
