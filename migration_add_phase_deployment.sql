-- Migration: Add phase and deployment_state columns to projects table
-- Run this in your Supabase SQL Editor

-- Add phase column (tracks which phase the user is on: 1=Create, 2=Domain, 3=Deploy)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS phase INTEGER DEFAULT 1;

-- Add deployment_state column (stores deployment information as JSONB)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS deployment_state JSONB DEFAULT '{}'::jsonb;

-- Also change id from UUID to TEXT to support numeric chat IDs
-- First, drop foreign key constraints
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_project_id_fkey;

-- Drop and recreate the id column
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pkey;
ALTER TABLE projects ALTER COLUMN id TYPE TEXT;
ALTER TABLE projects ADD PRIMARY KEY (id);

-- Recreate foreign key
ALTER TABLE payments ALTER COLUMN project_id TYPE TEXT;
ALTER TABLE payments
ADD CONSTRAINT payments_project_id_fkey
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN projects.phase IS 'Current phase: 1=Create, 2=Domain, 3=Deploy';
COMMENT ON COLUMN projects.deployment_state IS 'JSON object containing deployment information';
