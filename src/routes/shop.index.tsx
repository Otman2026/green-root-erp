import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/")({ component: ShopIndex });

function ShopIndex() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const cart = useCart();

  const { data: products, isLoading } = useQuery({
    queryKey: ["shop-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, name_ar, selling_price, currency, primary_image_url, description, unit")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = (products ?? []).filter((p) =>
    q ? (p.name + " " + (p.name_ar || "")).toLowerCase().includes(q.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl gradient-primary p-8 text-primary-foreground">
        <h1 className="text-3xl font-bold">{t("shop.hero.title")}</h1>
        <p className="mt-2 opacity-90">{t("shop.hero.subtitle")}</p>
      </div>
      <Input placeholder={t("shop.search")} value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("shop.empty")}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <Card key={p.id} className="card-elevated overflow-hidden">
              <Link to="/shop/product/$id" params={{ id: p.id }}>
                <div className="aspect-square bg-muted grid place-items-center">
                  {p.primary_image_url ? (
                    <img src={p.primary_image_url} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
              </Link>
              <div className="p-3 space-y-2">
                <Link to="/shop/product/$id" params={{ id: p.id }} className="font-semibold line-clamp-2 hover:underline">
                  {p.name_ar || p.name}
                </Link>
                <div className="text-primary font-bold">
                  {Number(p.selling_price || 0).toFixed(2)} {p.currency || "MAD"}
                </div>
                <Button
                  size="sm"
                  className="w-full gap-1"
                  onClick={() => {
                    cart.add({
                      id: p.id,
                      name: p.name_ar || p.name,
                      price: Number(p.selling_price || 0),
                      qty: 1,
                      image: p.primary_image_url,
                    });
                    toast.success(t("shop.added"));
                  }}
                >
                  <ShoppingCart className="h-3 w-3" /> {t("shop.add")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
