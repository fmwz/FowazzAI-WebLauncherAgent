-- NUCLEAR OPTION: Disable ALL custom triggers on auth.users
-- This will let users sign up, and the client-side code will handle profile creation

-- Disable ALL triggers on auth.users (except system triggers)
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_schema = 'auth'
          AND event_object_table = 'users'
          AND trigger_name NOT LIKE 'pg_%'  -- Don't touch PostgreSQL system triggers
          AND trigger_name NOT LIKE 'supabase_%'  -- Don't touch Supabase system triggers
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON auth.users CASCADE', trigger_record.trigger_name);
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Also drop the problematic functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_settings() CASCADE;

-- Make sure our client-side code can create profiles
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_settings TO authenticated;
GRANT ALL ON user_settings TO anon;

-- Done! Test signup now - the client-side code will handle everything
