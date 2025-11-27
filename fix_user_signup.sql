-- Fix for "Database error saving new user"
-- Run this in your Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON user_profiles;

-- Add INSERT policy for user_profiles
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Also add a policy to allow service role to insert (for triggers)
CREATE POLICY "Service role can insert profiles"
  ON user_profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Grant necessary permissions to postgres role
GRANT ALL ON user_profiles TO postgres;

-- Recreate the trigger function that bypasses RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  insert_result INTEGER;
BEGIN
  -- Disable RLS for this operation by using a direct insert
  -- This runs as the function owner (postgres) which bypasses RLS
  INSERT INTO public.user_profiles (id, email, full_name, trial_ends_at, has_had_trial)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULL,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
