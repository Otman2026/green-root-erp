
-- Public storefront: allow anonymous read of active products & categories
CREATE POLICY "anon read active products" ON public.products
  FOR SELECT TO anon USING (status = 'active');
CREATE POLICY "anon read categories" ON public.categories
  FOR SELECT TO anon USING (true);
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.categories TO anon;

-- Track storefront origin in sales meta; no schema change needed (meta jsonb exists)
