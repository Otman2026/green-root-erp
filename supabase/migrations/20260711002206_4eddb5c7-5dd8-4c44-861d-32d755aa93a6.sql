
CREATE POLICY "auth read product buckets" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('product-images','product-documents'));
CREATE POLICY "auth insert product buckets" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('product-images','product-documents'));
CREATE POLICY "auth update product buckets" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('product-images','product-documents'))
  WITH CHECK (bucket_id IN ('product-images','product-documents'));
CREATE POLICY "auth delete product buckets" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('product-images','product-documents'));
