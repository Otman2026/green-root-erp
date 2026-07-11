
INSERT INTO public.permissions (key, label, label_ar, label_fr, category) VALUES
  ('sales.view','View Sales','عرض المبيعات','Voir les ventes','sales'),
  ('sales.create','Create Sales','إنشاء مبيعات','Créer des ventes','sales'),
  ('sales.edit','Edit Sales','تعديل المبيعات','Modifier les ventes','sales'),
  ('sales.delete','Delete Sales','حذف المبيعات','Supprimer les ventes','sales'),
  ('pos.use','Use POS','استخدام نقطة البيع','Utiliser la caisse','sales'),
  ('purchases.view','View Purchases','عرض المشتريات','Voir les achats','purchases'),
  ('purchases.create','Create Purchases','إنشاء مشتريات','Créer des achats','purchases'),
  ('purchases.edit','Edit Purchases','تعديل المشتريات','Modifier les achats','purchases'),
  ('purchases.delete','Delete Purchases','حذف المشتريات','Supprimer les achats','purchases'),
  ('inventory.view','View Inventory','عرض المخزون','Voir le stock','inventory'),
  ('inventory.edit','Edit Inventory','تعديل المخزون','Modifier le stock','inventory'),
  ('products.manage','Manage Products','إدارة المنتجات','Gérer les produits','inventory'),
  ('customers.view','View Customers','عرض العملاء','Voir les clients','crm'),
  ('customers.manage','Manage Customers','إدارة العملاء','Gérer les clients','crm'),
  ('suppliers.view','View Suppliers','عرض الموردين','Voir les fournisseurs','crm'),
  ('suppliers.manage','Manage Suppliers','إدارة الموردين','Gérer les fournisseurs','crm'),
  ('accounting.view','View Accounting','عرض المحاسبة','Voir la comptabilité','accounting'),
  ('accounting.manage','Manage Accounting','إدارة المحاسبة','Gérer la comptabilité','accounting'),
  ('cash.manage','Manage Cash','إدارة الخزينة','Gérer la caisse','accounting'),
  ('reports.view','View Reports','عرض التقارير','Voir les rapports','reports'),
  ('reports.export','Export Reports','تصدير التقارير','Exporter les rapports','reports'),
  ('print.allow','Allow Printing','السماح بالطباعة','Autoriser l''impression','system'),
  ('settings.manage','Manage Settings','إدارة الإعدادات','Gérer les paramètres','system'),
  ('users.manage','Manage Users','إدارة المستخدمين','Gérer les utilisateurs','system'),
  ('hr.view','View HR','عرض الموارد البشرية','Voir les RH','hr'),
  ('hr.manage','Manage HR','إدارة الموارد البشرية','Gérer les RH','hr'),
  ('fleet.view','View Fleet','عرض الأسطول','Voir la flotte','fleet'),
  ('fleet.manage','Manage Fleet','إدارة الأسطول','Gérer la flotte','fleet')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT r, p.key FROM (VALUES ('admin'::public.app_role), ('owner'::public.app_role)) AS ro(r), public.permissions p
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('manager','sales.view'),('manager','sales.create'),('manager','sales.edit'),
  ('manager','purchases.view'),('manager','purchases.create'),
  ('manager','inventory.view'),('manager','inventory.edit'),
  ('manager','customers.view'),('manager','customers.manage'),
  ('manager','suppliers.view'),('manager','reports.view'),('manager','print.allow'),
  ('cashier','pos.use'),('cashier','sales.view'),('cashier','sales.create'),('cashier','customers.view'),('cashier','print.allow'),
  ('seller','sales.view'),('seller','sales.create'),('seller','customers.view'),('seller','customers.manage'),('seller','print.allow'),
  ('accountant','accounting.view'),('accountant','accounting.manage'),('accountant','cash.manage'),('accountant','reports.view'),('accountant','reports.export'),
  ('warehouse_keeper','inventory.view'),('warehouse_keeper','inventory.edit'),('warehouse_keeper','products.manage'),
  ('purchases_manager','purchases.view'),('purchases_manager','purchases.create'),('purchases_manager','purchases.edit'),('purchases_manager','suppliers.view'),('purchases_manager','suppliers.manage'),
  ('sales_manager','sales.view'),('sales_manager','sales.create'),('sales_manager','sales.edit'),('sales_manager','sales.delete'),('sales_manager','customers.manage'),('sales_manager','reports.view')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "rp_admin" ON public.role_permissions;
CREATE POLICY "rp_manage" ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.is_system_owner(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.is_system_owner(auth.uid()));
