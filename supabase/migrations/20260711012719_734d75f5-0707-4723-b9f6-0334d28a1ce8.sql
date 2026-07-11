
-- ================== Phase 7: Accounting ==================

CREATE TYPE public.account_type AS ENUM ('asset','liability','equity','revenue','expense');
CREATE TYPE public.journal_status AS ENUM ('draft','posted','void');
CREATE TYPE public.check_direction AS ENUM ('in','out');
CREATE TYPE public.check_status AS ENUM ('pending','deposited','cleared','bounced','cancelled');
CREATE TYPE public.bank_tx_type AS ENUM ('deposit','withdrawal','transfer','fee','interest','other');

-- security-definer helper for finance write access
CREATE OR REPLACE FUNCTION public.acc_can_write()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(),'admin')
      OR public.has_role(auth.uid(),'owner')
      OR public.has_role(auth.uid(),'manager')
      OR public.has_role(auth.uid(),'accountant');
$$;

-- Chart of accounts
CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  name_fr text, name_en text,
  type public.account_type NOT NULL,
  parent_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  is_group boolean NOT NULL DEFAULT false,
  currency text NOT NULL DEFAULT 'MAD',
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "accounts read"  ON public.accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "accounts write" ON public.accounts FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fiscal periods
CREATE TABLE public.fiscal_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  closed boolean NOT NULL DEFAULT false,
  closed_at timestamptz,
  closed_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);
GRANT SELECT ON public.fiscal_periods TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.fiscal_periods TO authenticated;
GRANT ALL ON public.fiscal_periods TO service_role;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fp read"  ON public.fiscal_periods FOR SELECT TO authenticated USING (true);
CREATE POLICY "fp write" ON public.fiscal_periods FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_fp_updated BEFORE UPDATE ON public.fiscal_periods FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Journal entries
CREATE SEQUENCE IF NOT EXISTS journal_entry_seq START 1;

CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_no text NOT NULL UNIQUE DEFAULT ('JE-' || lpad(nextval('journal_entry_seq')::text, 6, '0')),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  reference text,
  description text,
  status public.journal_status NOT NULL DEFAULT 'posted',
  source_type text,   -- 'manual'|'sale'|'purchase'|'receipt'|'payment'|'adjustment'|'closing'
  source_id uuid,
  period_id uuid REFERENCES public.fiscal_periods(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.journal_entries TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "je read"  ON public.journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "je write" ON public.journal_entries FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_je_updated BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_je_date ON public.journal_entries(entry_date DESC);

-- Journal lines
CREATE TABLE public.journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  debit numeric(14,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(14,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description text,
  partner_type text,  -- 'customer'|'supplier'|'employee'|null
  partner_id uuid,
  line_no int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (debit = 0 OR credit = 0)
);
GRANT SELECT ON public.journal_lines TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jl read"  ON public.journal_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "jl write" ON public.journal_lines FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE INDEX idx_jl_entry ON public.journal_lines(entry_id);
CREATE INDEX idx_jl_account ON public.journal_lines(account_id);

-- Cash boxes
CREATE TABLE public.cash_boxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE,
  currency text NOT NULL DEFAULT 'MAD',
  account_id uuid REFERENCES public.accounts(id),
  balance numeric(14,2) NOT NULL DEFAULT 0,
  branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cash_boxes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cash_boxes TO authenticated;
GRANT ALL ON public.cash_boxes TO service_role;
ALTER TABLE public.cash_boxes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cb read"  ON public.cash_boxes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cb write" ON public.cash_boxes FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_cb_updated BEFORE UPDATE ON public.cash_boxes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Cash movements
CREATE TABLE public.cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  box_id uuid NOT NULL REFERENCES public.cash_boxes(id) ON DELETE CASCADE,
  direction public.receipt_direction NOT NULL, -- 'in' | 'out'
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  tx_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text,
  reference text,
  counter_box_id uuid REFERENCES public.cash_boxes(id),  -- for transfers
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cash_movements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cash_movements TO authenticated;
GRANT ALL ON public.cash_movements TO service_role;
ALTER TABLE public.cash_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cm read"  ON public.cash_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm write" ON public.cash_movements FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE INDEX idx_cm_box_date ON public.cash_movements(box_id, tx_date DESC);

CREATE OR REPLACE FUNCTION public.apply_cash_movement()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric;
BEGIN
  delta := CASE NEW.direction WHEN 'in' THEN NEW.amount ELSE -NEW.amount END;
  UPDATE public.cash_boxes SET balance = COALESCE(balance,0) + delta WHERE id = NEW.box_id;
  IF NEW.counter_box_id IS NOT NULL THEN
    UPDATE public.cash_boxes SET balance = COALESCE(balance,0) - delta WHERE id = NEW.counter_box_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_cash_movement_apply AFTER INSERT ON public.cash_movements
FOR EACH ROW EXECUTE FUNCTION public.apply_cash_movement();

-- Bank accounts
CREATE TABLE public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  bank_name text NOT NULL,
  account_number text,
  rib text,
  iban text,
  swift text,
  currency text NOT NULL DEFAULT 'MAD',
  account_id uuid REFERENCES public.accounts(id),
  opening_balance numeric(14,2) NOT NULL DEFAULT 0,
  balance numeric(14,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bank_accounts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bank_accounts TO authenticated;
GRANT ALL ON public.bank_accounts TO service_role;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ba read"  ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "ba write" ON public.bank_accounts FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_ba_updated BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bank transactions
CREATE TABLE public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  tx_type public.bank_tx_type NOT NULL,
  direction public.receipt_direction NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  tx_date date NOT NULL DEFAULT CURRENT_DATE,
  value_date date,
  reference text,
  description text,
  counter_bank_id uuid REFERENCES public.bank_accounts(id),
  reconciled boolean NOT NULL DEFAULT false,
  reconciled_at timestamptz,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bank_transactions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bank_transactions TO authenticated;
GRANT ALL ON public.bank_transactions TO service_role;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bt read"  ON public.bank_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "bt write" ON public.bank_transactions FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE INDEX idx_bt_bank_date ON public.bank_transactions(bank_id, tx_date DESC);

CREATE OR REPLACE FUNCTION public.apply_bank_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric;
BEGIN
  delta := CASE NEW.direction WHEN 'in' THEN NEW.amount ELSE -NEW.amount END;
  UPDATE public.bank_accounts SET balance = COALESCE(balance,0) + delta WHERE id = NEW.bank_id;
  IF NEW.counter_bank_id IS NOT NULL THEN
    UPDATE public.bank_accounts SET balance = COALESCE(balance,0) - delta WHERE id = NEW.counter_bank_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_bank_tx_apply AFTER INSERT ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_bank_transaction();

-- Checks
CREATE TABLE public.checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_no text NOT NULL,
  direction public.check_direction NOT NULL,
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  bank_name text,
  bank_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  party_type public.party_type,
  party_id uuid,
  party_name text,
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  status public.check_status NOT NULL DEFAULT 'pending',
  status_date date,
  notes text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.checks TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.checks TO authenticated;
GRANT ALL ON public.checks TO service_role;
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chk read"  ON public.checks FOR SELECT TO authenticated USING (true);
CREATE POLICY "chk write" ON public.checks FOR ALL    TO authenticated USING (public.acc_can_write()) WITH CHECK (public.acc_can_write());
CREATE TRIGGER trg_chk_updated BEFORE UPDATE ON public.checks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_chk_due ON public.checks(due_date) WHERE status = 'pending';

-- Seed a Moroccan-style basic chart of accounts (CGNC-inspired, simplified)
INSERT INTO public.accounts (code, name, name_fr, type, is_group) VALUES
  ('1',   'الحسابات الرئيسية', 'Comptes principaux', 'asset', true),
  ('11',  'رؤوس الأموال',      'Capitaux propres',    'equity', true),
  ('1111','رأس المال',          'Capital social',      'equity', false),
  ('1161','النتيجة المرحّلة',    'Résultat reporté',    'equity', false),
  ('2',   'الأصول الثابتة',    'Immobilisations',     'asset', true),
  ('2340','معدات ومنشآت',       'Matériel',            'asset', false),
  ('3',   'المخزون',           'Stocks',              'asset', true),
  ('3111','مخزون البضائع',      'Stock marchandises',  'asset', false),
  ('4',   'الأطراف',           'Tiers',               'asset', true),
  ('3421','العملاء',            'Clients',             'asset', false),
  ('4411','الموردون',           'Fournisseurs',        'liability', false),
  ('4455','ض. القيمة المضافة المستحقة','TVA due',       'liability', false),
  ('3455','ض. القيمة المضافة المستردة','TVA récup.',   'asset', false),
  ('5',   'الخزينة',           'Trésorerie',          'asset', true),
  ('5141','البنك',              'Banque',              'asset', false),
  ('5161','الصندوق',            'Caisse',              'asset', false),
  ('6',   'المصروفات',         'Charges',             'expense', true),
  ('6111','مشتريات البضائع',    'Achats marchandises', 'expense', false),
  ('6131','النقل',              'Transports',          'expense', false),
  ('6141','الإيجار',            'Loyer',               'expense', false),
  ('6171','الرواتب',            'Salaires',            'expense', false),
  ('6181','مصاريف أخرى',        'Autres charges',      'expense', false),
  ('7',   'الإيرادات',         'Produits',            'revenue', true),
  ('7111','مبيعات البضائع',     'Ventes marchandises', 'revenue', false),
  ('7181','إيرادات أخرى',       'Autres produits',     'revenue', false)
ON CONFLICT (code) DO NOTHING;

-- Wire parent relationships (best-effort)
UPDATE public.accounts SET parent_id = p.id FROM public.accounts p
WHERE public.accounts.code LIKE p.code || '%'
  AND public.accounts.code <> p.code
  AND length(p.code) = length(public.accounts.code) - CASE WHEN length(p.code)=1 THEN 1 ELSE 2 END
  AND p.is_group = true;
