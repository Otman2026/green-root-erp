import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout, Package, Wallet, BarChart3, ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const { t, dir } = useI18n();
  const { user } = useAuth();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: Package, tk: "landing.feature1.t", dk: "landing.feature1.d", color: "mod-products" },
    { icon: Wallet, tk: "landing.feature2.t", dk: "landing.feature2.d", color: "mod-accounting" },
    { icon: BarChart3, tk: "landing.feature3.t", dk: "landing.feature3.d", color: "mod-reports" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-bold">{t("app.name")}</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to={user ? "/dashboard" : "/auth"}>{user ? t("nav.dashboard") : t("landing.signIn")}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sprout className="h-3 w-3" style={{ color: "var(--color-mod-products)" }} />
            ERP · SaaS
          </div>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl">
            {t("app.name")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t("app.tagline")}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? t("nav.dashboard") : t("landing.cta")}
                <Arrow className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <Card key={f.tk} className="card-elevated p-6">
                <div
                  className="grid h-11 w-11 place-items-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklab, var(--color-${f.color}) 15%, transparent)` }}
                >
                  <Icon className="h-5 w-5" style={{ color: `var(--color-${f.color})` }} />
                </div>
                <h3 className="mt-4 font-semibold">{t(f.tk)}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{t(f.dk)}</p>
              </Card>
            );
          })}
        </div>
      </main>

      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t("app.name")}
      </footer>
    </div>
  );
}
