-- Migration: Add plan tracking and website limits
-- Add plan_name and website_limit columns to subscriptions table

ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS plan_name TEXT DEFAULT 'lite',
ADD COLUMN IF NOT EXISTS website_limit INTEGER DEFAULT 1;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_name ON subscriptions(plan_name);

-- Update existing records to set default plan
UPDATE subscriptions
SET plan_name = 'lite', website_limit = 1
WHERE plan_name IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN subscriptions.plan_name IS 'Plan tier: lite, pro, or max';
COMMENT ON COLUMN subscriptions.website_limit IS 'Maximum number of websites allowed for this plan';
