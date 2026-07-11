
-- Part A: additive columns + enum values (no usage of new values here)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email_optional TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'ar';

DO $$
DECLARE r RECORD; base TEXT; candidate TEXT; i INT;
BEGIN
  FOR r IN SELECT p.id, u.email FROM public.profiles p JOIN auth.users u ON u.id = p.id WHERE p.username IS NULL LOOP
    base := lower(regexp_replace(coalesce(split_part(r.email, '@', 1), 'user'), '[^a-z0-9_.]+', '_', 'g'));
    IF base = '' THEN base := 'user'; END IF;
    candidate := base; i := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = candidate) LOOP
      i := i + 1; candidate := base || i::text;
    END LOOP;
    UPDATE public.profiles SET username = candidate, email_optional = r.email WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_uniq ON public.profiles (lower(username));

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'branch_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'warehouse_keeper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cashier';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'purchases_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sales_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer_service';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_count INT; uname TEXT; base TEXT; i INT := 0;
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

  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'employee');
  END IF;
  RETURN NEW;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;
