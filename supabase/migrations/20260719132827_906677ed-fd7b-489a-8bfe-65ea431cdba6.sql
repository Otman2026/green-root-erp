
-- Categories
DROP POLICY IF EXISTS "auth insert categories" ON public.categories;
DROP POLICY IF EXISTS "auth update categories" ON public.categories;
CREATE POLICY "categories write" ON public.categories FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'));
CREATE POLICY "categories update" ON public.categories FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'));

-- Products
DROP POLICY IF EXISTS "auth insert products" ON public.products;
DROP POLICY IF EXISTS "auth update products" ON public.products;
CREATE POLICY "products write" ON public.products FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper') OR has_role(auth.uid(),'purchases_manager'));
CREATE POLICY "products update" ON public.products FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper') OR has_role(auth.uid(),'purchases_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper') OR has_role(auth.uid(),'purchases_manager'));

-- Suppliers
DROP POLICY IF EXISTS "auth insert suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "auth update suppliers" ON public.suppliers;
CREATE POLICY "suppliers write" ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'purchases_manager'));
CREATE POLICY "suppliers update" ON public.suppliers FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'purchases_manager'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'purchases_manager'));

-- Product images/documents/batches
DROP POLICY IF EXISTS "auth all images" ON public.product_images;
CREATE POLICY "product_images read" ON public.product_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_images write" ON public.product_images FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'));

DROP POLICY IF EXISTS "auth all docs" ON public.product_documents;
CREATE POLICY "product_documents read" ON public.product_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_documents write" ON public.product_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'));

DROP POLICY IF EXISTS "auth all batches" ON public.product_batches;
CREATE POLICY "product_batches read" ON public.product_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_batches write" ON public.product_batches FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'manager') OR has_role(auth.uid(),'warehouse_keeper'));
