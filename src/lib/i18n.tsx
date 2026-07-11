import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Locale = "ar" | "en";

type Dict = Record<string, string>;

const AR: Dict = {
  "app.name": "Haytam AGRI",
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
  "auth.title": "أهلاً بك في Haytam AGRI",
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

const EN: Dict = { ...AR, "app.name": "Haytam AGRI", "app.tagline": "Agricultural supplies management platform" };

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
