-- ==============================================================================
-- Game Store Zarzis - SQL Migration (Profiles & Staff Settings)
-- Description: Adds the omitted 'email' field to the profiles table, 
-- synchronizes it securely with the hidden auth.users schemas, and setups a 
-- constant refresh trigger.
-- ==============================================================================

-- 1. Add email column to profiles (allows frontend to fetch without restricted Auth queries)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- 2. Secure Function to Backfill and Sync from Auth context
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, created_at)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'System User'),
    new.email,
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE 
  SET email = EXCLUDED.email;
  
  RETURN new;
END;
$$;

-- 3. Trigger implementation to auto-fire the sync whenever a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Manual execution block: Backfill ALL currently existing system profiles with their emails
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id, email FROM auth.users LOOP
    UPDATE public.profiles p
    SET email = user_record.email
    WHERE p.id = user_record.id AND p.email IS NULL;
  END LOOP;
END;
$$;
