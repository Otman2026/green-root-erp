
-- Helper: read-only mode when license is not active
CREATE OR REPLACE FUNCTION public.is_read_only()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT NOT public.license_is_active(public.current_org_id())
$$;

-- Trigger: auto-fill organization_id on insert, prevent change on update
CREATE OR REPLACE FUNCTION public.tg_set_organization_id()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL THEN
      NEW.organization_id := public.current_org_id();
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id
       AND NOT public.is_system_owner(auth.uid()) THEN
      NEW.organization_id := OLD.organization_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Apply restrictive tenant-isolation policy + auto-fill trigger to every table with organization_id
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'accounts','activity_log','agri_diseases','agri_pests','agri_plant_categories',
    'agri_plant_varieties','agri_plants','agri_treatments','app_settings',
    'bank_accounts','bank_transactions','branch_members','branches','cash_boxes',
    'cash_movements','categories','checks','coupon_redemptions','coupons','customers',
    'fiscal_periods','fleet_drivers','fleet_fuel_logs','fleet_gps_positions',
    'fleet_maintenance','fleet_trips','fleet_vehicles','hr_attendance','hr_bonuses',
    'hr_departments','hr_documents','hr_employees','hr_leaves','hr_payroll',
    'hr_positions','journal_entries','journal_lines','loyalty_rules','loyalty_transactions',
    'notifications','price_list_items','price_lists','product_batches','product_documents',
    'product_images','product_locations','products','purchase_order_items','purchase_orders',
    'purchase_receipt_items','purchase_receipts','receipts','sale_installments','sale_items',
    'sale_payments','sales','sales_commissions','sales_reps','sales_visits','stock_movements',
    'stock_transfer_items','stock_transfers','stocktake_lines','stocktakes','supplier_invoices',
    'supplier_payments','suppliers','tax_rates','warehouse_aisles','warehouse_bins',
    'warehouse_racks','warehouse_shelves','warehouse_zones','warehouses'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- Drop old versions if exist
    EXECUTE format('DROP POLICY IF EXISTS "tenant_isolation" ON public.%I', t);
    EXECUTE format('DROP TRIGGER IF EXISTS set_org_id_%I ON public.%I', t, t);

    -- Restrictive policy: must belong to current org (or system owner)
    EXECUTE format($f$
      CREATE POLICY "tenant_isolation" ON public.%I
      AS RESTRICTIVE
      FOR ALL
      TO authenticated
      USING (
        public.is_system_owner(auth.uid())
        OR organization_id IS NULL
        OR organization_id = public.current_org_id()
      )
      WITH CHECK (
        public.is_system_owner(auth.uid())
        OR organization_id IS NULL
        OR organization_id = public.current_org_id()
      )
    $f$, t);

    -- Auto-fill trigger
    EXECUTE format($f$
      CREATE TRIGGER set_org_id_%I
      BEFORE INSERT OR UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.tg_set_organization_id()
    $f$, t, t);
  END LOOP;
END $$;
