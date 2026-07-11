import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Plus, Minus, Trash2, X, Printer, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { fmtMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pos")({ component: POSPage });

interface Product {
  id: string; name: string; sku: string | null; barcode: string | null; qr_code: string | null;
  selling_price: number | null; price_wholesale: number | null; price_semi_wholesale: number | null;
  stock_quantity: number | null; category_id: string | null; supplier_id: string | null;
  active_ingredient?: string | null;
}
interface Customer { id: string; name: string; customer_type: string; loyalty_points: number; balance: number }
type Method = "cash" | "card" | "transfer" | "check" | "credit" | "mixed";
type Mode = "retail" | "wholesale" | "semi_wholesale";

interface CartLine { product: Product; qty: number; unit_price: number; discount: number }

function POSPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState<string>("");
  const [mode, setMode] = useState<Mode>("retail");
  const [discount, setDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [coupon, setCoupon] = useState<any | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [method, setMethod] = useState<Method>("cash");
  const [paid, setPaid] = useState<string>("");

  useEffect(() => {
    (async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("id,name,sku,barcode,qr_code,selling_price,price_wholesale,price_semi_wholesale,stock_quantity,category_id,supplier_id,active_ingredient").order("name").limit(300),
        supabase.from("customers").select("id,name,customer_type,loyalty_points,balance").eq("is_active", true).order("name").limit(500),
      ]);
      setProducts((p.data ?? []) as any); setCustomers((c.data ?? []) as any);
    })();
  }, []);

  const priceOf = (p: Product): number => {
    if (mode === "wholesale" && p.price_wholesale) return Number(p.price_wholesale);
    if (mode === "semi_wholesale" && p.price_semi_wholesale) return Number(p.price_semi_wholesale);
    return Number(p.selling_price ?? 0);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products.slice(0, 60);
    return products.filter((p) =>
      p.name.toLowerCase().includes(s) ||
      (p.sku ?? "").toLowerCase().includes(s) ||
      (p.barcode ?? "").toLowerCase().includes(s) ||
      (p.qr_code ?? "").toLowerCase().includes(s) ||
      (p.active_ingredient ?? "").toLowerCase().includes(s)
    ).slice(0, 100);
  }, [products, q]);

  const addProduct = (p: Product) => {
    setCart((prev) => {
      const i = prev.findIndex((l) => l.product.id === p.id);
      const stock = Number(p.stock_quantity ?? 0);
      const currentQty = i >= 0 ? prev[i].qty : 0;
      if (stock > 0 && currentQty + 1 > stock) {
        toast.error(`${p.name}: ${t("pos.stockAvailable")} ${stock}`);
        return prev;
      }
      if (i >= 0) { const c = [...prev]; c[i] = { ...c[i], qty: c[i].qty + 1 }; return c; }
      return [...prev, { product: p, qty: 1, unit_price: priceOf(p), discount: 0 }];
    });
  };

  const setQty = (i: number, qty: number) => setCart((c) => c.map((l, idx) => {
    if (idx !== i) return l;
    const stock = Number(l.product.stock_quantity ?? 0);
    if (stock > 0 && qty > stock) {
      toast.error(`${l.product.name}: ${t("pos.stockAvailable")} ${stock}`);
      return { ...l, qty: stock };
    }
    return { ...l, qty: Math.max(0, qty) };
  }).filter((l) => l.qty > 0));
  const setPrice = (i: number, unit_price: number) => setCart((c) => c.map((l, idx) => idx === i ? { ...l, unit_price } : l));
  const removeLine = (i: number) => setCart((c) => c.filter((_, idx) => idx !== i));

  const subtotal = cart.reduce((s, l) => s + l.qty * l.unit_price - l.discount, 0);
  let couponDiscount = 0;
  if (coupon) couponDiscount = coupon.discount_type === "percent" ? subtotal * Number(coupon.value) / 100 : Number(coupon.value);
  const total = Math.max(0, subtotal - discount - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode) return;
    const { data, error } = await supabase.from("coupons").select("*").eq("code", couponCode).eq("is_active", true).maybeSingle();
    if (error || !data) { toast.error(t("pos.couponNotFound")); setCoupon(null); return; }
    setCoupon(data); toast.success(t("pos.couponApplied"));
  };

  const reset = () => { setCart([]); setDiscount(0); setCouponCode(""); setCoupon(null); setPaid(""); setCustomerId(""); };

  const confirm = async () => {
    if (cart.length === 0) return toast.error(t("pos.emptyCart"));
    const paidNum = Number(paid) || (method === "credit" ? 0 : total);

    const { data: sale, error: sErr } = await supabase.from("sales").insert({
      type: "sale", status: paidNum >= total ? "paid" : paidNum > 0 ? "partial" : "confirmed",
      customer_id: customerId || null, cashier_id: user?.id ?? null,
      subtotal, discount: discount + couponDiscount, tax: 0, total,
      payment_method: method, coupon_id: coupon?.id ?? null,
      meta: { mode },
    } as any).select().single();
    if (sErr || !sale) return toast.error(sErr?.message ?? "Failed");

    const items = cart.map((l) => ({
      sale_id: sale.id, product_id: l.product.id, qty: l.qty,
      unit_price: l.unit_price, discount: l.discount, tax: 0,
      total: l.qty * l.unit_price - l.discount,
    }));
    const { error: iErr } = await supabase.from("sale_items").insert(items);
    if (iErr) return toast.error(iErr.message);

    if (paidNum > 0) {
      await supabase.from("sale_payments").insert({
        sale_id: sale.id, method: method === "mixed" ? "cash" : method,
        amount: paidNum, user_id: user?.id ?? null,
      });
    }
    const owed = customerId && paidNum < total ? total - paidNum : 0;
    const pts = customerId ? Math.floor(total / 100) : 0;
    if (customerId && (owed !== 0 || pts !== 0)) {
      await supabase.rpc("pos_apply_customer_updates", {
        _customer_id: customerId,
        _balance_delta: owed,
        _points_delta: pts,
      });
    }
    if (coupon) {
      await supabase.from("coupon_redemptions").insert({ coupon_id: coupon.id, customer_id: customerId || null, sale_id: sale.id, discount_amount: couponDiscount });
      await supabase.from("coupons").update({ used_count: (coupon.used_count ?? 0) + 1 }).eq("id", coupon.id);
    }
    if (customerId && pts > 0) {
      await supabase.from("loyalty_transactions").insert({ customer_id: customerId, sale_id: sale.id, points: pts, reason: "sale" });
    }

    toast.success(`${t("auth.success")} — ${sale.invoice_no}`);
    printInvoice(sale.invoice_no, items, sale.total, paidNum);
    reset(); setPayOpen(false);
  };

  const printInvoice = async (invoiceNo: string, _items: any[], grandTotal: number, paidNum: number) => {
    const cust = customers.find((c) => c.id === customerId);
    const { printDocument } = await import("@/lib/print-templates");
    await printDocument({
      type: "invoice",
      docNo: invoiceNo,
      date: new Date().toISOString(),
      party: { name: cust?.name ?? t("pos.walkIn") },
      lines: cart.map((l) => ({
        name: l.product.name,
        sku: l.product.sku ?? undefined,
        qty: l.qty,
        unit_price: l.unit_price,
        discount: l.discount,
        tax: 0,
        total: l.qty * l.unit_price - l.discount,
      })),
      total: grandTotal,
      paid: paidNum,
      balance: grandTotal - paidNum,
    });
  };

  return (
    <div className="grid h-[calc(100vh-4rem)] grid-cols-1 gap-4 p-4 md:grid-cols-[1fr_420px]">
      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-3">
          <div className="flex items-center gap-2">
            <h1 className="flex items-center gap-2 text-lg font-bold"><Zap className="h-5 w-5 text-primary" /> {t("pos.title")}</h1>
            <div className="ms-auto flex items-center gap-2">
              <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["retail","wholesale","semi_wholesale"] as const).map((m) => <SelectItem key={m} value={m}>{t(`pos.mode.${m}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input autoFocus placeholder={t("pos.searchProduct")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
          </div>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => addProduct(p)} className="rounded-lg border bg-card p-2 text-start transition hover:border-primary hover:shadow-md">
                <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{p.sku ?? p.barcode ?? "—"}</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-bold">{fmtMoney(priceOf(p))}</span>
                  <Badge variant={(p.stock_quantity ?? 0) > 0 ? "secondary" : "destructive"} className="text-[10px]">{p.stock_quantity ?? 0}</Badge>
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="col-span-full py-8 text-center text-sm text-muted-foreground">{t("common.empty")}</div>}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden">
        <div className="border-b p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Select value={customerId || "walkin"} onValueChange={(v) => setCustomerId(v === "walkin" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="walkin">{t("pos.walkIn")}</SelectItem>
                {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {cart.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">{t("pos.emptyCart")}</div>
          ) : cart.map((l, i) => (
            <div key={l.product.id} className="mb-2 rounded-md border p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.product.name}</div>
                </div>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeLine(i)}><X className="h-3 w-3" /></Button>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i, l.qty - 1)}><Minus className="h-3 w-3" /></Button>
                <Input type="number" step="any" value={l.qty} onChange={(e) => setQty(i, Number(e.target.value))} className="h-7 w-16 text-center" />
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i, l.qty + 1)}><Plus className="h-3 w-3" /></Button>
                <span className="mx-1 text-xs">×</span>
                <Input type="number" step="any" value={l.unit_price} onChange={(e) => setPrice(i, Number(e.target.value))} className="h-7 w-24" />
                <span className="ms-auto text-sm font-mono">{fmtMoney(l.qty * l.unit_price - l.discount)}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Input placeholder={t("pos.coupon")} value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <Button variant="outline" size="sm" onClick={applyCoupon}>{t("pos.applyCoupon")}</Button>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{t("pos.subtotal")}</span><span className="font-mono">{fmtMoney(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>{t("pos.discount")}</span>
            <Input type="number" step="any" value={discount} onChange={(e) => setDiscount(Number(e.target.value) || 0)} className="h-7 w-24 text-end" />
          </div>
          {coupon && <div className="flex items-center justify-between text-sm text-primary"><span>{coupon.code}</span><span className="font-mono">-{fmtMoney(couponDiscount)}</span></div>}
          <div className="flex items-center justify-between border-t pt-2 text-lg font-bold">
            <span>{t("pos.grandTotal")}</span><span className="font-mono">{fmtMoney(total)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={reset}><Trash2 className="me-2 h-4 w-4" /> {t("pos.reset")}</Button>
            <Button onClick={() => setPayOpen(true)} disabled={cart.length === 0}>{t("pos.pay")}</Button>
          </div>
        </div>
      </Card>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("pos.pay")} — {fmtMoney(total)}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t("pos.method")}</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["cash","card","transfer","check","credit","mixed"] as const).map((m) => <SelectItem key={m} value={m}>{t(`pos.method.${m}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>{t("pos.paid")}</Label><Input type="number" step="any" value={paid} placeholder={String(total)} onChange={(e) => setPaid(e.target.value)} /></div>
            {method === "credit" && !customerId && <div className="text-sm text-destructive">{t("pos.creditNeedsCustomer")}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={confirm} disabled={method === "credit" && !customerId}><Printer className="me-2 h-4 w-4" /> {t("pos.confirm")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
