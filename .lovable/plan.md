# المرحلة 4 — نظام المبيعات الاحترافي (POS) وما يتبعه

هدف المرحلة: بناء طبقات جديدة **فوق** النظام الحالي، دون حذف أي جدول أو صفحة أو علاقة. جميع الوحدات السابقة (المنتجات، المخزون، الفروع، المستودعات، المستخدمين، الصلاحيات، اللغات) تبقى كما هي وتُربط تلقائياً بالوحدات الجديدة.

## 1) قاعدة البيانات (ترحيلات إضافية فقط)

جداول جديدة في `public` — كل جدول: GRANT + RLS + سياسات عبر `has_role`/`auth.uid()` + trigger `updated_at`.

- **العملاء (CRM):** `customers` (name, phone, email, city, address, activity_type, crops[], farm_area, customer_type[retail|wholesale|semi_wholesale|vip], loyalty_points, credit_limit, balance, notes)
- **الولاء:** `loyalty_rules`, `loyalty_transactions`, `coupons` (code, discount_type, value, valid_from/to, usage_limit, per_customer), `coupon_redemptions`
- **العروض والأسعار:** `price_lists` + `price_list_items` (per product/category/customer_type + qty tiers + season)
- **المبيعات:**
  - `sales` (invoice_no, type[sale|quote|return|credit_note|debit_note], customer_id, branch_id, warehouse_id, cashier_id, status[draft|confirmed|paid|partial|void], subtotal, discount, tax, total, paid, balance, payment_status, notes, meta)
  - `sale_items` (sale_id, product_id, qty, unit_price, discount, tax, total, cost_snapshot)
  - `sale_payments` (sale_id, method[cash|card|transfer|check|mixed|credit], amount, reference, paid_at)
  - `sale_installments` (sale_id, due_date, amount, paid_amount, status)
- **المشتريات:**
  - `purchase_orders` (po_no, supplier_id, status[draft|approved|ordered|received|invoiced|closed], subtotal, tax, total, notes)
  - `purchase_order_items`
  - `purchase_receipts` + `purchase_receipt_items` (استلام مع فحص كمية/سعر/جودة)
  - `supplier_invoices` + `supplier_payments`
- **الديون والمحاسبة الخفيفة:**
  - `receipts` (نوع=in/out, party_type=customer/supplier, party_id, amount, method, reference, notes) — سندات قبض/صرف
  - `account_statements` view (اختياري: مبنية عبر SQL view)
- **الترابط مع المخزون:** trigger على `sale_items` INSERT/DELETE → إضافة سطر إلى `stock_movements` نوع `sale`/`return`. trigger على `purchase_receipt_items` → `stock_movements` نوع `purchase`. المخزون يتحدّث تلقائياً عبر trigger `apply_stock_movement` القائم.

## 2) الواجهات (صفحات جديدة)

- `/pos` — شاشة نقطة البيع (شبكة منتجات + بحث فوري بالاسم/باركود/QR/فئة/شركة/مادة فعالة، سلة، عميل، خصم، كوبون، طرق أداء متعددة، طباعة سريعة، اختصارات لوحة المفاتيح، وضع بيع سريع/عادي/جملة/نصف جملة/آجل/تقسيط)
- `/sales` — قائمة الفواتير + تعديل/إلغاء/مرتجع/طباعة/PDF/إرسال
- `/sales/quotes` — عروض الأسعار (تحويلها إلى فاتورة)
- `/customers` — CRM كامل (استبدال الـ placeholder الحالي): قائمة + بطاقة عميل بتبويبات (فواتير، ديون، مدفوعات، أرباح، أكثر المنتجات شراءً، مقترحات)
- `/loyalty` — قواعد النقاط + كوبونات + عروض موسمية
- `/pricing` — قوائم أسعار وعروض حسب الكمية/العميل/المنتج
- `/purchases` — طلبات شراء + اعتماد + أوامر شراء + استلام + فواتير مورد + مرتجعات
- `/suppliers` — CRM موردين كامل (تفعيل الصفحة الحالية): بطاقة مورد بتبويبات
- `/debts` — ديون العملاء والموردين + أقساط + تنبيهات + كشف حساب
- `/receipts` — سندات قبض/صرف
- `/accounting` — لوحة محاسبية مبسطة (تجميع من receipts + sales + purchases)
- تحسين `/dashboard`: بطاقات KPI (مبيعات اليوم/الشهر، أرباح، أكثر/أقل مبيعاً، أفضل العملاء، أفضل الموردين، عدد الفواتير، الديون، التحصيلات) + مخططات recharts.

## 3) الطباعة والتصدير

- مكوّن مشترك `PrintableInvoice` + `usePrint()` (window.print مع CSS `@media print`).
- تصدير PDF عبر `jspdf` + `jspdf-autotable` (فاتورة/كشف حساب/عروض).
- تصدير Excel عبر `xlsx` (تقارير المبيعات/المشتريات/الديون).
- ملصقات المنتجات + Barcode/QR (استعمال المكتبات الموجودة).
- إرسال بريد إلكتروني: عبر edge/server function باستخدام مفتاح Resend (سنطلبه عند الحاجة).
- إرسال WhatsApp: رابط `wa.me/<phone>?text=<message>` (بدون Twilio).

## 4) الصلاحيات

- إضافة صلاحيات: `pos.use`, `sales.manage`, `sales.void`, `purchases.manage`, `purchases.approve`, `customers.manage`, `suppliers.manage`, `debts.manage`, `receipts.manage`, `loyalty.manage`, `pricing.manage`, `discounts.override`.
- توزيعها على الأدوار الجديدة (cashier=pos.use، sales_manager=sales.*، purchases_manager=purchases.*، accountant=receipts+debts، owner/admin=الكل).
- كل زر حساس يتحقق عبر `has_permission`.

## 5) الترابط التلقائي

- بيع/مرتجع → حركة مخزون + قيد محاسبي + تحديث رصيد العميل + نقاط ولاء.
- استلام مشتريات → حركة مخزون + رصيد المورد.
- دفعة → تحديث `balance` وفتح/إغلاق الفاتورة تلقائياً.
- كل عملية مرتبطة بالفرع/المستودع/المستخدم الحالي.

## 6) الاختبار (قبل اعتماد المرحلة)

سيناريو E2E مباشر داخل التطبيق:
1. إنشاء عميل + مورد + قائمة أسعار + كوبون.
2. إنشاء طلب شراء → اعتماد → استلام → التحقق من زيادة المخزون.
3. عرض سعر → تحويله لفاتورة POS → أداء مختلط (نقد + بطاقة) + كوبون → التحقق من نقص المخزون ونقاط الولاء.
4. مرتجع جزئي → التحقق من رجوع المخزون والرصيد.
5. بيع آجل + تقسيط → تسجيل دفعة → كشف حساب.
6. طباعة فاتورة + PDF + Excel + WhatsApp.
7. Dashboard: التحقق من تحديث KPIs.

## تفاصيل تقنية

- **Server functions:** `src/lib/sales.functions.ts`, `purchases.functions.ts`, `customers.functions.ts`, `suppliers.functions.ts`, `loyalty.functions.ts`, `receipts.functions.ts` مع `requireSupabaseAuth` وفحص صلاحيات.
- **UI:** إعادة استخدام shadcn (Table, Dialog, Command للبحث السريع، Tabs، Sheet لسلة POS الجانبية).
- **i18n:** إضافة مفاتيح الترجمة الجديدة (AR/FR/EN).
- **Sidebar/modules:** إضافة `pos`, `quotes`, `purchases`, `loyalty`, `pricing`, `debts`, `receipts` مع الحفاظ على الوحدات القائمة.
- **الحفاظ التام:** لا `DROP`، لا تعديل أعمدة قائمة، لا تغيير لـ RLS الحالي.

## التنفيذ المتسلسل داخل المرحلة

بسبب حجم العمل، سأنفّذها على دفعات:

1. الترحيل الشامل (كل الجداول + triggers + صلاحيات).
2. Server functions + i18n + sidebar/modules.
3. صفحات: `/customers` (CRM) + `/suppliers` (CRM) + `/pricing` + `/loyalty`.
4. `/purchases` كامل (طلب→اعتماد→استلام→فاتورة مورد→مرتجع).
5. `/pos` + `/sales` + `/sales/quotes` + طباعة/PDF/Excel/WhatsApp.
6. `/debts` + `/receipts` + `/accounting` + Dashboard KPIs.
7. جولة اختبار وإصلاح.

هل أبدأ التنفيذ بهذا الترتيب؟
