
-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.customer_type AS ENUM ('retail','wholesale','semi_wholesale','vip'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.sale_type AS ENUM ('sale','quote','return','credit_note','debit_note'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.sale_status AS ENUM ('draft','confirmed','paid','partial','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payment_method AS ENUM ('cash','card','transfer','check','mixed','credit'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.po_status AS ENUM ('draft','approved','ordered','received','invoiced','closed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.discount_type AS ENUM ('percent','amount'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.receipt_direction AS ENUM ('in','out'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.party_type AS ENUM ('customer','supplier'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ HELPER: updated_at trigger already exists as public.update_updated_at_column ============

-- ============ CUSTOMERS ============
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  activity_type TEXT,
  crops TEXT[],
  farm_area NUMERIC,
  customer_type public.customer_type NOT NULL DEFAULT 'retail',
  loyalty_points NUMERIC NOT NULL DEFAULT 0,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers write" ON public.customers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'seller') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'customer_service'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'seller') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'customer_service'));
CREATE TRIGGER trg_customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type public.discount_type NOT NULL DEFAULT 'percent',
  value NUMERIC NOT NULL DEFAULT 0,
  min_total NUMERIC,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  per_customer_limit INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons read" ON public.coupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupons write" ON public.coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'));
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  sale_id UUID,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupon_redemptions read" ON public.coupon_redemptions FOR SELECT TO authenticated USING (true);
CREATE POLICY "coupon_redemptions write" ON public.coupon_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (true);

-- ============ LOYALTY ============
CREATE TABLE IF NOT EXISTS public.loyalty_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  points_per_amount NUMERIC NOT NULL DEFAULT 1,
  amount_unit NUMERIC NOT NULL DEFAULT 100,
  redemption_value NUMERIC NOT NULL DEFAULT 1,
  min_redeem_points NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_rules TO authenticated;
GRANT ALL ON public.loyalty_rules TO service_role;
ALTER TABLE public.loyalty_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_rules read" ON public.loyalty_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "loyalty_rules write" ON public.loyalty_rules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'));
CREATE TRIGGER trg_loyalty_rules_updated BEFORE UPDATE ON public.loyalty_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  sale_id UUID,
  points NUMERIC NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.loyalty_transactions TO authenticated;
GRANT ALL ON public.loyalty_transactions TO service_role;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loyalty_tx read" ON public.loyalty_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "loyalty_tx write" ON public.loyalty_transactions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (true);

-- ============ PRICE LISTS ============
CREATE TABLE IF NOT EXISTS public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  customer_type public.customer_type,
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_lists TO authenticated;
GRANT ALL ON public.price_lists TO service_role;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_lists read" ON public.price_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "price_lists write" ON public.price_lists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'));
CREATE TRIGGER trg_price_lists_updated BEFORE UPDATE ON public.price_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  min_qty NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_list_items TO authenticated;
GRANT ALL ON public.price_list_items TO service_role;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "price_list_items read" ON public.price_list_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "price_list_items write" ON public.price_list_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager'));

-- ============ SALES ============
CREATE SEQUENCE IF NOT EXISTS public.sales_invoice_seq START 1000;

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL UNIQUE DEFAULT ('INV-' || lpad(nextval('public.sales_invoice_seq')::text, 6, '0')),
  type public.sale_type NOT NULL DEFAULT 'sale',
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  cashier_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.sale_status NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  payment_method public.payment_method,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  parent_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  notes TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sales read" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "sales write" ON public.sales FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'));
CREATE TRIGGER trg_sales_updated BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty NUMERIC NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  cost_snapshot NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_items TO authenticated;
GRANT ALL ON public.sale_items TO service_role;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_items read" ON public.sale_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "sale_items write" ON public.sale_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'seller'))
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.sale_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  method public.payment_method NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_payments TO authenticated;
GRANT ALL ON public.sale_payments TO service_role;
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_payments read" ON public.sale_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "sale_payments write" ON public.sale_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'cashier') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.sale_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sale_installments TO authenticated;
GRANT ALL ON public.sale_installments TO service_role;
ALTER TABLE public.sale_installments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_installments read" ON public.sale_installments FOR SELECT TO authenticated USING (true);
CREATE POLICY "sale_installments write" ON public.sale_installments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'sales_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (true);

-- ============ PURCHASES ============
CREATE SEQUENCE IF NOT EXISTS public.po_seq START 1000;

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_no TEXT NOT NULL UNIQUE DEFAULT ('PO-' || lpad(nextval('public.po_seq')::text, 6, '0')),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status public.po_status NOT NULL DEFAULT 'draft',
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po read" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "po write" ON public.purchase_orders FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'));
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty NUMERIC NOT NULL DEFAULT 1,
  received_qty NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "po_items read" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "po_items write" ON public.purchase_order_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.purchase_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipts TO authenticated;
GRANT ALL ON public.purchase_receipts TO service_role;
ALTER TABLE public.purchase_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr read" ON public.purchase_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr write" ON public.purchase_receipts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (true);
CREATE TRIGGER trg_pr_updated BEFORE UPDATE ON public.purchase_receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.purchase_receipt_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES public.purchase_receipts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty NUMERIC NOT NULL DEFAULT 0,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  quality_ok BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_receipt_items TO authenticated;
GRANT ALL ON public.purchase_receipt_items TO service_role;
ALTER TABLE public.purchase_receipt_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pr_items read" ON public.purchase_receipt_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "pr_items write" ON public.purchase_receipt_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  po_id UUID REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
  invoice_no TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  paid NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_invoices TO authenticated;
GRANT ALL ON public.supplier_invoices TO service_role;
ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup_inv read" ON public.supplier_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "sup_inv write" ON public.supplier_invoices FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (true);
CREATE TRIGGER trg_sup_inv_updated BEFORE UPDATE ON public.supplier_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.supplier_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.supplier_invoices(id) ON DELETE SET NULL,
  method public.payment_method NOT NULL DEFAULT 'cash',
  amount NUMERIC NOT NULL DEFAULT 0,
  reference TEXT,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.supplier_payments TO authenticated;
GRANT ALL ON public.supplier_payments TO service_role;
ALTER TABLE public.supplier_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sup_pay read" ON public.supplier_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "sup_pay write" ON public.supplier_payments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'purchases_manager') OR public.has_role(auth.uid(),'accountant'))
  WITH CHECK (true);

-- ============ RECEIPTS (سندات قبض / صرف) ============
CREATE SEQUENCE IF NOT EXISTS public.receipts_seq START 1000;

CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_no TEXT NOT NULL UNIQUE DEFAULT ('RCT-' || lpad(nextval('public.receipts_seq')::text, 6, '0')),
  direction public.receipt_direction NOT NULL,
  party_type public.party_type NOT NULL,
  party_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  method public.payment_method NOT NULL DEFAULT 'cash',
  reference TEXT,
  notes TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts read" ON public.receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "receipts write" ON public.receipts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'accountant') OR public.has_role(auth.uid(),'cashier'))
  WITH CHECK (true);
CREATE TRIGGER trg_receipts_updated BEFORE UPDATE ON public.receipts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ TRIGGERS: sales ↔ stock ↔ customer balance ↔ loyalty ============

-- sale item → stock movement (only for confirmed sales, not quotes)
CREATE OR REPLACE FUNCTION public.sale_item_stock_link()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s_type public.sale_type; s_status public.sale_status; mv_type text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT type, status INTO s_type, s_status FROM public.sales WHERE id = NEW.sale_id;
    IF s_type = 'quote' OR s_status = 'draft' OR s_status = 'void' THEN RETURN NEW; END IF;
    mv_type := CASE WHEN s_type IN ('return','credit_note') THEN 'return' ELSE 'sale' END;
    INSERT INTO public.stock_movements(product_id, type, quantity, reason, reference, user_id)
    VALUES (NEW.product_id, mv_type::text, NEW.qty, 'auto:sale_item', NEW.sale_id::text, auth.uid());
    RETURN NEW;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sale_item_stock ON public.sale_items;
CREATE TRIGGER trg_sale_item_stock AFTER INSERT ON public.sale_items
  FOR EACH ROW EXECUTE FUNCTION public.sale_item_stock_link();

-- purchase receipt item → stock movement
CREATE OR REPLACE FUNCTION public.receipt_item_stock_link()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.stock_movements(product_id, type, quantity, reason, reference, unit_cost, user_id)
  VALUES (NEW.product_id, 'purchase', NEW.qty, 'auto:purchase_receipt', NEW.receipt_id::text, NEW.unit_cost, auth.uid());
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_receipt_item_stock ON public.purchase_receipt_items;
CREATE TRIGGER trg_receipt_item_stock AFTER INSERT ON public.purchase_receipt_items
  FOR EACH ROW EXECUTE FUNCTION public.receipt_item_stock_link();

-- sale payment → update sale.paid/balance/status + customer balance
CREATE OR REPLACE FUNCTION public.recompute_sale_payment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sid uuid; total_paid numeric; s_total numeric; s_customer uuid; delta numeric;
BEGIN
  sid := COALESCE(NEW.sale_id, OLD.sale_id);
  SELECT COALESCE(SUM(amount),0) INTO total_paid FROM public.sale_payments WHERE sale_id = sid;
  SELECT total, customer_id INTO s_total, s_customer FROM public.sales WHERE id = sid;
  UPDATE public.sales SET
    paid = total_paid,
    balance = COALESCE(s_total,0) - total_paid,
    status = CASE
      WHEN total_paid >= COALESCE(s_total,0) AND s_total > 0 THEN 'paid'::public.sale_status
      WHEN total_paid > 0 THEN 'partial'::public.sale_status
      ELSE status END
    WHERE id = sid;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sale_payment_recompute ON public.sale_payments;
CREATE TRIGGER trg_sale_payment_recompute AFTER INSERT OR UPDATE OR DELETE ON public.sale_payments
  FOR EACH ROW EXECUTE FUNCTION public.recompute_sale_payment();

-- receipt → adjust party balance
CREATE OR REPLACE FUNCTION public.apply_receipt_to_balance()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta numeric;
BEGIN
  delta := CASE NEW.direction WHEN 'in' THEN -NEW.amount ELSE NEW.amount END;
  IF NEW.party_type = 'customer' THEN
    UPDATE public.customers SET balance = COALESCE(balance,0) + delta WHERE id = NEW.party_id;
  ELSIF NEW.party_type = 'supplier' THEN
    UPDATE public.suppliers SET balance = COALESCE(balance,0) + (-delta) WHERE id = NEW.party_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_receipt_apply ON public.receipts;
CREATE TRIGGER trg_receipt_apply AFTER INSERT ON public.receipts
  FOR EACH ROW EXECUTE FUNCTION public.apply_receipt_to_balance();

-- suppliers: add balance column if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='suppliers' AND column_name='balance') THEN
    ALTER TABLE public.suppliers ADD COLUMN balance NUMERIC NOT NULL DEFAULT 0;
  END IF;
END $$;
