
CREATE OR REPLACE FUNCTION public.pos_apply_customer_updates(
  _customer_id uuid,
  _balance_delta numeric,
  _points_delta integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _customer_id IS NULL THEN RETURN; END IF;
  UPDATE public.customers
    SET balance = COALESCE(balance, 0) + COALESCE(_balance_delta, 0),
        loyalty_points = COALESCE(loyalty_points, 0) + COALESCE(_points_delta, 0)
    WHERE id = _customer_id;
END $$;

GRANT EXECUTE ON FUNCTION public.pos_apply_customer_updates(uuid, numeric, integer) TO authenticated;
