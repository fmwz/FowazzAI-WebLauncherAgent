-- Simple Database Fix for Fowazz
-- Copy and paste this into Supabase SQL Editor

-- Add missing columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS phase INTEGER DEFAULT 1;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deployment_state JSONB DEFAULT '{}'::jsonb;

-- That's it! Your old projects will now load properly.
