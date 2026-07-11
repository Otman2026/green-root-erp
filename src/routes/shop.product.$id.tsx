import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useI18n } from "@/lib/i18n";
import { Package, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/product/$id")({ component: ProductPage });

function ProductPage() {
  const { id } = Route.useParams();
  const { t } = useI18n();
  const cart = useCart();
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["shop-product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, name_ar, selling_price, currency, primary_image_url, description, unit, brand, manufacturer")
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">{t("common.loading")}</div>;
  if (!p) return <div className="py-12 text-center text-muted-foreground">{t("shop.notFound")}</div>;

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/shop"><ArrowLeft className="h-4 w-4" />{t("common.back")}</Link></Button>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="aspect-square overflow-hidden bg-muted grid place-items-center">
          {p.primary_image_url ? (
            <img src={p.primary_image_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <Package className="h-20 w-20 text-muted-foreground" />
          )}
        </Card>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{p.name_ar || p.name}</h1>
          {p.brand && <p className="text-sm text-muted-foreground">{p.brand}</p>}
          <div className="text-2xl font-bold text-primary">
            {Number(p.selling_price || 0).toFixed(2)} {p.currency || "MAD"}
          </div>
          {p.description && <p className="text-muted-foreground">{p.description}</p>}
          <div className="flex items-center gap-2">
            <Input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="w-24" />
            <Button
              onClick={() => {
                cart.add({
                  id: p.id,
                  name: p.name_ar || p.name,
                  price: Number(p.selling_price || 0),
                  qty,
                  image: p.primary_image_url,
                });
                toast.success(t("shop.added"));
              }}
            >
              {t("shop.add")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
