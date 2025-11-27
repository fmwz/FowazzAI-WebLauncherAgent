-- Migration: Add subscription tracking and website counter
-- Run this in your Supabase SQL Editor

-- 1. Add columns to subscriptions table for tracking
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS max_websites INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS websites_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'pro';

-- 2. Update existing subscriptions to have the correct defaults
UPDATE subscriptions
SET max_websites = 3,
    websites_used = 0,
    plan_name = 'pro'
WHERE max_websites IS NULL;

-- 3. Create a function to get remaining websites for a user
CREATE OR REPLACE FUNCTION get_websites_remaining(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  SELECT (max_websites - websites_used)
  INTO remaining
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  LIMIT 1;

  -- If no active subscription, return 0
  RETURN COALESCE(remaining, 0);
END;
$$;

-- 4. Create a function to increment websites used (called when Deploy Now is clicked)
CREATE OR REPLACE FUNCTION increment_websites_used(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  -- Check if user has websites remaining
  SELECT (max_websites - websites_used)
  INTO remaining
  FROM subscriptions
  WHERE user_id = user_uuid
  AND status = 'active'
  LIMIT 1;

  -- If no remaining websites, return false
  IF remaining IS NULL OR remaining <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Increment websites_used
  UPDATE subscriptions
  SET websites_used = websites_used + 1,
      updated_at = NOW()
  WHERE user_id = user_uuid
  AND status = 'active';

  RETURN TRUE;
END;
$$;

-- 5. Create a function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_active BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1
    FROM subscriptions
    WHERE user_id = user_uuid
    AND status = 'active'
    AND (current_period_end IS NULL OR current_period_end > NOW())
  ) INTO is_active;

  RETURN is_active;
END;
$$;

-- 6. Grant execute permissions
GRANT EXECUTE ON FUNCTION get_websites_remaining(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_websites_used(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_active_subscription(UUID) TO authenticated;

-- Done! Now you can:
-- - Call get_websites_remaining(user_id) to get remaining websites
-- - Call increment_websites_used(user_id) when Deploy Now is clicked
-- - Call has_active_subscription(user_id) to check if user can access Phase 3
