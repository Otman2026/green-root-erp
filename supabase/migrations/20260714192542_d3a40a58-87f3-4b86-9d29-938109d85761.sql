DROP POLICY IF EXISTS "anon read active products" ON public.products;
DROP POLICY IF EXISTS "anon read categories" ON public.categories;
DROP POLICY IF EXISTS "tax_read_all" ON public.tax_rates;
REVOKE SELECT ON public.products FROM anon;
REVOKE SELECT ON public.categories FROM anon;
REVOKE SELECT ON public.tax_rates FROM anon;