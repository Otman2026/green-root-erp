-- Backfill missing roles: earliest user without a role becomes admin,
-- all other role-less users become employees. Idempotent.
INSERT INTO public.user_roles (user_id, role)
SELECT u.id,
  CASE
    WHEN NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
      AND u.id = (
        SELECT u2.id FROM auth.users u2
        LEFT JOIN public.user_roles r2 ON r2.user_id = u2.id
        WHERE r2.user_id IS NULL
        ORDER BY u2.created_at ASC
        LIMIT 1
      )
    THEN 'admin'::public.app_role
    ELSE 'employee'::public.app_role
  END
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL;