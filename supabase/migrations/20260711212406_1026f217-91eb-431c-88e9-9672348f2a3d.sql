
-- Sales & Finance
DROP POLICY IF EXISTS "sale_payments write" ON public.sale_payments;
CREATE POLICY "sale_payments write" ON public.sale_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "receipts write" ON public.receipts;
CREATE POLICY "receipts write" ON public.receipts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'cashier'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'cashier'));

DROP POLICY IF EXISTS "sup_pay write" ON public.supplier_payments;
CREATE POLICY "sup_pay write" ON public.supplier_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "sup_inv write" ON public.supplier_invoices;
CREATE POLICY "sup_inv write" ON public.supplier_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'));

DROP POLICY IF EXISTS "po_items write" ON public.purchase_order_items;
CREATE POLICY "po_items write" ON public.purchase_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'));

DROP POLICY IF EXISTS "pr_items write" ON public.purchase_receipt_items;
CREATE POLICY "pr_items write" ON public.purchase_receipt_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'));

DROP POLICY IF EXISTS "coupon_redemptions write" ON public.coupon_redemptions;
CREATE POLICY "coupon_redemptions write" ON public.coupon_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'));

DROP POLICY IF EXISTS "loyalty_tx write" ON public.loyalty_transactions;
CREATE POLICY "loyalty_tx write" ON public.loyalty_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'));

DROP POLICY IF EXISTS "sale_items write" ON public.sale_items;
CREATE POLICY "sale_items write" ON public.sale_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'));

DROP POLICY IF EXISTS "sale_installments write" ON public.sale_installments;
CREATE POLICY "sale_installments write" ON public.sale_installments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'accountant'));

-- Stock movements: restrict INSERT to inventory roles (was: any authenticated)
DROP POLICY IF EXISTS "sm_ins" ON public.stock_movements;
CREATE POLICY "sm_ins" ON public.stock_movements FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'));

-- app_settings: remove anon read
DROP POLICY IF EXISTS "settings_read_all" ON public.app_settings;
CREATE POLICY "settings_read_authenticated" ON public.app_settings FOR SELECT TO authenticated USING (true);
