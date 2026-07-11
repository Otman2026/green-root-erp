import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3, DollarSign, Package, Users, Truck, Building2,
  FileText, TrendingUp, ShoppingCart, Wallet, Receipt, PieChart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsHub,
});

type ReportLink = {
  to: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const GROUPS: { title: string; items: ReportLink[] }[] = [
  {
    title: "المحاسبة والمالية",
    items: [
      { to: "/accounting/reports", title: "التقارير المحاسبية", desc: "الميزانية، الأرباح/الخسائر، ميزان المراجعة، التدفقات النقدية", icon: FileText, color: "mod-accounting" },
      { to: "/dashboards/finance", title: "لوحة المالية", desc: "التدفقات النقدية، الذمم، البنوك", icon: DollarSign, color: "mod-accounting" },
      { to: "/accounting/journal", title: "دفتر اليومية", desc: "جميع القيود المحاسبية", icon: Receipt, color: "mod-accounting" },
      { to: "/debts", title: "الديون والذمم", desc: "متابعة ذمم العملاء والموردين", icon: Wallet, color: "mod-accounting" },
    ],
  },
  {
    title: "المبيعات والعملاء",
    items: [
      { to: "/dashboards/sales", title: "لوحة المبيعات", desc: "المبيعات، الأرباح، أفضل المنتجات والعملاء", icon: TrendingUp, color: "mod-sales" },
      { to: "/sales", title: "تقرير المبيعات", desc: "جميع فواتير المبيعات مع التصفية", icon: ShoppingCart, color: "mod-sales" },
      { to: "/quotes", title: "عروض الأسعار", desc: "متابعة وتحويل العروض", icon: FileText, color: "mod-sales" },
      { to: "/customers", title: "تقرير العملاء", desc: "أرصدة العملاء وسجلاتهم", icon: Users, color: "mod-sales" },
    ],
  },
  {
    title: "المخزون والمشتريات",
    items: [
      { to: "/dashboards/warehouse", title: "لوحة المخزون", desc: "مستوى المخزون، التنبيهات، الحركات", icon: Package, color: "mod-warehouses" },
      { to: "/products", title: "تقرير المنتجات", desc: "جميع المنتجات مع الأرصدة", icon: Package, color: "mod-products" },
      { to: "/purchases", title: "تقرير المشتريات", desc: "فواتير الموردين والاستلامات", icon: ShoppingCart, color: "mod-purchases" },
      { to: "/stock-transfers", title: "تحويلات المخزون", desc: "بين الفروع والمستودعات", icon: Building2, color: "mod-warehouses" },
    ],
  },
  {
    title: "الموارد البشرية والأسطول",
    items: [
      { to: "/dashboards/hr", title: "لوحة الموارد البشرية", desc: "الحضور، الرواتب، الإجازات", icon: Users, color: "mod-hr" },
      { to: "/dashboards/fleet", title: "لوحة الأسطول", desc: "السيارات، الرحلات، الوقود، الصيانة", icon: Truck, color: "mod-fleet" },
      { to: "/hr", title: "الموظفون", desc: "قائمة الموظفين والصلاحيات", icon: Users, color: "mod-hr" },
      { to: "/fleet", title: "الأسطول", desc: "المركبات والسائقون", icon: Truck, color: "mod-fleet" },
    ],
  },
  {
    title: "لوحة تنفيذية",
    items: [
      { to: "/dashboards/executive", title: "اللوحة التنفيذية", desc: "نظرة شاملة لأداء الأعمال", icon: PieChart, color: "mod-reports" },
      { to: "/activity", title: "سجل النشاطات", desc: "جميع العمليات في النظام", icon: BarChart3, color: "mod-reports" },
    ],
  },
];

function ReportsHub() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BarChart3 className="h-7 w-7" style={{ color: "var(--color-mod-reports)" }} />
          مركز التقارير
        </h1>
        <p className="text-sm text-muted-foreground">جميع تقارير ولوحات المتابعة في مكان واحد</p>
      </div>

      {GROUPS.map((g) => (
        <section key={g.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{g.title}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {g.items.map((r) => (
              <Link key={r.to} to={r.to} className="group">
                <Card className="h-full transition-shadow hover:shadow-lg">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-lg"
                      style={{ background: `color-mix(in oklab, var(--color-${r.color}) 15%, transparent)` }}
                    >
                      <r.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold group-hover:text-primary">{r.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
