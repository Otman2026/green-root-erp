import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { placeStorefrontOrder } from "@/lib/shop.functions";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/shop/checkout")({ component: Checkout });

function Checkout() {
  const { t } = useI18n();
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const placeOrder = useServerFn(placeStorefrontOrder);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ invoice_no: string } | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", city: "", notes: "" });

  if (success) {
    return (
      <Card className="max-w-md mx-auto p-8 text-center space-y-4">
        <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
        <h2 className="text-2xl font-bold">{t("shop.orderPlaced")}</h2>
        <p className="text-muted-foreground">{t("shop.orderNo")}: <span className="font-mono">{success.invoice_no}</span></p>
        <Button asChild><Link to="/shop">{t("shop.continue")}</Link></Button>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">{t("shop.cartEmpty")}</p>
        <Button asChild><Link to="/shop">{t("shop.continue")}</Link></Button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t("shop.fillRequired"));
      return;
    }
    setLoading(true);
    try {
      const res = await placeOrder({
        data: {
          customer: form,
          items: items.map((i) => ({ product_id: i.id, qty: i.qty })),
          notes: form.notes,
        },
      });
      clear();
      setSuccess({ invoice_no: res.invoice_no });
    } catch (err: any) {
      toast.error(err?.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-2 p-4 space-y-3">
        <h3 className="font-semibold">{t("shop.customerInfo")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>{t("shop.name")} *</Label><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>{t("shop.phone")} *</Label><Input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t("shop.email")}</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>{t("shop.city")}</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>{t("shop.address")}</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>{t("shop.notes")}</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Card>
      <Card className="p-4 h-fit space-y-3">
        <h3 className="font-semibold">{t("shop.summary")}</h3>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm">
            <span>{i.name} × {i.qty}</span>
            <span>{(i.price * i.qty).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between text-lg font-bold border-t pt-3">
          <span>{t("shop.total")}</span>
          <span>{total.toFixed(2)}</span>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t("common.loading") : t("shop.placeOrder")}
        </Button>
      </Card>
    </form>
  );
}
