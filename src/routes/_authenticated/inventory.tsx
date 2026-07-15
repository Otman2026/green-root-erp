import { Button, Input, Label, Textarea, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Badge } from "@/ds";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, ArrowLeftRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { DataTable, type Column } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";

export const Route = createFileRoute("/_authenticated/inventory")({ component: InventoryPage });

// Manual entry excludes 'transfer' (use Stock Transfers page) — 'transfer' produces no stock delta in apply_stock_movement.
const TYPES = ["purchase", "sale", "return", "damage", "adjustment", "stocktake"] as const;
const ALL_TYPES = ["purchase", "sale", "transfer", "return", "damage", "adjustment", "stocktake"] as const;
type MType = typeof ALL_TYPES[number];

interface Movement {
  id: string; product_id: string; type: MType; quantity: number;
  reason: string | null; reference: string | null;
  created_at: string; user_id: string | null;
}
interface Product { id: string; name: string; sku: string | null; stock_quantity: number | null }

function InventoryPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<{ product_id: string; type: MType; quantity: string; reason: string; reference: string }>({
    product_id: "", type: "purchase", quantity: "", reason: "", reference: "",
  });

  const load = async () => {
    setLoading(true);
    const [m, p] = await Promise.all([
      supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("products").select("id,name,sku,stock_quantity").order("name"),
    ]);
    if (m.error) toast.error(m.error.message);
    if (p.error) toast.error(p.error.message);
    setRows((m.data ?? []) as Movement[]);
    setProducts((p.data ?? []) as Product[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => filterType === "all" ? rows : rows.filter((r) => r.type === filterType), [rows, filterType]);

  const save = async () => {
    if (!form.product_id) return toast.error(t("nav.products"));
    const qty = Number(form.quantity);
    if (!qty || qty <= 0) return toast.error(t("common.quantity"));
    const { error } = await supabase.from("stock_movements").insert({
      product_id: form.product_id, type: form.type, quantity: qty,
      reason: form.reason || null, reference: form.reference || null,
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

  const columns: Column<Movement>[] = [
    { key: "date", header: t("common.date"), accessor: (r) => <span className="text-xs text-muted-foreground" dir="ltr">{new Date(r.created_at).toLocaleString()}</span>, sortValue: (r) => r.created_at, exportValue: (r) => r.created_at },
    { key: "type", header: t("common.type"), accessor: (r) => <Badge variant={badgeVariant[r.type]}>{t(`inventory.type.${r.type}`)}</Badge>, sortValue: (r) => r.type, exportValue: (r) => r.type },
    { key: "product", header: t("nav.products"), accessor: (r) => productName(r.product_id), sortValue: (r) => productName(r.product_id), exportValue: (r) => productName(r.product_id) },
    { key: "qty", header: t("common.quantity"), accessor: (r) => <span className="font-mono">{r.quantity}</span>, sortValue: (r) => Number(r.quantity), exportValue: (r) => Number(r.quantity) },
    { key: "reason", header: t("common.reason"), accessor: (r) => <span className="text-sm text-muted-foreground">{r.reason ?? "—"}</span>, sortValue: (r) => r.reason ?? "", exportValue: (r) => r.reason ?? "" },
    { key: "reference", header: "Reference", accessor: (r) => <span className="font-mono text-xs">{r.reference ?? "—"}</span>, sortValue: (r) => r.reference ?? "", exportValue: (r) => r.reference ?? "", defaultHidden: true },
  ];

  return (
    <div className="space-y-4 p-4 md:p-6">
      <PageHeader
        icon={ArrowLeftRight} title={t("inventory.title")} subtitle={`${rows.length} ${t("common.total")}`} colorVar="primary"
        actions={<Button onClick={() => setOpen(true)} className="gap-2"><Plus className="h-4 w-4" /> {t("inventory.new")}</Button>}
      />

      <DataTable
        data={filtered} columns={columns} isLoading={loading}
        rowKey={(r) => r.id}
        exportName="stock-movements" exportTitle="Stock Movements"
        rightSlot={
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {TYPES.map((tp) => <SelectItem key={tp} value={tp}>{t(`inventory.type.${tp}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      />

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
