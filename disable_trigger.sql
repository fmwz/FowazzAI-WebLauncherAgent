-- Disable the problematic trigger that's causing signup failures
-- The client-side code will create user profiles instead

-- Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Keep the function but don't use it
-- (in case you want to re-enable later)

-- Make sure the INSERT policy exists for client-side profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
