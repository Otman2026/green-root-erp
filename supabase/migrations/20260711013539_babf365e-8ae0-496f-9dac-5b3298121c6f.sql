
-- HR Module
CREATE TABLE public.hr_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text,
  manager_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_departments TO authenticated;
GRANT ALL ON public.hr_departments TO service_role;
ALTER TABLE public.hr_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_dept_read" ON public.hr_departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_dept_write" ON public.hr_departments FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department_id uuid REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_positions TO authenticated;
GRANT ALL ON public.hr_positions TO service_role;
ALTER TABLE public.hr_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_pos_read" ON public.hr_positions FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_pos_write" ON public.hr_positions FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  code text UNIQUE,
  full_name text NOT NULL,
  national_id text,
  gender text,
  birth_date date,
  hire_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  department_id uuid REFERENCES public.hr_departments(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.hr_positions(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  phone text,
  email text,
  address text,
  base_salary numeric NOT NULL DEFAULT 0,
  bank_account text,
  photo_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_employees TO authenticated;
GRANT ALL ON public.hr_employees TO service_role;
ALTER TABLE public.hr_employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_emp_read" ON public.hr_employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_emp_write" ON public.hr_employees FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  check_in timestamptz,
  check_out timestamptz,
  status text NOT NULL DEFAULT 'present',
  hours numeric,
  overtime numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_attendance TO authenticated;
GRANT ALL ON public.hr_attendance TO service_role;
ALTER TABLE public.hr_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_att_read" ON public.hr_attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_att_write" ON public.hr_attendance FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_leaves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL DEFAULT 'annual',
  from_date date NOT NULL,
  to_date date NOT NULL,
  days numeric NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'pending',
  reason text,
  approved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_leaves TO authenticated;
GRANT ALL ON public.hr_leaves TO service_role;
ALTER TABLE public.hr_leaves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_lv_read" ON public.hr_leaves FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_lv_write" ON public.hr_leaves FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  period_month int NOT NULL,
  period_year int NOT NULL,
  base_salary numeric NOT NULL DEFAULT 0,
  bonuses numeric NOT NULL DEFAULT 0,
  overtime numeric NOT NULL DEFAULT 0,
  allowances numeric NOT NULL DEFAULT 0,
  deductions numeric NOT NULL DEFAULT 0,
  advances numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  social numeric NOT NULL DEFAULT 0,
  net_pay numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, period_year, period_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_payroll TO authenticated;
GRANT ALL ON public.hr_payroll TO service_role;
ALTER TABLE public.hr_payroll ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_pay_read" ON public.hr_payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_pay_write" ON public.hr_payroll FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  type text NOT NULL DEFAULT 'bonus',
  amount numeric NOT NULL DEFAULT 0,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_bonuses TO authenticated;
GRANT ALL ON public.hr_bonuses TO service_role;
ALTER TABLE public.hr_bonuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_bn_read" ON public.hr_bonuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_bn_write" ON public.hr_bonuses FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

CREATE TABLE public.hr_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.hr_employees(id) ON DELETE CASCADE,
  title text NOT NULL,
  doc_type text,
  file_url text,
  expiry_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hr_documents TO authenticated;
GRANT ALL ON public.hr_documents TO service_role;
ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hr_doc_read" ON public.hr_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "hr_doc_write" ON public.hr_documents FOR ALL TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());

-- updated_at triggers
CREATE TRIGGER trg_hr_dept_upd BEFORE UPDATE ON public.hr_departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_pos_upd BEFORE UPDATE ON public.hr_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_emp_upd BEFORE UPDATE ON public.hr_employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_att_upd BEFORE UPDATE ON public.hr_attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_lv_upd BEFORE UPDATE ON public.hr_leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_pay_upd BEFORE UPDATE ON public.hr_payroll FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_bn_upd BEFORE UPDATE ON public.hr_bonuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_hr_doc_upd BEFORE UPDATE ON public.hr_documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
