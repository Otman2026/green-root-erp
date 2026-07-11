## المرحلة 2: وحدة المنتجات الاحترافية — Haytam AGRI

### 1. تحديثات على الواجهة العامة
- تغيير اسم التطبيق في `__root.tsx`, `index.tsx`, `auth.tsx`, و `AppSidebar` إلى **Haytam AGRI**
- تفعيل RTL افتراضياً + خط عربي حديث (Cairo أو Tajawal) عبر `<link>` في `__root.tsx`
- تحسين ملف `i18n` ليكون العربي هو الافتراضي

### 2. قاعدة البيانات (إضافات فقط — بدون حذف)

جداول جديدة:

```
categories               تصنيفات هرمية (parent_id ذاتي المرجع)
  - name, name_ar, slug, parent_id, icon, color, sort_order

suppliers                الموردون
  - name, contact_person, phone, email, address, notes

products                 المنتجات (شامل لكل الأنواع)
  - name, name_ar, trade_name, scientific_name
  - category_id, supplier_id, brand, manufacturer, origin_country
  - active_ingredient, formulation, concentration
  - unit (kg/L/piece/...), weight, volume
  - barcode, qr_code, registration_number, sku
  - stock_quantity, min_stock_alert
  - purchase_price, selling_price, currency
  - status (active/archived), notes
  - created_by, created_at, updated_at

product_batches          الدفعات (تاريخ الإنتاج/الصلاحية/الكمية)
  - product_id, batch_number, production_date, expiry_date, quantity

product_images           الصور (رئيسية + معرض)
  - product_id, url, is_primary, sort_order

product_documents        ملفات PDF (SDS، دليل الاستخدام...)
  - product_id, title, type, url
```

- RLS كامل: authenticated يقرأ/يكتب، admin يحذف
- GRANTs صحيحة (authenticated + service_role)
- فهارس على `category_id`, `supplier_id`, `barcode`, `sku`, `expiry_date`
- Trigger `updated_at` على كل الجداول

### 3. Storage Buckets
- `product-images` (عام) — للصور
- `product-documents` (خاص) — لملفات PDF

### 4. Server Functions (`src/lib/products.functions.ts`)
كل العمليات عبر `createServerFn` + `requireSupabaseAuth`:
- `listProducts` (مع فلترة/بحث/ترقيم)
- `getProduct(id)` مع الدفعات والصور والملفات
- `createProduct` / `updateProduct` / `archiveProduct` / `restoreProduct` / `deleteProduct`
- `listCategories` / `createCategory` / `updateCategory` / `deleteCategory`
- `listSuppliers` / `createSupplier` / `updateSupplier` / `deleteSupplier`
- `getProductStats` (عداد، مخزون منخفض، منتهي/قارب الانتهاء، الأكثر مبيعاً)
- `exportProductsExcel` / `importProductsExcel`

### 5. واجهات المستخدم

**`/products` — الصفحة الرئيسية**
- شريط KPIs ملون: إجمالي، مخزون منخفض، منتهي، قارب الانتهاء
- بطاقات فئات ملونة بأيقونات
- جدول/بطاقات المنتجات مع صورة مصغرة
- بحث فوري + فلترة بالفئة/المورد/الحالة
- أزرار: إضافة، استيراد Excel، تصدير Excel، تصدير PDF، طباعة

**`/products/categories` — إدارة التصنيفات**
- شجرة هرمية قابلة للطي (Tree view)
- إضافة/تعديل/حذف تصنيف على أي مستوى

**`/products/suppliers` — إدارة الموردين**
- CRUD كامل بجدول احترافي

**Dialog: تفاصيل/تعديل المنتج**
- تبويبات: معلومات أساسية | المخزون والدفعات | الصور | الملفات | ملاحظات
- رفع صور متعددة مع تحديد الرئيسية وضغط تلقائي (browser-image-compression)
- توليد Barcode/QR تلقائياً

### 6. الأدوات المستخدمة
- `xlsx` لاستيراد/تصدير Excel
- `jspdf` + `jspdf-autotable` لتصدير PDF
- `react-barcode` + `qrcode.react`
- `browser-image-compression` لضغط الصور
- `@tanstack/react-table` للجداول المتقدمة

### 7. الاختبار قبل الاعتماد
- إنشاء تصنيفات نموذجية (أسمدة، مبيدات، بذور، معدات...)
- إضافة منتج مع صور ودفعات وملف PDF
- اختبار البحث بـ barcode/اسم/مادة فعالة
- تصدير Excel واستيراده مرة أخرى
- طباعة PDF
- أرشفة واستعادة
- تنبيهات الصلاحية والمخزون

### ملاحظة
لن يتم لمس: `profiles`, `user_roles`, `handle_new_user`, الوحدات الأخرى (تبقى placeholders). كل الإضافات فوق النظام الحالي فقط.
