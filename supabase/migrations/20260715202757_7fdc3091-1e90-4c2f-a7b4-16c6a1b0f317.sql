
CREATE OR REPLACE FUNCTION public.void_sale(_sale_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s RECORD;
  it RECORD;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin')
       OR public.has_role(auth.uid(),'owner')
       OR public.has_role(auth.uid(),'sales_manager')) THEN
    RAISE EXCEPTION 'insufficient_privilege';
  END IF;

  SELECT * INTO s FROM public.sales WHERE id = _sale_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'sale_not_found'; END IF;
  IF s.status = 'void' THEN RETURN; END IF;
  IF s.type = 'quote' OR s.status = 'draft' THEN
    UPDATE public.sales SET status = 'void' WHERE id = _sale_id;
    RETURN;
  END IF;

  -- Reverse stock: for each line, insert an adjustment that undoes the original delta
  FOR it IN SELECT product_id, qty FROM public.sale_items WHERE sale_id = _sale_id LOOP
    IF s.type IN ('return','credit_note') THEN
      -- original added stock; remove it
      INSERT INTO public.stock_movements(product_id, type, quantity, reason, reference, user_id)
      VALUES (it.product_id, 'adjustment', -it.qty, 'void_return', _sale_id::text, auth.uid());
    ELSE
      -- original reduced stock; add it back
      INSERT INTO public.stock_movements(product_id, type, quantity, reason, reference, user_id)
      VALUES (it.product_id, 'adjustment', it.qty, 'void_sale', _sale_id::text, auth.uid());
    END IF;
  END LOOP;

  -- Reverse customer balance and loyalty points
  IF s.customer_id IS NOT NULL THEN
    PERFORM public.pos_apply_customer_updates(
      s.customer_id,
      -COALESCE(s.balance, 0),
      -FLOOR(COALESCE(s.total, 0) / 100)::int
    );
  END IF;

  UPDATE public.sales
     SET status = 'void', balance = 0
   WHERE id = _sale_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.void_sale(uuid) TO authenticated;
