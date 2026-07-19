import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { LogIn, LayoutDashboard, ShoppingCart, Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import { CartProvider, useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";


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

function AccountButton() {
  const { t } = useI18n();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return authed ? (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link to="/dashboard">
        <LayoutDashboard className="h-4 w-4" />
        <span className="hidden sm:inline">{t("nav.dashboard") ?? "لوحة التحكم"}</span>
      </Link>
    </Button>
  ) : (
    <Button asChild variant="outline" size="sm" className="gap-2">
      <Link to="/auth" search={{ next: undefined }}>
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">{t("auth.signIn") ?? "تسجيل الدخول"}</span>
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
            <AccountButton />
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
