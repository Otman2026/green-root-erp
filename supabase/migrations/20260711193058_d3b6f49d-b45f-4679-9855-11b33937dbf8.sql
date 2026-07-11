
-- Temporarily drop the guard so we can seed the very first system_owner.
DROP TRIGGER IF EXISTS trg_guard_system_owner ON public.user_roles;

INSERT INTO public.user_roles(user_id, role)
SELECT p.id, 'system_owner'::public.app_role
FROM public.profiles p
ORDER BY p.created_at ASC
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

-- Re-attach the guard.
CREATE TRIGGER trg_guard_system_owner
  BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.guard_system_owner_role();
