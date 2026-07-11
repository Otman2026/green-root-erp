
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='system_owner' AND enumtypid = (SELECT oid FROM pg_type WHERE typname='app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'system_owner';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL, slug text UNIQUE NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  phone text, email text, address text, logo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('owner','manager','employee')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.plans(id) ON DELETE SET NULL,
  license_key text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','expired','cancelled')),
  is_trial boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz, notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS licenses_org_idx ON public.licenses(organization_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  action text NOT NULL, entity text, entity_id text,
  ip text, user_agent text, meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_org_idx ON public.audit_logs(organization_id, created_at DESC);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text, ip text, success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_lookup ON public.auth_attempts(username, created_at DESC);
GRANT ALL ON public.auth_attempts TO service_role;
ALTER TABLE public.auth_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email','sms','manual')),
  expires_at timestamptz NOT NULL, used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pwd_resets_user_idx ON public.password_resets(user_id, created_at DESC);
GRANT ALL ON public.password_resets TO service_role;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

INSERT INTO public.plans(code, name, price_monthly, price_yearly, is_active, sort_order)
VALUES
 ('trial','Trial (15 days)', 0, 0, true, 1),
 ('monthly','Monthly', 100, 0, true, 2),
 ('semi','Semi-annual', 90, 0, true, 3),
 ('yearly','Yearly', 80, 900, true, 4)
ON CONFLICT (code) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_system_owner(_uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid AND role::text = 'system_owner')
$$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT organization_id FROM public.organization_members
   WHERE user_id = auth.uid()
   ORDER BY (role='owner') DESC, created_at ASC LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_uid)
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_org uuid, _uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id=_org AND user_id=_uid AND role='owner')
$$;

CREATE OR REPLACE FUNCTION public.license_is_active(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.licenses
     WHERE organization_id = _org AND status='active'
       AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text LANGUAGE sql VOLATILE AS $$
  SELECT 'HAYTAM-' || upper(encode(gen_random_bytes(4),'hex')) || '-' || upper(encode(gen_random_bytes(4),'hex')) || '-' || upper(encode(gen_random_bytes(4),'hex'))
$$;

CREATE POLICY "org read" ON public.organizations FOR SELECT USING (public.is_system_owner() OR public.is_org_member(id));
CREATE POLICY "org update" ON public.organizations FOR UPDATE USING (public.is_system_owner() OR public.is_org_owner(id)) WITH CHECK (public.is_system_owner() OR public.is_org_owner(id));
CREATE POLICY "org insert system" ON public.organizations FOR INSERT WITH CHECK (public.is_system_owner());
CREATE POLICY "org delete system" ON public.organizations FOR DELETE USING (public.is_system_owner());

CREATE POLICY "members read" ON public.organization_members FOR SELECT USING (public.is_system_owner() OR public.is_org_member(organization_id));
CREATE POLICY "members manage" ON public.organization_members FOR ALL USING (public.is_system_owner() OR public.is_org_owner(organization_id)) WITH CHECK (public.is_system_owner() OR public.is_org_owner(organization_id));

CREATE POLICY "licenses read" ON public.licenses FOR SELECT USING (public.is_system_owner() OR public.is_org_member(organization_id));
CREATE POLICY "licenses manage" ON public.licenses FOR ALL USING (public.is_system_owner()) WITH CHECK (public.is_system_owner());

CREATE POLICY "audit read" ON public.audit_logs FOR SELECT USING (public.is_system_owner() OR (organization_id IS NOT NULL AND public.is_org_owner(organization_id)));

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plans' AND policyname='plans read all') THEN
    CREATE POLICY "plans read all" ON public.plans FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plans' AND policyname='plans manage system') THEN
    CREATE POLICY "plans manage system" ON public.plans FOR ALL USING (public.is_system_owner()) WITH CHECK (public.is_system_owner());
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.guard_system_owner_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing_count int;
BEGIN
  IF TG_OP IN ('INSERT','UPDATE') AND NEW.role::text = 'system_owner' THEN
    IF NOT public.is_system_owner(auth.uid()) THEN
      RAISE EXCEPTION 'Only System Owner can assign system_owner role';
    END IF;
    SELECT COUNT(*) INTO existing_count FROM public.user_roles WHERE role::text='system_owner' AND user_id != NEW.user_id;
    IF existing_count > 0 THEN
      RAISE EXCEPTION 'Only one System Owner is allowed';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' AND OLD.role::text = 'system_owner' THEN
    IF NOT public.is_system_owner(auth.uid()) THEN
      RAISE EXCEPTION 'Only System Owner can remove system_owner role';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;
DROP TRIGGER IF EXISTS trg_guard_system_owner ON public.user_roles;
CREATE TRIGGER trg_guard_system_owner
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_system_owner_role();

DO $$
DECLARE t text; tbls text[] := ARRAY[
  'products','customers','suppliers','categories','sales','sale_items','sale_payments','sale_installments',
  'purchase_orders','purchase_order_items','purchase_receipts','purchase_receipt_items','supplier_invoices','supplier_payments',
  'stock_movements','stock_transfers','stock_transfer_items','stocktakes','stocktake_lines',
  'warehouses','warehouse_zones','warehouse_aisles','warehouse_racks','warehouse_shelves','warehouse_bins',
  'branches','branch_members','price_lists','price_list_items','coupons','coupon_redemptions','loyalty_rules','loyalty_transactions',
  'receipts','checks','cash_boxes','cash_movements','bank_accounts','bank_transactions',
  'accounts','journal_entries','journal_lines','fiscal_periods','tax_rates',
  'hr_departments','hr_positions','hr_employees','hr_attendance','hr_leaves','hr_payroll','hr_bonuses','hr_documents',
  'fleet_vehicles','fleet_drivers','fleet_trips','fleet_fuel_logs','fleet_maintenance','fleet_gps_positions',
  'sales_reps','sales_visits','sales_commissions',
  'agri_plants','agri_plant_categories','agri_plant_varieties','agri_diseases','agri_pests','agri_treatments',
  'product_batches','product_documents','product_images','product_locations',
  'notifications','activity_log','app_settings','subscriptions'];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=t) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id uuid', t);
    END IF;
  END LOOP;
END $$;

DO $$
DECLARE v_org uuid; v_owner uuid; v_plan uuid; t text;
  tbls text[] := ARRAY[
    'products','customers','suppliers','categories','sales','sale_items','sale_payments','sale_installments',
    'purchase_orders','purchase_order_items','purchase_receipts','purchase_receipt_items','supplier_invoices','supplier_payments',
    'stock_movements','stock_transfers','stock_transfer_items','stocktakes','stocktake_lines',
    'warehouses','warehouse_zones','warehouse_aisles','warehouse_racks','warehouse_shelves','warehouse_bins',
    'branches','branch_members','price_lists','price_list_items','coupons','coupon_redemptions','loyalty_rules','loyalty_transactions',
    'receipts','checks','cash_boxes','cash_movements','bank_accounts','bank_transactions',
    'accounts','journal_entries','journal_lines','fiscal_periods','tax_rates',
    'hr_departments','hr_positions','hr_employees','hr_attendance','hr_leaves','hr_payroll','hr_bonuses','hr_documents',
    'fleet_vehicles','fleet_drivers','fleet_trips','fleet_fuel_logs','fleet_maintenance','fleet_gps_positions',
    'sales_reps','sales_visits','sales_commissions',
    'agri_plants','agri_plant_categories','agri_plant_varieties','agri_diseases','agri_pests','agri_treatments',
    'product_batches','product_documents','product_images','product_locations',
    'notifications','activity_log','app_settings','subscriptions'];
BEGIN
  SELECT p.id INTO v_owner FROM public.profiles p ORDER BY p.created_at ASC LIMIT 1;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.organizations(name, slug, owner_user_id)
    VALUES ('Default Organization', 'default', v_owner)
    ON CONFLICT (slug) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id
    RETURNING id INTO v_org;

    INSERT INTO public.organization_members(organization_id, user_id, role)
    SELECT v_org, p.id, CASE WHEN p.id = v_owner THEN 'owner' ELSE 'employee' END
    FROM public.profiles p
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    SELECT id INTO v_plan FROM public.plans WHERE code = 'yearly' LIMIT 1;

    INSERT INTO public.licenses(organization_id, plan_id, license_key, status, starts_at, expires_at, is_trial, created_by)
    VALUES (v_org, v_plan, public.generate_license_key(), 'active', now(), now() + interval '1 year', false, v_owner);

    FOREACH t IN ARRAY tbls LOOP
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name=t AND column_name='organization_id') THEN
        EXECUTE format('UPDATE public.%I SET organization_id = %L WHERE organization_id IS NULL', t, v_org);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', t);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET DEFAULT public.current_org_id()', t);
        EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(organization_id)', t||'_org_idx', t);
      END IF;
    END LOOP;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uname text; base text; i int := 0;
  v_org uuid; v_plan uuid; v_slug text; user_count int;
BEGIN
  uname := lower(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)));
  uname := regexp_replace(uname, '[^a-z0-9_.]+', '_', 'g');
  IF uname IS NULL OR uname = '' THEN uname := 'user'; END IF;
  base := uname;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = uname) LOOP
    i := i + 1; uname := base || i::text;
  END LOOP;

  INSERT INTO public.profiles (id, full_name, avatar_url, username, phone, email_optional, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', base),
    NEW.raw_user_meta_data->>'avatar_url',
    uname,
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.email LIKE '%@haytam.local' THEN NULL ELSE NEW.email END,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language','ar')
  );

  SELECT COUNT(*) INTO user_count FROM public.user_roles WHERE role::text != 'system_owner';
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;

  v_slug := uname; i := 0;
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_slug) LOOP
    i := i + 1; v_slug := uname || '-' || i::text;
  END LOOP;

  INSERT INTO public.organizations(name, slug, owner_user_id)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'org_name', uname || '''s Organization'), v_slug, NEW.id)
  RETURNING id INTO v_org;

  INSERT INTO public.organization_members(organization_id, user_id, role)
  VALUES (v_org, NEW.id, 'owner');

  SELECT id INTO v_plan FROM public.plans WHERE code = 'trial' LIMIT 1;

  INSERT INTO public.licenses(organization_id, plan_id, license_key, status, is_trial, starts_at, expires_at, created_by)
  VALUES (v_org, v_plan, public.generate_license_key(), 'active', true, now(), now() + interval '15 days', NEW.id);

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_org_updated ON public.organizations;
CREATE TRIGGER trg_org_updated BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS trg_lic_updated ON public.licenses;
CREATE TRIGGER trg_lic_updated BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
