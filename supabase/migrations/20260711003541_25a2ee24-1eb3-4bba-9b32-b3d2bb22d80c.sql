
-- Permissions catalog
CREATE TABLE IF NOT EXISTS public.permissions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  label_ar TEXT,
  label_fr TEXT,
  category TEXT
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "perm_read" ON public.permissions;
CREATE POLICY "perm_read" ON public.permissions FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role public.app_role NOT NULL,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rp_read" ON public.role_permissions;
CREATE POLICY "rp_read" ON public.role_permissions FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "rp_admin" ON public.role_permissions;
CREATE POLICY "rp_admin" ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role = ur.role
    WHERE ur.user_id = _user_id AND rp.permission_key = _perm
  )
$$;

-- Branches
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_ar TEXT,
  code TEXT UNIQUE,
  city TEXT, address TEXT, phone TEXT, email TEXT,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branches TO authenticated;
GRANT ALL ON public.branches TO service_role;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "br_read" ON public.branches FOR SELECT TO authenticated USING (true);
CREATE POLICY "br_ins" ON public.branches FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "br_upd" ON public.branches FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'branch_manager')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'branch_manager'));
CREATE POLICY "br_del" ON public.branches FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE TRIGGER trg_branches_upd BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.branch_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (branch_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.branch_members TO authenticated;
GRANT ALL ON public.branch_members TO service_role;
ALTER TABLE public.branch_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bm_read" ON public.branch_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "bm_all" ON public.branch_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'branch_manager'));

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  name TEXT NOT NULL, name_ar TEXT, code TEXT UNIQUE, address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh_read" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "wh_all" ON public.warehouses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper') OR public.has_role(auth.uid(),'branch_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper') OR public.has_role(auth.uid(),'branch_manager'));
CREATE TRIGGER trg_wh_upd BEFORE UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.warehouse_aisles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.warehouse_racks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aisle_id UUID NOT NULL REFERENCES public.warehouse_aisles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.warehouse_shelves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rack_id UUID NOT NULL REFERENCES public.warehouse_racks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.warehouse_bins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shelf_id UUID NOT NULL REFERENCES public.warehouse_shelves(id) ON DELETE CASCADE,
  name TEXT NOT NULL, code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['warehouse_zones','warehouse_aisles','warehouse_racks','warehouse_shelves','warehouse_bins']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "whx_read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format($p$CREATE POLICY "whx_all" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper') OR public.has_role(auth.uid(),'branch_manager'))
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper') OR public.has_role(auth.uid(),'branch_manager'))$p$, t);
  END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.product_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bin_id UUID NOT NULL REFERENCES public.warehouse_bins(id) ON DELETE CASCADE,
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, bin_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_locations TO authenticated;
GRANT ALL ON public.product_locations TO service_role;
ALTER TABLE public.product_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pl_read" ON public.product_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "pl_all" ON public.product_locations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper'));
CREATE TRIGGER trg_pl_upd BEFORE UPDATE ON public.product_locations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Stock movements
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='stock_movement_type') THEN
    CREATE TYPE public.stock_movement_type AS ENUM ('purchase','sale','transfer','return','damage','adjustment','stocktake');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.product_batches(id) ON DELETE SET NULL,
  from_bin_id UUID REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  to_bin_id UUID REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  from_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  to_warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  type public.stock_movement_type NOT NULL,
  quantity NUMERIC NOT NULL,
  reason TEXT, reference TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sm_read" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "sm_ins" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "sm_upd" ON public.stock_movements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE POLICY "sm_del" ON public.stock_movements FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner'));
CREATE INDEX IF NOT EXISTS sm_product_idx ON public.stock_movements(product_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.apply_stock_movement()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE delta NUMERIC;
BEGIN
  delta := CASE NEW.type
    WHEN 'purchase' THEN NEW.quantity
    WHEN 'sale' THEN -NEW.quantity
    WHEN 'return' THEN NEW.quantity
    WHEN 'damage' THEN -NEW.quantity
    WHEN 'adjustment' THEN NEW.quantity
    WHEN 'stocktake' THEN NEW.quantity
    ELSE 0
  END;
  IF delta <> 0 THEN
    UPDATE public.products SET stock_quantity = COALESCE(stock_quantity,0) + delta WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_apply_movement AFTER INSERT ON public.stock_movements FOR EACH ROW EXECUTE FUNCTION public.apply_stock_movement();

-- Stocktakes
CREATE TABLE IF NOT EXISTS public.stocktakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.stocktake_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stocktake_id UUID NOT NULL REFERENCES public.stocktakes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bin_id UUID REFERENCES public.warehouse_bins(id) ON DELETE SET NULL,
  system_qty NUMERIC NOT NULL DEFAULT 0,
  counted_qty NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['stocktakes','stocktake_lines']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "st_read" ON public.%I FOR SELECT TO authenticated USING (true)', t);
    EXECUTE format($p$CREATE POLICY "st_all" ON public.%I FOR ALL TO authenticated
      USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper'))
      WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'warehouse_keeper'))$p$, t);
  END LOOP;
END $$;
CREATE TRIGGER trg_stocktakes_upd BEFORE UPDATE ON public.stocktakes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
