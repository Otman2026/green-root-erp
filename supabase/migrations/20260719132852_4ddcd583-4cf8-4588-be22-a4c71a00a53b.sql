
DROP POLICY IF EXISTS "pr write" ON public.purchase_receipts;
CREATE POLICY "pr write" ON public.purchase_receipts FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'purchases_manager') OR has_role(auth.uid(),'warehouse_keeper'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'purchases_manager') OR has_role(auth.uid(),'warehouse_keeper'));

REVOKE EXECUTE ON FUNCTION public.void_sale(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.log_auth_attempt(text, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.void_sale(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_attempt(text, boolean, text) TO authenticated;
