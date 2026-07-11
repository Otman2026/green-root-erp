# Design System — Haytam AGRI

## الهدف
إنشاء مكتبة تصميم موحّدة (`src/design-system/`) تُستخدم في كل الصفحات الحالية والمستقبلية، مع مراجعة كل الصفحات لتوحيدها.

## البنية الجديدة

```text
src/design-system/
  tokens/         → ألوان، خطوط، مسافات، ظلال، حواف (مصدر واحد)
  primitives/     → Button, Input, Select, Textarea, Switch, Checkbox
  layout/         → PageHeader, PageSection, Toolbar, EmptyState, ErrorState, LoadingState
  data/           → DataCard, StatCard, DataTable, ChartCard
  feedback/       → Alert, Toast, Dialog, Confirm, Skeleton
  navigation/     → AppShell, AppSidebar, Breadcrumbs, TabsBar
  icons/          → Icon (تغليف lucide-react)
  index.ts        → export موحّد: import { Button, DataTable } from "@/ds"
```

## المكوّنات المطلوبة
- **الألوان**: primary/secondary/success/warning/danger/info + سطوح neutral (كلها tokens في `styles.css`)
- **الخطوط**: أحجام (xs→3xl) وأوزان موحّدة عبر utilities
- **الأزرار**: variants (primary, secondary, ghost, outline, destructive, success) + sizes + `data-action` presets
- **البطاقات**: Card, StatCard, KpiCard (موجود)، ChartCard
- **الجداول**: DataTable مع sticky header/striped/hover/empty/loading state
- **النوافذ**: Dialog, ConfirmDialog, Sheet, Drawer
- **الحقول**: Input, Textarea, Select, Combobox, DatePicker, NumberInput (كلها مع Label + error)
- **التنبيهات**: Alert (4 severities)، Toast موحّد (sonner wrapper)
- **الحالات**: `<LoadingState/>` `<EmptyState/>` `<ErrorState/>` بتصميم واحد
- **الأيقونات**: عبر `<Icon name="..."/>` لتوحيد الحجم واللون
- **شريط التنقل/الأدوات**: `<PageHeader title actions/>` و`<Toolbar/>` موحّد

## خطة التنفيذ

1. **Tokens** — تنظيف `src/styles.css`: توحيد المتغيرات (success/warning/danger/info + surface levels)، حذف التكرار.
2. **إنشاء `src/design-system/`** مع كل المكوّنات أعلاه (كل واحد ملف صغير + re-export من `@/ds`).
3. **PageHeader + AppShell** موحّد للاستخدام في كل الصفحات.
4. **DataTable + StateComponents** لاستبدال الجداول المتفرقة.
5. **مراجعة الصفحات الحالية** بالترتيب:
   - Dashboard, POS, Sales, Purchases, Inventory, Customers, Suppliers, Invoices, Expenses, Accounting, Reports, AI, Shop, Settings, Auth
   - كل صفحة: استبدال `Card/Button/Table` المخصّصة بمكوّنات `@/ds` + تطبيق `PageHeader` موحّد.
6. **قاعدة صارمة**: إضافة تعليق أعلى `src/design-system/index.ts` يمنع إنشاء مكوّنات UI خارج النظام، و README قصير في `src/design-system/README.md`.
7. **الحفاظ الكامل** على المنطق وقواعد البيانات والوحدات — تغييرات UI فقط.

## المخاطر
- عدد كبير من الصفحات → المراجعة ستُنفَّذ على دفعات (5–7 صفحات لكل رد) للحفاظ على الاستقرار.
- لن يُحذف أي مكوّن shadcn الحالي؛ فقط نضيف طبقة `@/ds` تغلّفها.

## المُخرج النهائي
- مجلد `src/design-system/` كامل.
- كل الصفحات تعرض نفس الهوية (ألوان/خطوط/مسافات/بطاقات/أزرار/جداول/نوافذ).
- توثيق قصير: `src/design-system/README.md`.

هل أبدأ التنفيذ بهذا الترتيب؟
