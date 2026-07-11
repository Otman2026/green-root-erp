
-- Sales Reps
CREATE TABLE public.sales_reps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE,
  full_name text NOT NULL,
  phone text,
  email text,
  employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  user_id uuid,
  commission_rate numeric NOT NULL DEFAULT 0,
  monthly_target numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_reps TO authenticated;
GRANT ALL ON public.sales_reps TO service_role;
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_read" ON public.sales_reps FOR SELECT TO authenticated USING (true);
CREATE POLICY "sr_write" ON public.sales_reps FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_sr_upd BEFORE UPDATE ON public.sales_reps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Visits
CREATE TABLE public.sales_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  visit_date timestamptz NOT NULL DEFAULT now(),
  visit_type text NOT NULL DEFAULT 'visit',
  outcome text NOT NULL DEFAULT 'pending',
  latitude numeric,
  longitude numeric,
  notes text,
  next_action_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_visits TO authenticated;
GRANT ALL ON public.sales_visits TO service_role;
ALTER TABLE public.sales_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sv_read" ON public.sales_visits FOR SELECT TO authenticated USING (true);
CREATE POLICY "sv_write" ON public.sales_visits FOR ALL TO authenticated USING (public.acc_can_write() OR public.has_role(auth.uid(),'seller') OR public.has_role(auth.uid(),'sales_manager')) WITH CHECK (public.acc_can_write() OR public.has_role(auth.uid(),'seller') OR public.has_role(auth.uid(),'sales_manager'));
CREATE TRIGGER trg_sv_upd BEFORE UPDATE ON public.sales_visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Commissions
CREATE TABLE public.sales_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id uuid NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  period_year int NOT NULL,
  period_month int NOT NULL,
  sales_total numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  target numeric NOT NULL DEFAULT 0,
  achievement_pct numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rep_id, period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales_commissions TO authenticated;
GRANT ALL ON public.sales_commissions TO service_role;
ALTER TABLE public.sales_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_read" ON public.sales_commissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "sc_write" ON public.sales_commissions FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_sc_upd BEFORE UPDATE ON public.sales_commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link sale → rep (additive, nullable)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sales_rep_id uuid REFERENCES public.sales_reps(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_sales_rep ON public.sales(sales_rep_id);
