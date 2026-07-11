import {
  LayoutDashboard, Package, Leaf, SprayCan, Sprout, Wrench,
  Warehouse, ShoppingCart, Users, Truck, Wallet, BarChart3,
  Sparkles, Settings, type LucideIcon,
} from "lucide-react";

export type ModuleGroup = "overview" | "inventory" | "commerce" | "finance" | "intelligence" | "system";

export interface AppModule {
  key: string;
  path: string;
  labelKey: string;
  icon: LucideIcon;
  color: string; // css var name — text-mod-<x> / bg-mod-<x>
  group: ModuleGroup;
}

export const MODULES: AppModule[] = [
  { key: "dashboard",   path: "/dashboard",   labelKey: "nav.dashboard",   icon: LayoutDashboard, color: "dashboard",   group: "overview" },
  { key: "products",    path: "/products",    labelKey: "nav.products",    icon: Package,         color: "products",    group: "inventory" },
  { key: "fertilizers", path: "/fertilizers", labelKey: "nav.fertilizers", icon: Leaf,            color: "fertilizers", group: "inventory" },
  { key: "pesticides",  path: "/pesticides",  labelKey: "nav.pesticides",  icon: SprayCan,        color: "pesticides",  group: "inventory" },
  { key: "seeds",       path: "/seeds",       labelKey: "nav.seeds",       icon: Sprout,          color: "seeds",       group: "inventory" },
  { key: "equipment",   path: "/equipment",   labelKey: "nav.equipment",   icon: Wrench,          color: "equipment",   group: "inventory" },
  { key: "warehouses",  path: "/warehouses",  labelKey: "nav.warehouses",  icon: Warehouse,       color: "warehouses",  group: "inventory" },
  { key: "sales",       path: "/sales",       labelKey: "nav.sales",       icon: ShoppingCart,    color: "sales",       group: "commerce" },
  { key: "customers",   path: "/customers",   labelKey: "nav.customers",   icon: Users,           color: "customers",   group: "commerce" },
  { key: "suppliers",   path: "/suppliers",   labelKey: "nav.suppliers",   icon: Truck,           color: "suppliers",   group: "commerce" },
  { key: "accounting",  path: "/accounting",  labelKey: "nav.accounting",  icon: Wallet,          color: "accounting",  group: "finance" },
  { key: "reports",     path: "/reports",     labelKey: "nav.reports",     icon: BarChart3,       color: "reports",     group: "intelligence" },
  { key: "ai",          path: "/ai",          labelKey: "nav.ai",          icon: Sparkles,        color: "ai",          group: "intelligence" },
  { key: "settings",    path: "/settings",    labelKey: "nav.settings",    icon: Settings,        color: "settings",    group: "system" },
];

export const GROUPS: ModuleGroup[] = ["overview", "inventory", "commerce", "finance", "intelligence", "system"];
