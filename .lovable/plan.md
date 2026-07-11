
# المرحلة 3 — Haytam AGRI

هدف هذه المرحلة: إضافة طبقات جديدة **فوق** النظام الحالي دون حذف أي جدول أو صفحة أو علاقة. جميع الجداول الحالية (`profiles`, `user_roles`, `products`, `categories`, `suppliers`, `product_batches`, `product_images`, `product_documents`) تبقى كما هي.

---

## 1) دعم اللغات الثلاث (AR / FR / EN)

- توسيع `src/lib/i18n.tsx` لدعم `ar | fr | en` مع قواميس كاملة (الصفحات، القوائم، الأزرار، الرسائل، التنبيهات، الفواتير، التقارير، الإعدادات).
- اتجاه تلقائي: `ar → rtl`, `fr/en → ltr` (تعديل `<html dir>` و `lang`).
- حفظ اللغة في `localStorage` + عمود `preferred_language` في `profiles` (اختياري) للمزامنة بين الأجهزة.
- مكوّن `LanguageToggle` يعرض 3 خيارات، ويظهر في `Settings` + في الشريط العلوي.

## 2) حسابات باسم المستخدم (اختياري بريد/هاتف)

- إضافة أعمدة إلى `profiles`:
  - `username TEXT UNIQUE` (فريد، غير حساس لحالة الأحرف)
  - `phone TEXT`
  - `email_optional TEXT` (يعكس `auth.users.email` عند وجوده)
  - `is_active BOOLEAN DEFAULT true`
  - `is_archived BOOLEAN DEFAULT false`
  - `preferred_language TEXT DEFAULT 'ar'`
- **إستراتيجية Supabase**: Supabase يتطلب معرفاً (بريد/هاتف). سنستخدم **بريد وهمي داخلي** بصيغة `username@haytam.local` عند التسجيل بـ username فقط. ملف `profiles.username` هو المرئي للمستخدم.
- تسجيل الدخول: يقبل `username` أو `email` أو `phone` — نحوّل `username → username@haytam.local` قبل استدعاء Supabase.
- Server function `checkUsernameAvailable(username)` + `suggestUsernames(base)` تُنتج اقتراحات (haytam_agri01، haytam2026، haytam.store، …).
- صفحة `/auth` جديدة بحقول: username (إلزامي)، phone (اختياري)، email (اختياري)، password. عند التعارض → عرض شرائح الاقتراحات.
- إعدادات الحساب `/settings/account`: تعديل username، إضافة/تغيير/حذف بريد، إضافة/تغيير هاتف، تغيير كلمة المرور.

## 3) الأدوار والصلاحيات

- توسيع enum `app_role` بإضافة: `owner, branch_manager, warehouse_keeper, seller, cashier, accountant, purchases_manager, sales_manager, delivery, customer_service` (نُبقي `admin, employee` الحاليين).
- جدول `permissions` + `role_permissions` لدعم صلاحيات دقيقة قابلة للتوسّع + جدول `custom_roles` للأدوار المخصصة مستقبلاً.
- دوال أمان: `has_role`, `has_permission(uid, perm_key)` (SECURITY DEFINER).

## 4) الفروع Branches

جدول `branches`: name، city، address، phone، manager_id (FK → profiles).
جدول `branch_members`: branch_id + user_id + role.
صفحة `/branches` (CRUD + بحث + تصفية) — مربوطة بالمستودعات والصندوق والمبيعات لاحقاً.

## 5) المستودعات WMS

- `warehouses` (branch_id, name, code, address)
- `warehouse_zones` (warehouse_id, name, code)
- `warehouse_aisles` (zone_id, name)
- `warehouse_racks` (aisle_id, name)
- `warehouse_shelves` (rack_id, name)
- `warehouse_bins` (shelf_id, name, code) — الموقع الأدق للمنتج
- `product_locations` (product_id, bin_id, quantity) — يعرف مكان وكمية كل منتج بدقة.

## 6) المخزون والحركات

- `stock_movements`: product_id، from_location، to_location، type (`purchase|sale|transfer|return|damage|adjustment|stocktake`)، quantity، user_id، reason، created_at.
- `stock_reservations` (منتجات محجوزة)، `damaged_items`، `expired_items` (view مبني على `product_batches.expiry_date`).
- `stocktakes` + `stocktake_lines` لعمليات الجرد والتسويات.
- Triggers تحدّث `products.stock_quantity` تلقائياً عند كل حركة.
- صفحة `/inventory` بتبويبات: الحركات، الجرد، التحويلات، التالف، المنتهي، المحجوز.

## 7) Barcode / QR

- توليد Barcode/QR (موجود بالفعل ضمن product-dialog) + صفحة مسح بكاميرا (`html5-qrcode`) لاستعماله في: البيع، الجرد، البحث، المخزون.
- Endpoint `findProductByCode(code)` يبحث في `barcode`, `qr_code`, `sku`.

## 8) واجهة المستخدم

- تحديث الشريط الجانبي: إضافة روابط `Branches`, `Warehouses`, `Inventory`, `Users`, `Roles`.
- بطاقات ملونة + KPIs مباشرة + رسوم بيانية (recharts موجودة) في Dashboard الفروع/المستودعات.
- جميع الأزرار فعّالة (لا Placeholder).

## 9) الاختبارات (نفّذها قبل اعتماد المرحلة)

- تسجيل حساب بـ username فقط، ثم آخر بنفس الاسم للتأكد من الاقتراحات.
- إضافة بريد لاحقاً + تغيير كلمة المرور.
- تبديل اللغة بين AR/FR/EN مع فحص RTL/LTR.
- إنشاء فرع → مستودع → zone → bin → ربط منتج بموقع → حركة شراء → بيع → تحويل → جرد.
- مسح Barcode/QR والبحث السريع.
- CRUD كامل للمستخدمين مع الأدوار والإيقاف والأرشفة.

---

## تفاصيل تقنية

- **الترحيلات (Migrations)** إضافية فقط — لا `DROP` ولا تعديل أعمدة موجودة. كل جدول جديد يشمل: GRANT للأدوار، RLS مفعّل، سياسات مناسبة (قراءة للمصادَق، كتابة/حذف للأدوار المخوّلة عبر `has_role`)، triggers لـ `updated_at`.
- **Server functions** تحت `src/lib/*.functions.ts` (users, branches, warehouses, inventory, auth-username) مع `requireSupabaseAuth` وفحص صلاحيات.
- **Storage**: لا تغييرات على buckets الحالية.
- **الحفاظ التام** على: `products`, `categories`, `suppliers`, `product_batches`, `product_images`, `product_documents`, `profiles`, `user_roles`, وجميع الصفحات الحالية.

## نطاق التنفيذ في هذه الجلسة

بسبب حجم المرحلة، سأنفّذها على **دفعات متسلسلة داخل نفس المرحلة**، بالترتيب:

1. اللغات الثلاث + RTL/LTR + إعدادات اللغة.
2. الترحيل الشامل (username fields, roles, permissions, branches, warehouses, WMS, movements).
3. صفحة `/auth` الجديدة (username + اقتراحات) + `/settings/account`.
4. صفحات: `/users`, `/roles`, `/branches`, `/warehouses`, `/inventory` + الشريط الجانبي.
5. Barcode/QR scanner + دمجه في البحث والمخزون.
6. جولة اختبار وإصلاح.

هل أبدأ التنفيذ بهذا الترتيب؟
