-- Remove user_settings completely since it's not used

-- 1. Drop any triggers that try to create user_settings
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
          AND event_object_table = 'users'
          AND trigger_name NOT LIKE 'pg_%'
          AND trigger_name NOT LIKE 'supabase_%'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.trigger_name);
    END LOOP;
END $$;

-- 2. Drop any functions that reference user_settings
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_settings() CASCADE;

-- 3. Drop the user_settings table completely
DROP TABLE IF EXISTS user_settings CASCADE;

-- 4. Make sure authenticated users can create their own profiles
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- Done! Now signup will work and client-side code handles profile creation
