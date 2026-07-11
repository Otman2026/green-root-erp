import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Plus, Trash2, Check, X, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { fmtDate } from "@/lib/format";
import { toast } from "sonner";
import { logActivity } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/stock-transfers")({ component: StockTransfersPage });

type Item = { product_id: string; qty: number; note?: string };

function StockTransfersPage() {
  const { t } = useI18n();
  const [rows, setRows] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [items, setItems] = useState<Item[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: xr }, { data: wh }, { data: pr }] = await Promise.all([
      supabase.from("stock_transfers").select("*, from:from_warehouse_id(name), to:to_warehouse_id(name), stock_transfer_items(*)").order("created_at", { ascending: false }).limit(200),
      supabase.from("warehouses").select("id,name").order("name"),
      supabase.from("products").select("id,name,sku").order("name").limit(500),
    ]);
    setRows(xr ?? []);
    setWarehouses(wh ?? []);
    setProducts(pr ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setFrom(""); setTo(""); setCode(""); setNotes(""); setItems([]); };

  const submit = async () => {
    if (!from || !to) return toast.error(t("xfer.from"));
    if (from === to) return toast.error(t("xfer.sameWh"));
    if (items.length === 0 || items.some((i) => !i.product_id || !i.qty)) return toast.error(t("xfer.noItems"));
    const { data: u } = await supabase.auth.getUser();
    const { data: xf, error } = await supabase.from("stock_transfers").insert({
      from_warehouse_id: from, to_warehouse_id: to, notes: notes || null, code: code || null, created_by: u.user?.id,
    }).select().single();
    if (error || !xf) return toast.error(error?.message ?? "error");
    const { error: e2 } = await supabase.from("stock_transfer_items").insert(items.map((i) => ({ transfer_id: xf.id, ...i })));
    if (e2) return toast.error(e2.message);
    logActivity({ action: "create", entity: "stock_transfer", entity_id: xf.id, summary: `${items.length} items` });
    toast.success(t("common.done"));
    setOpen(false); reset(); load();
  };

  const setStatus = async (id: string, status: "in_transit" | "completed" | "cancelled" | "draft") => {
    if (status === "completed" && !confirm(t("xfer.confirmComplete"))) return;
    const { error } = await supabase.from("stock_transfers").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    logActivity({ action: `status:${status}`, entity: "stock_transfer", entity_id: id });
    toast.success(t("common.done"));
    load();
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("stock_transfers").delete().eq("id", id);
    load();
  };

  const statusColor = (s: string) =>
    s === "completed" ? "default" : s === "cancelled" ? "destructive" : s === "in_transit" ? "secondary" : "outline";

  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><ArrowLeftRight className="h-5 w-5" /><h1 className="text-2xl font-bold">{t("xfer.title")}</h1></div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} /></Button>
          <Button size="sm" onClick={() => { reset(); setOpen(true); }}><Plus className="h-4 w-4" /> {t("xfer.new")}</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="overflow-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>{t("xfer.code")}</TableHead>
              <TableHead>{t("xfer.from")}</TableHead>
              <TableHead>{t("xfer.to")}</TableHead>
              <TableHead>{t("xfer.items")}</TableHead>
              <TableHead>{t("xfer.status")}</TableHead>
              <TableHead>{t("act.when")}</TableHead>
              <TableHead />
            </TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">{r.code || r.id.slice(0, 8)}</TableCell>
                  <TableCell className="text-sm">{r.from?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.to?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{r.stock_transfer_items?.length ?? 0}</TableCell>
                  <TableCell><Badge variant={statusColor(r.status) as any}>{t(`xfer.status.${r.status}`)}</Badge></TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{fmtDate(r.created_at)}</TableCell>
                  <TableCell className="flex gap-1">
                    {r.status === "draft" && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "in_transit")}>{t("xfer.status.in_transit")}</Button>}
                    {(r.status === "draft" || r.status === "in_transit") && <Button size="sm" onClick={() => setStatus(r.id, "completed")}><Check className="h-4 w-4" /> {t("xfer.complete")}</Button>}
                    {(r.status === "draft" || r.status === "in_transit") && <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "cancelled")}><X className="h-4 w-4" /></Button>}
                    {r.status === "draft" && <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground">{t("xfer.empty")}</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{t("xfer.new")}</DialogTitle></DialogHeader>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs text-muted-foreground">{t("xfer.code")}</label>
              <Input value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            <div className="md:col-span-1" />
            <div>
              <label className="text-xs text-muted-foreground">{t("xfer.from")}</label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">{t("xfer.to")}</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-muted-foreground">{t("xfer.notes")}</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>

          <div className="mt-2">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("xfer.items")}</span>
              <Button size="sm" variant="outline" onClick={() => setItems([...items, { product_id: "", qty: 1 }])}><Plus className="h-4 w-4" /> {t("xfer.addItem")}</Button>
            </div>
            <div className="space-y-2">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 items-end gap-2">
                  <div className="col-span-7">
                    <Select value={it.product_id} onValueChange={(v) => { const c = [...items]; c[idx] = { ...it, product_id: v }; setItems(c); }}>
                      <SelectTrigger><SelectValue placeholder={t("xfer.product")} /></SelectTrigger>
                      <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}{p.sku ? ` · ${p.sku}` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input type="number" min={0} step="any" value={it.qty} onChange={(e) => { const c = [...items]; c[idx] = { ...it, qty: Number(e.target.value) }; setItems(c); }} />
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <Button size="icon" variant="ghost" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <div className="text-center text-sm text-muted-foreground">{t("xfer.noItems")}</div>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("xfer.cancel")}</Button>
            <Button onClick={submit}>{t("xfer.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
