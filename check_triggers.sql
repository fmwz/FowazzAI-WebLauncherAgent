-- First, let's see what's actually causing the error
-- Run this to check existing triggers

SELECT
    t.trigger_name,
    t.event_manipulation,
    t.action_timing,
    t.action_statement,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM information_schema.triggers t
LEFT JOIN pg_proc p ON t.action_statement LIKE '%' || p.proname || '%'
WHERE t.event_object_schema = 'auth'
  AND t.event_object_table = 'users';
