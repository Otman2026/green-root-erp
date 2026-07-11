import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/shop/cart")({ component: CartPage });

function CartPage() {
  const { t } = useI18n();
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-muted-foreground">{t("shop.cartEmpty")}</p>
        <Button asChild><Link to="/shop">{t("shop.continue")}</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-2 space-y-3">
        {items.map((it) => (
          <Card key={it.id} className="flex items-center gap-3 p-3">
            <div className="h-16 w-16 rounded bg-muted overflow-hidden">
              {it.image && <img src={it.image} alt={it.name} className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1">
              <div className="font-semibold">{it.name}</div>
              <div className="text-sm text-muted-foreground">{it.price.toFixed(2)}</div>
            </div>
            <Input type="number" min={1} value={it.qty} onChange={(e) => setQty(it.id, Number(e.target.value))} className="w-20" />
            <div className="w-24 text-right font-semibold">{(it.price * it.qty).toFixed(2)}</div>
            <Button variant="ghost" size="icon" onClick={() => remove(it.id)}><Trash2 className="h-4 w-4" /></Button>
          </Card>
        ))}
      </div>
      <Card className="p-4 h-fit space-y-3">
        <h3 className="font-semibold">{t("shop.summary")}</h3>
        <div className="flex justify-between text-sm">
          <span>{t("shop.subtotal")}</span>
          <span>{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-3">
          <span>{t("shop.total")}</span>
          <span>{total.toFixed(2)}</span>
        </div>
        <Button asChild className="w-full"><Link to="/shop/checkout">{t("shop.checkout")}</Link></Button>
      </Card>
    </div>
  );
}
