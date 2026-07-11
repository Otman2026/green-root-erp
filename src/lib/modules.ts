import {
  LayoutDashboard, Package, Leaf, SprayCan, Sprout, Wrench,
  Warehouse, ShoppingCart, Users, Truck, Wallet, BarChart3,
  Sparkles, Settings, Building2, ArrowLeftRight, UserCog,
  Zap, ClipboardList, FileText, Gift, Tags, CircleDollarSign, Receipt,
  BookOpen, Bug, ShieldAlert, FlaskConical,
  Briefcase, CalendarCheck, CalendarX, Bell, Barcode, History, CreditCard,
  Route as RouteIcon, Fuel, MapPin, Percent, CalendarRange, KeyRound, ScrollText, Lock, LifeBuoy,
  type LucideIcon,
} from "lucide-react";
import type { AppRole } from "@/hooks/use-roles";

export type ModuleGroup = "overview" | "inventory" | "commerce" | "finance" | "hr" | "fleet" | "intelligence" | "knowledge" | "system";

export interface AppModule {
  key: string;
  path: string;
  labelKey: string;
  icon: LucideIcon;
  color: string;
  group: ModuleGroup;
  /** if omitted → visible to any authenticated user */
  roles?: AppRole[];
}

export const MODULES: AppModule[] = [
  { key: "dashboard",   path: "/dashboard",   labelKey: "nav.dashboard",   icon: LayoutDashboard, color: "dashboard",   group: "overview" },
  { key: "dash-exec",      path: "/dashboards/executive", labelKey: "exec.title",         icon: BarChart3, color: "dashboard",   group: "overview", roles: ["admin","owner","manager"] },
  { key: "dash-sales",     path: "/dashboards/sales",     labelKey: "dash.sales.title",     icon: BarChart3, color: "sales",       group: "overview", roles: ["admin","owner","manager","sales_manager"] },
  { key: "dash-warehouse", path: "/dashboards/warehouse", labelKey: "dash.warehouse.title", icon: BarChart3, color: "warehouses",  group: "overview", roles: ["admin","owner","manager","warehouse_keeper"] },
  { key: "dash-finance",   path: "/dashboards/finance",   labelKey: "dash.finance.title",   icon: BarChart3, color: "accounting",  group: "overview", roles: ["admin","owner","manager","accountant"] },
  { key: "dash-hr",        path: "/dashboards/hr",        labelKey: "dash.hr.title",        icon: BarChart3, color: "customers",   group: "overview", roles: ["admin","owner","manager","accountant"] },
  { key: "dash-fleet",     path: "/dashboards/fleet",     labelKey: "dash.fleet.title",     icon: BarChart3, color: "warehouses",  group: "overview", roles: ["admin","owner","manager","delivery"] },
  { key: "pos",         path: "/pos",         labelKey: "nav.pos",         icon: Zap,             color: "sales",       group: "commerce",   roles: ["admin","owner","manager","sales_manager","cashier","seller"] },
  { key: "sales",       path: "/sales",       labelKey: "nav.sales",       icon: ShoppingCart,    color: "sales",       group: "commerce",   roles: ["admin","owner","manager","sales_manager","cashier","seller","accountant"] },
  { key: "quotes",      path: "/quotes",      labelKey: "nav.quotes",      icon: FileText,        color: "sales",       group: "commerce",   roles: ["admin","owner","manager","sales_manager","seller"] },
  { key: "customers",   path: "/customers",   labelKey: "nav.customers",   icon: Users,           color: "customers",   group: "commerce",   roles: ["admin","owner","manager","sales_manager","seller","cashier","customer_service"] },
  { key: "loyalty",     path: "/loyalty",     labelKey: "nav.loyalty",     icon: Gift,            color: "customers",   group: "commerce",   roles: ["admin","owner","manager","sales_manager"] },
  { key: "pricing",     path: "/pricing",     labelKey: "nav.pricing",     icon: Tags,            color: "products",    group: "commerce",   roles: ["admin","owner","manager","sales_manager","purchases_manager"] },
  { key: "purchases",   path: "/purchases",   labelKey: "nav.purchases",   icon: ClipboardList,   color: "suppliers",   group: "commerce",   roles: ["admin","owner","manager","purchases_manager","warehouse_keeper"] },
  { key: "suppliers",   path: "/suppliers",   labelKey: "nav.suppliers",   icon: Truck,           color: "suppliers",   group: "commerce",   roles: ["admin","owner","manager","purchases_manager","accountant"] },
  { key: "branches",    path: "/branches",    labelKey: "nav.branches",    icon: Building2,       color: "customers",   group: "commerce",   roles: ["admin","owner","manager","branch_manager"] },
  { key: "products",    path: "/products",    labelKey: "nav.products",    icon: Package,         color: "products",    group: "inventory" },
  { key: "warehouses",  path: "/warehouses",  labelKey: "nav.warehouses",  icon: Warehouse,       color: "warehouses",  group: "inventory",  roles: ["admin","owner","manager","warehouse_keeper","branch_manager"] },
  { key: "inventory",   path: "/inventory",   labelKey: "nav.inventory",   icon: ArrowLeftRight,  color: "warehouses",  group: "inventory",  roles: ["admin","owner","manager","warehouse_keeper"] },
  { key: "stock-transfers", path: "/stock-transfers", labelKey: "xfer.title", icon: ArrowLeftRight, color: "warehouses", group: "inventory", roles: ["admin","owner","manager","warehouse_keeper","branch_manager"] },
  { key: "fertilizers", path: "/fertilizers", labelKey: "nav.fertilizers", icon: Leaf,            color: "fertilizers", group: "inventory" },
  { key: "pesticides",  path: "/pesticides",  labelKey: "nav.pesticides",  icon: SprayCan,        color: "pesticides",  group: "inventory" },
  { key: "seeds",       path: "/seeds",       labelKey: "nav.seeds",       icon: Sprout,          color: "seeds",       group: "inventory" },
  { key: "equipment",   path: "/equipment",   labelKey: "nav.equipment",   icon: Wrench,          color: "equipment",   group: "inventory" },
  { key: "receipts",    path: "/receipts",    labelKey: "nav.receipts",    icon: Receipt,         color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant","cashier"] },
  { key: "debts",       path: "/debts",       labelKey: "nav.debts",       icon: CircleDollarSign,color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant"] },
  { key: "accounting",  path: "/accounting",  labelKey: "nav.accounting",  icon: Wallet,          color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant"] },
  { key: "acc-taxes",   path: "/accounting/taxes",   labelKey: "acc.taxes",   icon: Percent,       color: "accounting", group: "finance", roles: ["admin","owner","manager","accountant"] },
  { key: "acc-periods", path: "/accounting/periods", labelKey: "acc.periods", icon: CalendarRange, color: "accounting", group: "finance", roles: ["admin","owner","manager","accountant"] },
  { key: "cash-boxes",  path: "/cash-boxes",  labelKey: "nav.cashBoxes",   icon: CircleDollarSign,color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant","cashier"] },
  { key: "banks",       path: "/banks",       labelKey: "nav.banks",       icon: Building2,       color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant"] },
  { key: "checks",      path: "/checks",      labelKey: "nav.checks",      icon: Receipt,         color: "accounting",  group: "finance",    roles: ["admin","owner","manager","accountant","cashier"] },
  { key: "reports",     path: "/reports",     labelKey: "nav.reports",     icon: BarChart3,       color: "reports",     group: "intelligence", roles: ["admin","owner","manager","accountant","sales_manager"] },
  { key: "ai",          path: "/ai",          labelKey: "nav.ai",          icon: Sparkles,        color: "ai",          group: "intelligence" },
  { key: "hr",          path: "/hr",          labelKey: "nav.hr",          icon: Briefcase,       color: "customers",   group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "hr-employees",  path: "/hr/employees",  labelKey: "hr.employees",  icon: Users,         color: "customers",   group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "hr-attendance", path: "/hr/attendance", labelKey: "hr.attendance", icon: CalendarCheck, color: "customers",   group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "hr-leaves",     path: "/hr/leaves",     labelKey: "hr.leaves",     icon: CalendarX,     color: "customers",   group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "hr-payroll",    path: "/hr/payroll",    labelKey: "hr.payroll",    icon: Wallet,        color: "accounting",  group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "hr-documents",  path: "/hr/documents",  labelKey: "hr.documents",  icon: FileText,      color: "customers",   group: "hr",          roles: ["admin","owner","manager","accountant"] },
  { key: "sales-reps",           path: "/sales-reps",             labelKey: "reps.title",       icon: UserCog,     color: "sales", group: "commerce", roles: ["admin","owner","manager","sales_manager"] },
  { key: "sales-reps-list",      path: "/sales-reps/list",        labelKey: "reps.list",        icon: Users,       color: "sales", group: "commerce", roles: ["admin","owner","manager","sales_manager"] },
  { key: "sales-reps-visits",    path: "/sales-reps/visits",      labelKey: "reps.visits",      icon: ClipboardList, color: "sales", group: "commerce", roles: ["admin","owner","manager","sales_manager","seller"] },
  { key: "sales-reps-commissions", path: "/sales-reps/commissions", labelKey: "reps.commissions", icon: Wallet,      color: "sales", group: "commerce", roles: ["admin","owner","manager","sales_manager","accountant"] },
  { key: "fleet",             path: "/fleet",             labelKey: "fleet.title",       icon: Truck,     color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "fleet-vehicles",    path: "/fleet/vehicles",    labelKey: "fleet.vehicles",    icon: Truck,     color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "fleet-drivers",     path: "/fleet/drivers",     labelKey: "fleet.drivers",     icon: Users,     color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "fleet-trips",       path: "/fleet/trips",       labelKey: "fleet.trips",       icon: RouteIcon, color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "fleet-fuel",        path: "/fleet/fuel",        labelKey: "fleet.fuel",        icon: Fuel,      color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "fleet-maintenance", path: "/fleet/maintenance", labelKey: "fleet.maintenance", icon: Wrench,    color: "warehouses", group: "fleet", roles: ["admin","owner","manager"] },
  { key: "fleet-tracking",    path: "/fleet/tracking",    labelKey: "fleet.tracking",    icon: MapPin,    color: "warehouses", group: "fleet", roles: ["admin","owner","manager","delivery"] },
  { key: "agri",        path: "/agri",        labelKey: "nav.agri",        icon: BookOpen,        color: "seeds",       group: "knowledge" },
  { key: "agri-plants",    path: "/agri/plants",    labelKey: "agri.plants",    icon: Sprout,       color: "seeds",       group: "knowledge" },
  { key: "agri-diseases",  path: "/agri/diseases",  labelKey: "agri.diseases",  icon: ShieldAlert,  color: "pesticides",  group: "knowledge" },
  { key: "agri-pests",     path: "/agri/pests",     labelKey: "agri.pests",     icon: Bug,          color: "pesticides",  group: "knowledge" },
  { key: "agri-treatments",path: "/agri/treatments",labelKey: "agri.treatments",icon: FlaskConical, color: "fertilizers", group: "knowledge" },
  { key: "notifications", path: "/notifications", labelKey: "notif.title", icon: Bell, color: "settings", group: "system" },
  { key: "tools-import-export", path: "/tools-import-export", labelKey: "ie.title", icon: ArrowLeftRight, color: "settings", group: "system", roles: ["admin","owner","manager"] },
  { key: "barcodes", path: "/barcodes", labelKey: "bar.title", icon: Barcode, color: "products", group: "inventory", roles: ["admin","owner","manager","warehouse_keeper","cashier"] },
  { key: "activity", path: "/activity", labelKey: "act.title", icon: History, color: "settings", group: "system", roles: ["admin","owner","manager"] },
  { key: "company-settings", path: "/company-settings", labelKey: "cs.title", icon: Building2, color: "settings", group: "system", roles: ["admin","owner","accountant"] },
  { key: "billing", path: "/billing", labelKey: "bill.title", icon: CreditCard, color: "accounting", group: "finance", roles: ["admin","owner","manager","accountant"] },
  { key: "system-health", path: "/system-health", labelKey: "sys.title", icon: ShieldAlert, color: "settings", group: "system", roles: ["admin","owner"] },
  { key: "users",       path: "/users",       labelKey: "nav.users",       icon: UserCog,         color: "settings",    group: "system",     roles: ["admin","owner"] },
  { key: "settings",    path: "/settings",    labelKey: "nav.settings",    icon: Settings,        color: "settings",    group: "system" },
  { key: "help",        path: "/help",        labelKey: "nav.help",        icon: LifeBuoy,        color: "settings",    group: "system" },
  { key: "system",               path: "/system",               labelKey: "sys.owner",       icon: ShieldAlert,     color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-organizations", path: "/system/organizations", labelKey: "sys.orgs",        icon: Building2,       color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-licenses",      path: "/system/licenses",      labelKey: "sys.licenses",    icon: KeyRound,        color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-plans",         path: "/system/plans",         labelKey: "sys.plans",       icon: Package,         color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-users",         path: "/system/users",         labelKey: "sys.users",       icon: Users,           color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-permissions",   path: "/system/permissions",   labelKey: "sys.perms",       icon: Lock,            color: "settings",    group: "system",     roles: ["system_owner"] },
  { key: "system-audit",         path: "/system/audit",         labelKey: "sys.audit",       icon: ScrollText,      color: "settings",    group: "system",     roles: ["system_owner"] },

];

export const GROUPS: ModuleGroup[] = ["overview", "inventory", "commerce", "finance", "hr", "fleet", "intelligence", "knowledge", "system"];
