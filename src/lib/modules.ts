import {
  LayoutDashboard, Package, Leaf, SprayCan, Sprout, Wrench,
  Warehouse, ShoppingCart, Users, Truck, Wallet, BarChart3,
  Sparkles, Settings, Building2, ArrowLeftRight, UserCog,
  Zap, ClipboardList, FileText, Gift, Tags, CircleDollarSign, Receipt,
  type LucideIcon,
} from "lucide-react";

export type ModuleGroup = "overview" | "inventory" | "commerce" | "finance" | "intelligence" | "system";

export interface AppModule {
  key: string;
  path: string;
  labelKey: string;
  icon: LucideIcon;
  color: string;
  group: ModuleGroup;
}

export const MODULES: AppModule[] = [
  { key: "dashboard",   path: "/dashboard",   labelKey: "nav.dashboard",   icon: LayoutDashboard, color: "dashboard",   group: "overview" },
  { key: "pos",         path: "/pos",         labelKey: "nav.pos",         icon: Zap,             color: "sales",       group: "commerce" },
  { key: "sales",       path: "/sales",       labelKey: "nav.sales",       icon: ShoppingCart,    color: "sales",       group: "commerce" },
  { key: "quotes",      path: "/quotes",      labelKey: "nav.quotes",      icon: FileText,        color: "sales",       group: "commerce" },
  { key: "customers",   path: "/customers",   labelKey: "nav.customers",   icon: Users,           color: "customers",   group: "commerce" },
  { key: "loyalty",     path: "/loyalty",     labelKey: "nav.loyalty",     icon: Gift,            color: "customers",   group: "commerce" },
  { key: "pricing",     path: "/pricing",     labelKey: "nav.pricing",     icon: Tags,            color: "products",    group: "commerce" },
  { key: "purchases",   path: "/purchases",   labelKey: "nav.purchases",   icon: ClipboardList,   color: "suppliers",   group: "commerce" },
  { key: "suppliers",   path: "/suppliers",   labelKey: "nav.suppliers",   icon: Truck,           color: "suppliers",   group: "commerce" },
  { key: "branches",    path: "/branches",    labelKey: "nav.branches",    icon: Building2,       color: "customers",   group: "commerce" },
  { key: "products",    path: "/products",    labelKey: "nav.products",    icon: Package,         color: "products",    group: "inventory" },
  { key: "warehouses",  path: "/warehouses",  labelKey: "nav.warehouses",  icon: Warehouse,       color: "warehouses",  group: "inventory" },
  { key: "inventory",   path: "/inventory",   labelKey: "nav.inventory",   icon: ArrowLeftRight,  color: "warehouses",  group: "inventory" },
  { key: "fertilizers", path: "/fertilizers", labelKey: "nav.fertilizers", icon: Leaf,            color: "fertilizers", group: "inventory" },
  { key: "pesticides",  path: "/pesticides",  labelKey: "nav.pesticides",  icon: SprayCan,        color: "pesticides",  group: "inventory" },
  { key: "seeds",       path: "/seeds",       labelKey: "nav.seeds",       icon: Sprout,          color: "seeds",       group: "inventory" },
  { key: "equipment",   path: "/equipment",   labelKey: "nav.equipment",   icon: Wrench,          color: "equipment",   group: "inventory" },
  { key: "receipts",    path: "/receipts",    labelKey: "nav.receipts",    icon: Receipt,         color: "accounting",  group: "finance" },
  { key: "debts",       path: "/debts",       labelKey: "nav.debts",       icon: CircleDollarSign,color: "accounting",  group: "finance" },
  { key: "accounting",  path: "/accounting",  labelKey: "nav.accounting",  icon: Wallet,          color: "accounting",  group: "finance" },
  { key: "reports",     path: "/reports",     labelKey: "nav.reports",     icon: BarChart3,       color: "reports",     group: "intelligence" },
  { key: "ai",          path: "/ai",          labelKey: "nav.ai",          icon: Sparkles,        color: "ai",          group: "intelligence" },
  { key: "users",       path: "/users",       labelKey: "nav.users",       icon: UserCog,         color: "settings",    group: "system" },
  { key: "settings",    path: "/settings",    labelKey: "nav.settings",    icon: Settings,        color: "settings",    group: "system" },
];

export const GROUPS: ModuleGroup[] = ["overview", "inventory", "commerce", "finance", "intelligence", "system"];
