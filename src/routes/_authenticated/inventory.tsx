import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/inventory")({ component: InventoryPage });

const TYPES = ["purchase", "sale", "transfer", "return", "damage", "adjustment", "stocktake"] as const;
type MType = typeof TYPES[number];

interface Movement {
  id: string;
  product_id: string;
  type: MType;
  quantity: number;
  reason: string | null;
  reference: string | null;
  created_at: string;
  user_id: string | null;
}
interface Product { id: string; name: string; sku: string | null; stock_quantity: number | null }

function InventoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ product_id: string; type: MType; quantity: string; reason: string; reference: string }>({
    product_id: "", type: "purchase", quantity: "", reason: "", reference: "",
  });

  const load = async () => {
    const [m, p] = await Promise.all([
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("products").select("id,name,sku,stock_quantity").order("name"),
    ]);
    if (m.error) toast.error(m.error.message);
    if (p.error) toast.error(p.error.message);
    setRows((m.data ?? []) as Movement[]);
    setProducts((p.data ?? []) as Product[]);
  };
  useEffect(() => { load(); }, []);

  const filtered = filterType === "all" ? rows : rows.filter((r) => r.type === filterType);

  const save = async () => {
    if (!form.product_id) return toast.error(t("nav.products"));
    const qty = Number(form.quantity);
    if (!qty || qty <= 0) return toast.error(t("common.quantity"));
    const { error } = await supabase.from("stock_movements").insert({
      product_id: form.product_id,
      type: form.type,
      quantity: qty,
      reason: form.reason || null,
      reference: form.reference || null,
      user_id: user?.id ?? null,
    });
    if (error) return toast.error(error.message);
    toast.success(t("auth.success"));
    setOpen(false);
    setForm({ product_id: "", type: "purchase", quantity: "", reason: "", reference: "" });
    load();
  };

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? id.slice(0, 8);

  const badgeVariant: Record<MType, "default" | "secondary" | "destructive" | "outline"> = {
    purchase: "default", sale: "secondary", transfer: "outline",
    return: "outline", damage: "destructive", adjustment: "outline", stocktake: "secondary",
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ArrowLeftRight className="h-6 w-6 text-primary" /> {t("inventory.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{rows.length} {t("common.total")}</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("inventory.new")}</Button>
      </div>

      <Card className="p-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("common.all")}</SelectItem>
            {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{t(`inventory.type.${tp}`)}</SelectItem>)}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("nav.products")}</TableHead>
              <TableHead>{t("common.quantity")}</TableHead>
              <TableHead>{t("common.reason")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">{t("common.empty")}</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString()}</TableCell>
                <TableCell><Badge variant={badgeVariant[r.type]}>{t(`inventory.type.${r.type}`)}</Badge></TableCell>
                <TableCell>{productName(r.product_id)}</TableCell>
                <TableCell className="font-mono">{r.quantity}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{r.reason ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("inventory.new")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("nav.products")} *</Label>
              <Select value={form.product_id} onValueChange={(v) => setForm({ ...form, product_id: v })}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} {p.sku ? `· ${p.sku}` : ""}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("common.type")}</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as MType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{t(`inventory.type.${tp}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.quantity")} *</Label>
                <Input type="number" step="any" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5"><Label>{t("common.reason")}</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
