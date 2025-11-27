-- Step 1: Check if user_settings table actually exists
SELECT table_name, table_schema
FROM information_schema.tables
WHERE table_name = 'user_settings';

-- Step 2: List ALL triggers on auth.users
SELECT
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_schema = 'auth'
  AND t.event_object_table = 'users'
ORDER BY t.trigger_name;

-- Step 3: List all functions that might be called by these triggers
SELECT
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%user%'
    OR p.proname LIKE '%setting%'
    OR p.proname LIKE '%handle%'
  )
ORDER BY p.proname;
