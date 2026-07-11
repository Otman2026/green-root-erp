import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, string>;

const AR: Dict = {
  "app.name": "أجري إي آر بي",
  "app.tagline": "نظام إدارة تجارة المستلزمات الزراعية",
  "nav.dashboard": "لوحة التحكم",
  "nav.products": "المنتجات",
  "nav.fertilizers": "الأسمدة",
  "nav.pesticides": "المبيدات",
  "nav.seeds": "البذور",
  "nav.equipment": "المعدات الزراعية",
  "nav.warehouses": "المستودعات",
  "nav.sales": "المبيعات",
  "nav.customers": "العملاء",
  "nav.suppliers": "الموردون",
  "nav.accounting": "المحاسبة",
  "nav.reports": "التقارير",
  "nav.ai": "الذكاء الاصطناعي",
  "nav.settings": "الإعدادات",
  "nav.group.overview": "نظرة عامة",
  "nav.group.inventory": "المخزون",
  "nav.group.commerce": "التجارة",
  "nav.group.finance": "المالية",
  "nav.group.intelligence": "الذكاء والتقارير",
  "nav.group.system": "النظام",
  "auth.title": "أهلاً بك في أجري إي آر بي",
  "auth.subtitle": "منصة احترافية لإدارة تجارة المستلزمات الزراعية",
  "auth.signIn": "تسجيل الدخول",
  "auth.signUp": "إنشاء حساب",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.fullName": "الاسم الكامل",
  "auth.google": "المتابعة عبر جوجل",
  "auth.or": "أو",
  "auth.signOut": "تسجيل الخروج",
  "auth.haveAccount": "لديك حساب؟",
  "auth.noAccount": "ليس لديك حساب؟",
  "dashboard.title": "لوحة التحكم",
  "dashboard.welcome": "أهلاً بك، ",
  "dashboard.overview": "نظرة عامة على أداء منشأتك",
  "dashboard.kpi.sales": "مبيعات اليوم",
  "dashboard.kpi.orders": "الطلبات",
  "dashboard.kpi.stock": "قيمة المخزون",
  "dashboard.kpi.customers": "العملاء",
  "dashboard.modules": "الوحدات",
  "dashboard.quickAccess": "الوصول السريع",
  "common.comingSoon": "قريباً",
  "common.underDev": "هذه الوحدة قيد التطوير — البنية الأساسية جاهزة وسيتم بناء الوظائف تباعاً.",
  "common.language": "اللغة",
  "common.theme": "المظهر",
  "common.light": "فاتح",
  "common.dark": "داكن",
  "landing.cta": "ابدأ الآن",
  "landing.signIn": "تسجيل الدخول",
  "landing.feature1.t": "إدارة المخزون",
  "landing.feature1.d": "تتبع الأسمدة والمبيدات والبذور والمعدات بدقة",
  "landing.feature2.t": "مبيعات ومحاسبة",
  "landing.feature2.d": "فوترة ومدفوعات ومحاسبة كاملة ومترابطة",
  "landing.feature3.t": "تقارير ذكية",
  "landing.feature3.d": "تحليلات فورية وتوصيات ذكاء اصطناعي",
};

const EN: Dict = {
  "app.name": "AgriERP",
  "app.tagline": "Agricultural supplies trade management platform",
  "nav.dashboard": "Dashboard",
  "nav.products": "Products",
  "nav.fertilizers": "Fertilizers",
  "nav.pesticides": "Pesticides",
  "nav.seeds": "Seeds",
  "nav.equipment": "Equipment",
  "nav.warehouses": "Warehouses",
  "nav.sales": "Sales",
  "nav.customers": "Customers",
  "nav.suppliers": "Suppliers",
  "nav.accounting": "Accounting",
  "nav.reports": "Reports",
  "nav.ai": "AI",
  "nav.settings": "Settings",
  "nav.group.overview": "Overview",
  "nav.group.inventory": "Inventory",
  "nav.group.commerce": "Commerce",
  "nav.group.finance": "Finance",
  "nav.group.intelligence": "Intelligence & Reports",
  "nav.group.system": "System",
  "auth.title": "Welcome to AgriERP",
  "auth.subtitle": "Professional platform for agricultural supplies trading",
  "auth.signIn": "Sign in",
  "auth.signUp": "Create account",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.fullName": "Full name",
  "auth.google": "Continue with Google",
  "auth.or": "or",
  "auth.signOut": "Sign out",
  "auth.haveAccount": "Have an account?",
  "auth.noAccount": "No account?",
  "dashboard.title": "Dashboard",
  "dashboard.welcome": "Welcome, ",
  "dashboard.overview": "Overview of your business performance",
  "dashboard.kpi.sales": "Today's sales",
  "dashboard.kpi.orders": "Orders",
  "dashboard.kpi.stock": "Stock value",
  "dashboard.kpi.customers": "Customers",
  "dashboard.modules": "Modules",
  "dashboard.quickAccess": "Quick access",
  "common.comingSoon": "Coming soon",
  "common.underDev": "This module is under development — the foundation is ready and features will ship progressively.",
  "common.language": "Language",
  "common.theme": "Theme",
  "common.light": "Light",
  "common.dark": "Dark",
  "landing.cta": "Get started",
  "landing.signIn": "Sign in",
  "landing.feature1.t": "Inventory management",
  "landing.feature1.d": "Precisely track fertilizers, pesticides, seeds and equipment",
  "landing.feature2.t": "Sales & accounting",
  "landing.feature2.d": "Invoicing, payments and integrated bookkeeping",
  "landing.feature3.t": "Smart reports",
  "landing.feature3.d": "Real-time analytics and AI recommendations",
};

const DICTS: Record<Locale, Dict> = { ar: AR, en: EN };

interface I18nCtx {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("locale")) as Locale | null;
    if (saved === "ar" || saved === "en") setLocaleState(saved);
  }, []);

  useEffect(() => {
    const dir = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.setAttribute("lang", locale);
    document.documentElement.setAttribute("dir", dir);
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("locale", l); } catch {}
  };

  const t = (key: string) => DICTS[locale][key] ?? key;

  return (
    <Ctx.Provider value={{ locale, dir: locale === "ar" ? "rtl" : "ltr", setLocale, t }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
