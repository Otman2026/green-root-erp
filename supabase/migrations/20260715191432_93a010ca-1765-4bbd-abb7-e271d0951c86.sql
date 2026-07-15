
-- ============================================================
-- Batch 2 · Security hardening (no functional changes)
-- ============================================================

-- 1) profiles: cross-tenant PII leak. Restrict admin view to same org.
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Org admins view same-org profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.is_system_owner(auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.organization_members me
      JOIN public.organization_members them
        ON them.organization_id = me.organization_id
      WHERE me.user_id = auth.uid()
        AND them.user_id = profiles.id
        AND public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  );

-- 2) user_roles: privilege escalation. Only system_owner grants admin/owner.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;

CREATE POLICY "System owner manages elevated roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.is_system_owner(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      AND role NOT IN ('admin'::public.app_role, 'owner'::public.app_role, 'system_owner'::public.app_role)
    )
  )
  WITH CHECK (
    public.is_system_owner(auth.uid())
    OR (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      AND role NOT IN ('admin'::public.app_role, 'owner'::public.app_role, 'system_owner'::public.app_role)
    )
  );

-- 3) SECURITY DEFINER functions: revoke EXECUTE from anon on trigger-only helpers
--    (they are invoked by triggers as table owner; direct anon EXECUTE isn't needed).
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'apply_stock_movement()',
    'apply_receipt_to_balance()',
    'apply_cash_movement()',
    'apply_bank_transaction()',
    'apply_stock_transfer_complete()',
    'sale_item_stock_link()',
    'receipt_item_stock_link()',
    'recompute_sale_payment()',
    'update_vehicle_last_gps()',
    'handle_new_user()',
    'guard_system_owner_role()',
    'tg_set_organization_id()',
    'tg_audit_row()',
    'update_updated_at_column()'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      -- skip missing overloads gracefully
      NULL;
    END;
  END LOOP;
END $$;

-- 4) SECURITY DEFINER helpers callable from app: revoke from anon only.
--    Keep authenticated EXECUTE so RLS policies and app queries keep working.
DO $$
DECLARE fn text;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'has_role(uuid, app_role)',
    'has_permission(uuid, text)',
    'current_org_id()',
    'is_system_owner(uuid)',
    'is_org_member(uuid, uuid)',
    'is_org_owner(uuid, uuid)',
    'license_is_active(uuid)',
    'is_read_only()',
    'acc_can_write()',
    'agri_can_write()',
    'pos_apply_customer_updates(uuid, numeric, integer)',
    'generate_license_key()'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT  EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      NULL;
    END;
  END LOOP;
END $$;

-- 5) log_auth_attempt / check_rate_limit MUST stay callable by anon (used during sign-in).
GRANT EXECUTE ON FUNCTION public.log_auth_attempt(text, boolean, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO anon, authenticated;

-- 6) Defense-in-depth: revoke anon SELECT on clearly-sensitive business tables.
--    RLS already blocks row reads for anon on these, but removing the table-level
--    grant eliminates the entire attack surface for accidentally-permissive policies.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'accounts','audit_logs','auth_attempts','bank_accounts','bank_transactions',
    'cash_boxes','cash_movements','checks','customers','fiscal_periods',
    'hr_attendance','hr_bonuses','hr_departments','hr_documents','hr_employees',
    'hr_leaves','hr_payroll','hr_positions','journal_entries','journal_lines',
    'licenses','loyalty_transactions','notifications','organization_members',
    'password_resets','profiles','purchase_order_items','purchase_orders',
    'purchase_receipt_items','purchase_receipts','receipts','sale_installments',
    'sale_items','sale_payments','sales','sales_commissions','sales_reps',
    'sales_visits','stock_movements','stock_transfer_items','stock_transfers',
    'stocktake_lines','stocktakes','subscriptions','supplier_invoices',
    'supplier_payments','suppliers','user_roles','coupon_redemptions',
    'fleet_drivers','fleet_fuel_logs','fleet_gps_positions','fleet_maintenance',
    'fleet_trips','fleet_vehicles','activity_log','branch_members'
  ]
  LOOP
    BEGIN
      EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXCEPTION WHEN undefined_table THEN NULL;
    END;
  END LOOP;
END $$;
