-- FINAL COMPREHENSIVE SIGNUP FIX
-- This removes ALL possible blockers

-- 1. Drop ALL triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- 2. Check for and drop the function too
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 3. Make sure user_profiles table allows NULL values
ALTER TABLE user_profiles
  ALTER COLUMN email DROP NOT NULL;

-- 4. Remove any conflicting policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- 5. Add the correct INSERT policy
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO anon;

-- 7. Verify RLS is enabled but permissive
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Test by creating a new account after running this!
-- The client-side code will create the profile automatically
