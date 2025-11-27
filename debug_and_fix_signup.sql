-- COMPREHENSIVE FIX for signup issues
-- Run this in Supabase SQL Editor

-- Step 1: Check what triggers exist on auth.users
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND event_object_schema = 'auth';

-- Step 2: DROP ALL triggers on auth.users that create user_profiles
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT trigger_name
        FROM information_schema.triggers
        WHERE event_object_table = 'users'
          AND event_object_schema = 'auth'
          AND trigger_name LIKE '%user%'
    ) LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- Step 3: Make user_profiles columns nullable to prevent constraint violations
ALTER TABLE user_profiles
  ALTER COLUMN email DROP NOT NULL;

ALTER TABLE user_profiles
  ALTER COLUMN full_name DROP NOT NULL;

-- Step 4: Ensure INSERT policy exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 5: Grant permissions
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO postgres;

-- Done! Now test signup
