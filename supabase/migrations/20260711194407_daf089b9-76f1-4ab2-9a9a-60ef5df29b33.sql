
CREATE OR REPLACE FUNCTION public.tg_audit_row()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE
  v_org uuid;
  v_row_id text;
BEGIN
  BEGIN
    v_org := COALESCE((to_jsonb(COALESCE(NEW, OLD)) ->> 'organization_id')::uuid, public.current_org_id());
  EXCEPTION WHEN OTHERS THEN v_org := public.current_org_id();
  END;
  v_row_id := COALESCE(to_jsonb(COALESCE(NEW, OLD)) ->> 'id', '');

  INSERT INTO public.audit_logs (organization_id, user_id, action, table_name, record_id, old_data, new_data)
  VALUES (
    v_org, auth.uid(), lower(TG_OP), TG_TABLE_NAME, v_row_id,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'sales','purchase_orders','receipts','sale_payments','supplier_payments',
    'licenses','organizations','user_roles','journal_entries','stock_transfers',
    'products','customers','suppliers'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS audit_%I ON public.%I', t, t);
    EXECUTE format($f$
      CREATE TRIGGER audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.tg_audit_row()
    $f$, t, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _username text, _max_attempts int DEFAULT 5, _window_minutes int DEFAULT 15
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public
AS $$
DECLARE cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt FROM public.auth_attempts
    WHERE username = _username
      AND created_at > now() - (_window_minutes || ' minutes')::interval
      AND success = false;
  RETURN cnt < _max_attempts;
END $$;

CREATE OR REPLACE FUNCTION public.log_auth_attempt(_username text, _success boolean, _ip text DEFAULT NULL)
RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public
AS $$
  INSERT INTO public.auth_attempts(username, success, ip) VALUES (_username, _success, _ip);
$$;

GRANT EXECUTE ON FUNCTION public.check_rate_limit(text,int,int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_attempt(text,boolean,text) TO anon, authenticated;
