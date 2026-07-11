
CREATE TABLE IF NOT EXISTS public.app_settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name text,
  company_address text,
  company_phone text,
  company_email text,
  company_tax_id text,
  logo_url text,
  currency text NOT NULL DEFAULT 'MAD',
  currency_symbol text NOT NULL DEFAULT 'د.م.',
  default_tax_rate numeric NOT NULL DEFAULT 20,
  invoice_prefix text NOT NULL DEFAULT 'INV-',
  invoice_footer text,
  invoice_terms text,
  print_paper text NOT NULL DEFAULT 'A4',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id = 1)
);

CREATE TABLE IF NOT EXISTS public.tax_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rate numeric NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
GRANT SELECT ON public.tax_rates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tax_rates TO authenticated;
GRANT ALL ON public.tax_rates TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settings_read_all" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_write_admin" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));

CREATE POLICY "tax_read_all" ON public.tax_rates FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "tax_write_admin" ON public.tax_rates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant'));

DROP TRIGGER IF EXISTS trg_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated_at BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_tax_rates_updated_at ON public.tax_rates;
CREATE TRIGGER trg_tax_rates_updated_at BEFORE UPDATE ON public.tax_rates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (id) VALUES (1) ON CONFLICT DO NOTHING;
INSERT INTO public.tax_rates (name, rate, is_default) VALUES
  ('TVA 20%', 20, true),
  ('TVA 14%', 14, false),
  ('TVA 10%', 10, false),
  ('TVA 7%', 7, false),
  ('Exonéré', 0, false)
ON CONFLICT DO NOTHING;
