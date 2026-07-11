
# المرحلة الرابعة – نظام SaaS احترافي

⚠️ **بدون حذف أي وحدة أو صفحة أو بيانات موجودة.** جميع الجداول الحالية تبقى كما هي، ونضيف فوقها طبقة العزل (tenant) والتراخيص.

## 1. قاعدة البيانات (Migration واحدة كبيرة)

### جداول جديدة
- `organizations` — المؤسسات (name, slug, owner_user_id, status, created_at)
- `organization_members` — ربط user ↔ organization + دور داخل المؤسسة (owner/manager/employee)
- `plans` (موجود، سنراجعه) — الخطط: trial / monthly / semi / yearly + السعر والمدة
- `licenses` — مفتاح ترخيص لكل مؤسسة (key, organization_id, plan_id, status: active/suspended/expired, starts_at, expires_at, is_trial)
- `subscriptions` (موجود، سنراجعه) — سجل الاشتراكات والتجديدات
- `audit_logs` — سجل كامل للعمليات الحساسة (user_id, org_id, action, entity, entity_id, ip, ua, meta, created_at)

### تعديل الأدوار
- إضافة قيمة `system_owner` إلى enum `app_role`.
- **قيد قاعدة بيانات صارم:** فهرس فريد جزئي يمنع وجود أكثر من صف واحد بدور `system_owner` في `user_roles`.
- دوال `SECURITY DEFINER`: `is_system_owner()`، `current_org_id()`، `is_org_member(org)`، `is_org_owner(org)`.
- **حماية RLS على `user_roles`:** منع أي INSERT/UPDATE/DELETE لدور `system_owner` من داخل التطبيق (فقط عبر SQL مباشر من System Owner).

### إضافة `organization_id` (بدون حذف بيانات)
- إضافة عمود `organization_id uuid` (nullable مبدئياً) إلى الجداول الأساسية: `products, customers, suppliers, sales, sale_items, purchase_orders, stock_movements, warehouses, branches, hr_employees, cash_boxes, bank_accounts, journal_entries, accounts, categories, price_lists, coupons, agri_plants, agri_diseases, agri_pests, agri_treatments, fleet_vehicles, sales_reps, ...`
- Migration تُنشئ مؤسسة افتراضية "Default Organization" وتُسند كل البيانات الحالية إليها، ثم يُصبح العمود `NOT NULL`.
- المستخدم الحالي الأول (admin) يصبح مالك تلك المؤسسة.

### RLS جديدة (فوق الموجودة)
- كل جدول tenant-scoped تُضاف عليه سياسة: `organization_id = current_org_id() OR is_system_owner()`.
- سياسات الكتابة تُضيف شرط **Read-Only Mode**: `license_is_active(current_org_id())` — دالة تتحقق أن الترخيص نشط وغير منتهي.
- `licenses`, `subscriptions`, `plans`: القراءة لأعضاء المؤسسة، الكتابة لـ `system_owner` فقط.
- `audit_logs`: القراءة لمالك المؤسسة و system_owner، الكتابة عبر triggers فقط.

### Triggers
- Trigger على الجداول الحساسة يكتب في `audit_logs`.
- Trigger على `sales/purchases/…` يمنع الكتابة إذا `license_is_active() = false` (طبقة ثانية فوق RLS).
- تحديث `handle_new_user`: يُنشئ مؤسسة تجريبية جديدة + ترخيص Trial لمدة 15 يوماً تلقائياً لكل مستخدم جديد يُسجّل بنفسه.

## 2. المصادقة (Auth)

- تمكين تسجيل الدخول باسم المستخدم فقط: عند الإنشاء يُولّد بريد وهمي `<username>@haytam.local` داخلياً لـ Supabase (الحقل `email_optional` في `profiles` موجود مسبقاً للبريد الحقيقي الاختياري).
- شاشة تسجيل جديدة `/auth`: تبويبان (دخول / إنشاء حساب) — بحقل username + كلمة مرور + هاتف اختياري + بريد اختياري.
- **اقتراح أسماء بديلة** تلقائياً عند التكرار (username, username1, username2, ...).
- **نسيان كلمة المرور:** صفحة `/auth/recover` تبحث بـ username → تعرض القنوات المتاحة (بريد/هاتف) → OTP عبر Supabase (بريد) أو رمز مؤقت يُخزّن في `password_resets`.
- System Owner يستطيع إصدار كلمة مرور مؤقتة لأي مستخدم من لوحته.

## 3. الواجهات الجديدة

### لوحة System Owner (`/system/*`) — محمية بـ `is_system_owner()`
- `/system` — نظرة عامة (عدد المؤسسات، الاشتراكات النشطة، الإيرادات، Trial ينتهي قريباً).
- `/system/organizations` — قائمة/إنشاء/تعليق/حذف مؤسسة، تعيين المالك.
- `/system/licenses` — توليد مفاتيح، تمديد، إلغاء، إعادة تفعيل، ربط بمؤسسة/خطة.
- `/system/plans` — إدارة الخطط والأسعار والمدد.
- `/system/subscriptions` — سجل الاشتراكات والتجديدات.
- `/system/users` — إدارة المستخدمين عبر النظام، إعادة تعيين كلمة مرور مؤقتة.
- `/system/audit` — سجل التدقيق الكامل.
- `/system/settings` — إعدادات عامة للنظام.

### داخل التطبيق (لجميع المستخدمين)
- **شريط علوي** يعرض حالة الترخيص: `نشط | تجريبي (X يوم متبقٍّ) | للقراءة فقط – الرجاء التجديد`.
- **Read-Only Mode UI:** عند `license_active = false`، يتم تعطيل جميع أزرار "إضافة / حفظ / حذف / تعديل" في كل الصفحات عبر `usePermissions()` (طبقة UI فوق حماية RLS). قراءة البيانات وطباعة التقارير تبقى مسموحة.
- صفحة `/billing` (موجودة) يتم تطويرها لعرض الاشتراك الحالي + خيارات التجديد.
- تحديث `_authenticated/route.tsx`: بعد التحقق من الجلسة، جلب `organization_id` + حالة الترخيص، وحقنها في context. المستخدم بدون مؤسسة → إنشاء تجريبية تلقائياً.

## 4. الأمان
- Rate Limiting بسيط في جدول `auth_attempts` (5 محاولات/15 دقيقة لكل username+IP).
- كل عمليات System Owner والحساسة تُسجّل في `audit_logs`.
- كلمات المرور محمية أصلاً بواسطة Supabase Auth (bcrypt).
- تفعيل `password_hibp_enabled` عبر `configure_auth`.

## 5. النسخ الاحتياطي وOffline
- **النسخ الاحتياطي:** زر في `/system/settings` يستدعي server function تُصدّر كامل بيانات المؤسسة كـ JSON (تنزيل مباشر). استيراد يقبل نفس الصيغة.
- **Offline:** إضافة PWA (manifest + service worker عبر `vite-plugin-pwa`) مع cache-first للأصول و queue للطلبات — هذه ميزة كبيرة، سأنفّذها كحد أدنى (تصفح offline + إشعار "أنت غير متصل، سيتم المزامنة لاحقاً")، والمزامنة الكاملة للكتابات offline تتطلب بنية IndexedDB مخصصة قد تحتاج مرحلة لاحقة — سأنبّه المستخدم.

## 6. GitHub / Build / Desktop / Mobile
- التحقق من `bun run build` ونتائج CI.
- Windows Setup.exe / Android / iOS تتطلب **Capacitor أو Tauri** — المشروع الحالي TanStack Start (ويب فقط). سأشرح للمستخدم أن هذا يستوجب wrapping منفصل (Capacitor لـ Android/iOS، Tauri أو Electron لـ Windows) وأقترح ذلك كخطوة لاحقة بعد اعتماد جوهر SaaS. **لن أضيفها في هذه المرحلة** لأنها تتطلب بنية بناء موازية وسيرفر CI مختلف.

## 7. الترتيب التنفيذي
1. **Migration ضخمة واحدة:** جداول جديدة + عمود `organization_id` + backfill + RLS + triggers + دوال + `system_owner` role.
2. تحديث `handle_new_user` وإنشاء trial تلقائي.
3. `_authenticated/route.tsx` + `useOrg()` + `useLicense()` hooks.
4. شاشة `/auth` الجديدة بـ username + استرجاع كلمة مرور.
5. لوحة `/system/*`.
6. Read-Only Mode في UI.
7. PWA (offline أساسي).
8. Audit + Rate Limiting.
9. اختبار شامل ثم Publish.

## ملاحظات صريحة قبل البدء
- **حساب System Owner:** بعد الـ migration، سأطلب منك اسم المستخدم الحالي الذي يجب أن يحصل على هذا الدور (يُمنح مرة واحدة يدوياً عبر SQL، ولا يمكن إنشاؤه من الواجهة).
- **Setup.exe / Android / iOS:** خارج نطاق هذه المرحلة تقنياً (يتطلب Capacitor/Tauri + CI منفصل). أنجز الويب/PWA الآن، ونعالج الـ native في مرحلة خامسة مخصصة إن أردت.
- **Offline كامل مع كتابة:** سأنجز PWA أساسي (تصفح offline). المزامنة الكاملة لعمليات الكتابة offline مشروع كبير مستقل.

هل أبدأ بالتنفيذ بهذا الترتيب؟
