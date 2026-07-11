import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  HelpCircle, Search, Zap, ShoppingCart, Package, Warehouse, Wallet,
  Users, Truck, Sparkles, Settings, ShieldAlert, KeyRound, Lock,
  BookOpen, PlayCircle, LifeBuoy, MessageCircle, Mail, ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/help")({ component: HelpPage });

type Topic = {
  id: string;
  icon: typeof HelpCircle;
  title: string;
  desc: string;
  path?: string;
  steps: string[];
};

const TOPICS: Topic[] = [
  {
    id: "pos", icon: Zap, title: "نقطة البيع (POS)", desc: "بيع سريع للعملاء عبر شاشة اللمس.",
    path: "/pos",
    steps: [
      "افتح القائمة الجانبية ثم اضغط «نقطة البيع».",
      "ابحث عن المنتج بالاسم أو رقم الباركود.",
      "أضف الكميات ثم اختر العميل (اختياري) وطريقة الدفع.",
      "اضغط «حفظ الفاتورة» لطباعة الإيصال وتحديث المخزون تلقائياً.",
    ],
  },
  {
    id: "sales", icon: ShoppingCart, title: "المبيعات والفواتير", desc: "فواتير عادية، ديون، أقساط، مرتجعات.",
    path: "/sales",
    steps: [
      "افتح «المبيعات» ← «فاتورة جديدة».",
      "اختر العميل ثم أضف المنتجات مع الكميات والأسعار.",
      "حدّد الحالة (مدفوعة/جزئية/دين) وسجّل الدفع من صفحة «المقبوضات».",
      "المرتجعات تُنشأ من نفس القائمة بنوع «إرجاع».",
    ],
  },
  {
    id: "purchases", icon: Package, title: "المشتريات والموردين", desc: "أوامر شراء، إيصالات استلام، ذمم موردين.",
    path: "/purchases",
    steps: [
      "«المشتريات» ← «أمر شراء جديد» ← اختر المورد وأضف المنتجات.",
      "عند الاستلام أنشئ إيصال استلام؛ يتم تحديث المخزون تلقائياً.",
      "سجّل الدفعات من «مدفوعات الموردين».",
    ],
  },
  {
    id: "inventory", icon: Warehouse, title: "المخزون والمستودعات", desc: "حركات، جرد، تحويلات بين المستودعات.",
    path: "/inventory",
    steps: [
      "افتح «المخزون» لرؤية حركات المنتجات.",
      "«تحويلات المخزون» لنقل الكمّيات بين المستودعات.",
      "الجرد الدوري من «المستودعات» ← الجرد.",
      "تنبيهات نفاد المخزون تظهر تلقائياً في لوحة التحكم التنفيذية.",
    ],
  },
  {
    id: "finance", icon: Wallet, title: "المالية والمحاسبة", desc: "الصناديق، البنوك، الشيكات، الديون.",
    path: "/accounting",
    steps: [
      "أنشئ صناديق نقدية وحسابات بنكية من «الصناديق» و«البنوك».",
      "سجّل المقبوضات والمدفوعات؛ الأرصدة تُحدّث آلياً.",
      "الشيكات المستحقّة تظهر في «التنبيهات الذكية».",
      "التقارير المالية من «التقارير» ← مالية.",
    ],
  },
  {
    id: "customers", icon: Users, title: "العملاء والولاء", desc: "قاعدة العملاء، النقاط، الكوبونات.",
    path: "/customers",
    steps: [
      "أضف العملاء يدوياً أو استوردهم من ملف Excel.",
      "قواعد الولاء من «الولاء» ← قواعد. النقاط تُحسب تلقائياً عند البيع.",
      "أنشئ كوبونات خصم من نفس القسم.",
    ],
  },
  {
    id: "fleet", icon: Truck, title: "الأسطول والتوصيل", desc: "المركبات، السائقين، الرحلات، الوقود.",
    path: "/fleet",
    steps: [
      "سجّل المركبات والسائقين من «الأسطول».",
      "أنشئ رحلة توصيل واربطها بالفواتير.",
      "سجّل الوقود والصيانة لتحصل على تكلفة تشغيل حقيقية.",
    ],
  },
  {
    id: "ai", icon: Sparkles, title: "الذكاء الاصطناعي", desc: "تحليل، تنبؤ بالمبيعات، مساعد ذكي.",
    path: "/ai",
    steps: [
      "افتح «AI» للحصول على توصيات وتحليلات.",
      "استخدم المحادثة لسؤال المساعد عن حالة المخزون أو المبيعات.",
    ],
  },
  {
    id: "users", icon: Users, title: "الموظفون والصلاحيات", desc: "إنشاء حسابات موظفين وتعيين الأدوار.",
    path: "/users",
    steps: [
      "«المستخدمون» ← «إضافة موظف»، أدخل الاسم والبريد وكلمة المرور والدور.",
      "تُنشأ الحساب والعضوية وقاعدة البيانات دفعة واحدة.",
      "لتعديل الصلاحيات بشكل دقيق: لوحة النظام ← «مصفوفة الصلاحيات».",
    ],
  },
  {
    id: "system", icon: ShieldAlert, title: "لوحة مدير النظام", desc: "المؤسسات، التراخيص، الخطط، سجل التدقيق.",
    path: "/system",
    steps: [
      "تظهر فقط لحساب «مدير النظام».",
      "أنشئ تراخيص من «التراخيص» وأصدر مفتاح تفعيل لكل مؤسسة.",
      "«الخطط» لتحديد ميزات كل باقة.",
      "«سجل التدقيق» لمتابعة جميع العمليات الحساسة.",
    ],
  },
  {
    id: "licenses", icon: KeyRound, title: "التراخيص والمفاتيح", desc: "تفعيل النسخة، صلاحية الاستخدام.",
    path: "/billing",
    steps: [
      "الترخيص النشط ضروري للسماح بالكتابة (بيع/شراء/تعديل).",
      "عند انتهاء الترخيص يعمل التطبيق في وضع القراءة فقط.",
      "طلب مفتاح جديد يتم من صفحة «الفوترة».",
    ],
  },
  {
    id: "permissions", icon: Lock, title: "الأدوار والصلاحيات", desc: "من يستطيع فعل ماذا داخل التطبيق.",
    path: "/system/permissions",
    steps: [
      "الأدوار الجاهزة: admin, owner, manager, seller, cashier, accountant…",
      "من «مصفوفة الصلاحيات» فعّل/عطّل كل صلاحية لكل دور.",
      "التغييرات تسري فور الحفظ ولا تحتاج إعادة تشغيل.",
    ],
  },
];

function HelpPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return TOPICS;
    return TOPICS.filter(
      (t) => t.title.toLowerCase().includes(s) || t.desc.toLowerCase().includes(s) || t.steps.some((x) => x.toLowerCase().includes(s)),
    );
  }, [q]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4">
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/10 via-background to-transparent p-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white p-2 shadow-md ring-1 ring-border">
            <img src={logo} alt="Haytam AGRI" className="h-full w-full object-contain" width={64} height={64} />
          </div>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <LifeBuoy className="h-6 w-6 text-primary" />
              مركز المساعدة
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              دليل شامل لاستخدام Haytam AGRI — ابحث عن أي موضوع أو تصفّح الأقسام بالأسفل.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <BookOpen className="h-3 w-3" /> {TOPICS.length} موضوعاً
          </Badge>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث في المساعدة… مثل: فاتورة، مخزون، ترخيص"
            className="h-11 pe-10 text-base"
          />
        </div>
      </Card>

      {/* Quick start */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
          <PlayCircle className="h-5 w-5 text-primary" /> بداية سريعة (5 خطوات)
        </h2>
        <ol className="ms-5 list-decimal space-y-1.5 text-sm text-muted-foreground">
          <li>سجّل الدخول باسم المستخدم أو البريد الإلكتروني.</li>
          <li>أضف بيانات مؤسستك من «إعدادات المؤسسة».</li>
          <li>أدخل المنتجات والمخزون الابتدائي من «المنتجات» و«المخزون».</li>
          <li>ابدأ البيع من «نقطة البيع» أو أنشئ فاتورة من «المبيعات».</li>
          <li>راجع الأداء من «اللوحة التنفيذية» و«التقارير».</li>
        </ol>
      </Card>

      {/* Topics grid → accordion */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card key={topic.id} className="p-0">
              <Accordion type="single" collapsible>
                <AccordionItem value={topic.id} className="border-0">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 text-start">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{topic.title}</div>
                        <div className="text-xs text-muted-foreground">{topic.desc}</div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ol className="ms-5 list-decimal space-y-1.5 text-sm">
                      {topic.steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                    {topic.path && (
                      <Link
                        to={topic.path}
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        فتح الوحدة <ChevronRight className="h-3 w-3 rtl:rotate-180" />
                      </Link>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground md:col-span-2">
            لا توجد نتائج مطابقة. جرّب كلمة أخرى.
          </Card>
        )}
      </div>

      {/* Contact / support */}
      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold">
          <MessageCircle className="h-5 w-5 text-primary" /> هل تحتاج مساعدة إضافية؟
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="mailto:support@haytam-agri.com"
            className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm hover:bg-muted"
          >
            <Mail className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold">دعم فني عبر البريد</div>
              <div className="text-xs text-muted-foreground">support@haytam-agri.com</div>
            </div>
          </a>
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3 text-sm hover:bg-muted"
          >
            <Settings className="h-4 w-4 text-primary" />
            <div>
              <div className="font-semibold">الإعدادات العامة</div>
              <div className="text-xs text-muted-foreground">اللغة، الثيم، التفضيلات</div>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
