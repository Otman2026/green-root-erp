import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShoppingCart, Sprout } from "lucide-react";
import { CartProvider, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/shop")({
  component: ShopLayout,
  head: () => ({
    meta: [
      { title: "Haytam AGRI — المتجر" },
      { name: "description", content: "متجر Haytam AGRI للمنتجات الزراعية" },
    ],
  }),
});

function CartButton() {
  const { count } = useCart();
  const { t } = useI18n();
  return (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link to="/shop/cart">
        <ShoppingCart className="h-4 w-4" />
        <span>{t("shop.cart")}</span>
        {count > 0 && (
          <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{count}</span>
        )}
      </Link>
    </Button>
  );
}

function ShopLayout() {
  const { t } = useI18n();
  return (
    <CartProvider>
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-6 py-3 backdrop-blur">
          <Link to="/shop" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg gradient-primary text-primary-foreground">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="font-bold">{t("shop.title")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <CartButton />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
        <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Haytam AGRI
        </footer>
      </div>
    </CartProvider>
  );
}
